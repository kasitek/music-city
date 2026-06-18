"use client";

import { useEffect, useRef, useState } from "react";
import type { TrackSummary } from "@music-city/shared";
import Hls from "hls.js";
import {
  LoaderCircle,
  Music2,
  Pause,
  Play,
  RefreshCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { playbackApi } from "@/features/playback/lib/playback-api";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiClientError } from "@/lib/api/http-client";

interface DashboardTrackShelvesProps {
  tracks: TrackSummary[];
  onTrackSynced: (track: TrackSummary) => void;
}

const formatClock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const formatStatus = (track: TrackSummary) => {
  if (track.playbackReady) {
    return "Ready";
  }

  if (track.muxAssetStatus === "asset_created") {
    return "Mux processing";
  }

  if (track.muxAssetStatus === "waiting") {
    return "Upload received";
  }

  if (track.muxAssetStatus === "errored") {
    return "Needs attention";
  }

  return track.status;
};

const TrackArt = ({ track }: { track: TrackSummary }) => {
  if (track.coverImageUrl) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${track.coverImageUrl})` }}
      />
    );
  }

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.28),_transparent_52%),linear-gradient(180deg,_rgba(15,23,42,0.15),_rgba(15,23,42,0.94))]" />
  );
};

const TrackRow = ({
  title,
  description,
  tracks,
  activeTrackId,
  syncingTrackId,
  onPlay,
  onSync,
}: {
  title: string;
  description: string;
  tracks: TrackSummary[];
  activeTrackId: string | null;
  syncingTrackId: string | null;
  onPlay: (track: TrackSummary) => Promise<void>;
  onSync: (track: TrackSummary) => Promise<void>;
}) => {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-3">
        {tracks.map((track) => (
          <article
            key={track.id}
            className="group relative min-w-[280px] max-w-[280px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
          >
            <div className="relative h-[180px] overflow-hidden">
              <TrackArt track={track} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/28 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-300 backdrop-blur">
                {track.genre}
              </div>
              <button
                type="button"
                className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg transition group-hover:scale-105"
                onClick={() => void (track.playbackReady ? onPlay(track) : onSync(track))}
              >
                {track.playbackReady ? <Play className="h-5 w-5 fill-current" /> : <RefreshCw className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-1">
                <h4 className="truncate text-xl font-semibold text-white">{track.title}</h4>
                <p className="truncate text-sm text-slate-400">{track.artistName}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span className="capitalize">{formatStatus(track)}</span>
                <span>{track.runtime}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-sm text-emerald-300">
                  {track.priceLabel}
                </div>
                {track.playbackReady ? (
                  <Button
                    variant={activeTrackId === track.id ? "default" : "outline"}
                    className={
                      activeTrackId === track.id
                        ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }
                    onClick={() => void onPlay(track)}
                  >
                    {activeTrackId === track.id ? "Playing" : "Play"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    disabled={syncingTrackId === track.id}
                    onClick={() => void onSync(track)}
                  >
                    {syncingTrackId === track.id ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Checking
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export const DashboardTrackShelves = ({
  tracks,
  onTrackSynced,
}: DashboardTrackShelvesProps) => {
  const { session, logout } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const readyTracks = tracks.filter((track) => track.playbackReady);
  const pipelineTracks = tracks.filter((track) => !track.playbackReady);
  const activeTrack = tracks.find((track) => track.id === activeTrackId) ?? null;

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.volume = volume;
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !streamUrl) {
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setCurrentTime(0);
    setDuration(0);

    if (streamUrl.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(audio);
      hlsRef.current = hls;
    } else {
      audio.src = streamUrl;
    }

    void audio.play().catch(() => {
      setIsPlaying(false);
    });

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [streamUrl]);

  const startPlayback = async (track: TrackSummary) => {
    if (!session?.token) {
      return;
    }

    if (track.id === activeTrackId && audioRef.current) {
      if (audioRef.current.paused) {
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }

    try {
      const playbackSession = await playbackApi.createSession(session.token, track.id);
      setActiveTrackId(track.id);
      setStreamUrl(playbackSession.streamUrl);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        await logout();
        return;
      }

      toast.error(error instanceof Error ? error.message : "Unable to start playback");
    }
  };

  const syncTrack = async (track: TrackSummary) => {
    const token = session?.token;

    if (!token) {
      return;
    }

    try {
      setSyncingTrackId(track.id);
      const updated = await tracksApi.syncTrackMedia(token, track.id);
      onTrackSynced(updated);

      if (updated.playbackReady) {
        toast.success("Track is ready to play.");
      } else {
        toast.message("Track is still processing.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to refresh track status");
    } finally {
      setSyncingTrackId(null);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const seekTo = (value: number) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = value;
    setCurrentTime(value);
  };

  const skipBy = (delta: number) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextTime = Math.max(0, Math.min(duration || 0, audio.currentTime + delta));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="space-y-10 pb-40">
      <TrackRow
        title="Ready to play"
        description="Finished releases you can preview right now."
        tracks={readyTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        onPlay={startPlayback}
        onSync={syncTrack}
      />
      <TrackRow
        title="Processing"
        description="Uploads still being finalized by Mux or waiting for sync."
        tracks={pipelineTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        onPlay={startPlayback}
        onSync={syncTrack}
      />

      {activeTrack && streamUrl ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(1180px,calc(100vw-2rem))] -translate-x-1/2 rounded-[32px] border border-white/10 bg-[#0d1324]/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <audio ref={audioRef} preload="metadata" />
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_180px] lg:items-center">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                <TrackArt track={activeTrack} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-lg font-semibold text-white">{activeTrack.title}</p>
                <p className="truncate text-sm text-slate-400">{activeTrack.artistName}</p>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-300">
                  <Music2 className="h-3.5 w-3.5" />
                  Now playing
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-[26px] border border-white/10 bg-black/20 px-4 py-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  onClick={() => skipBy(-10)}
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg transition hover:bg-emerald-300"
                  onClick={() => void togglePlayback()}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  onClick={() => skipBy(10)}
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatClock(currentTime)}</span>
                  <span>{formatClock(duration)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/20 px-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-slate-400" />
                  )}
                  <span>Volume</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => {
                    const nextVolume = Number(event.target.value);
                    setVolume(nextVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = nextVolume;
                    }
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
                />
                <p className="text-xs text-slate-500">
                  Private preview stream for this release.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
