"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TrackSummary } from "@music-city/shared";
import Hls from "hls.js";
import {
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { playbackApi } from "@/features/playback/lib/playback-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiClientError } from "@/lib/api/http-client";

type GlobalPlaybackContextValue = {
  activeTrack: TrackSummary | null;
  activeTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playTrack: (track: TrackSummary) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekTo: (value: number) => void;
  skipBy: (delta: number) => void;
  setVolumeLevel: (value: number) => void;
};

const GlobalPlaybackContext = createContext<GlobalPlaybackContextValue | null>(null);

const formatClock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const isHlsStream = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname.endsWith(".m3u8");
  } catch {
    return url.includes(".m3u8");
  }
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

const buildRangeBackground = (value: number, max: number, playedColor: string) => {
  if (!Number.isFinite(max) || max <= 0) {
    return "rgba(255,255,255,0.08)";
  }

  const clampedPercent = Math.max(0, Math.min(100, (value / max) * 100));

  return `linear-gradient(90deg, ${playedColor} 0%, ${playedColor} ${clampedPercent}%, rgba(255,255,255,0.08) ${clampedPercent}%, rgba(255,255,255,0.08) 100%)`;
};

const GlobalPlaybackBar = ({
  activeTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  togglePlayback,
  seekTo,
  skipBy,
  setVolumeLevel,
}: Omit<GlobalPlaybackContextValue, "activeTrackId" | "playTrack">) => {
  if (!activeTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(1180px,calc(100vw-2rem))] -translate-x-1/2 rounded-[32px] border border-white/10 bg-[#0d1324]/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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
              max={Math.max(duration, 0)}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seekTo(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: buildRangeBackground(
                  Math.min(currentTime, duration || 0),
                  Math.max(duration, 0),
                  "#34d399",
                ),
              }}
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
              onChange={(event) => setVolumeLevel(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: buildRangeBackground(volume, 1, "#34d399"),
              }}
            />
            <p className="text-xs text-slate-500">
              Private preview stream for this release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalPlaybackProvider = ({ children }: { children: ReactNode }) => {
  const { session, logout } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [activeTrack, setActiveTrack] = useState<TrackSummary | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const syncProgress = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(audio.currentTime || 0);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
      return;
    }

    const seekableRange = audio.seekable;
    const fallbackDuration =
      seekableRange.length > 0 ? seekableRange.end(seekableRange.length - 1) : 0;

    if (fallbackDuration > 0) {
      setDuration(fallbackDuration);
    }
  };

  const stopAnimationLoop = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startAnimationLoop = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    stopAnimationLoop();

    const tick = () => {
      syncProgress();

      if (!audio.paused && !audio.ended) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => syncProgress();
    const handleLoadedMetadata = () => syncProgress();
    const handleDurationChange = () => syncProgress();
    const handleCanPlay = () => {
      syncProgress();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      startAnimationLoop();
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopAnimationLoop();
      syncProgress();
    };
    const handleEnded = () => {
      stopAnimationLoop();
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.volume = volume;
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      stopAnimationLoop();
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

    const startPlayback = async () => {
      try {
        console.log("[playback] startPlayback", {
          streamUrl,
          isHls: isHlsStream(streamUrl),
        });

        if (isHlsStream(streamUrl)) {
          if (Hls.isSupported()) {
            console.log("[playback] using hls.js");
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log("[playback] hls manifest parsed", {
                duration: audio.duration,
              });
              if (audio.duration) {
                setDuration(audio.duration);
              }
            });
            hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
              console.log("[playback] hls level loaded", {
                totalduration: data.details?.totalduration,
              });
              const nextDuration = data.details?.totalduration;
              if (nextDuration) {
                setDuration(nextDuration);
              }
            });
            hlsRef.current = hls;
          } else {
            console.log("[playback] native hls fallback");
            audio.src = streamUrl;
          }
        } else {
          console.log("[playback] using direct audio src");
          audio.src = streamUrl;
        }

        await audio.play();
        setIsPlaying(true);
        syncProgress();
        startAnimationLoop();
        console.log("[playback] audio.play resolved");
      } catch (error) {
        console.error("[playback] startPlayback failed", error);
        setIsPlaying(false);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to start audio playback",
        );
      }
    };

    void startPlayback();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [streamUrl]);

  const playTrack = async (track: TrackSummary) => {
    console.log("[playback] playTrack called", {
      trackId: track.id,
      title: track.title,
      playbackReady: track.playbackReady,
      access: track.access,
      hasSessionToken: Boolean(session?.token),
      activeTrackId: activeTrack?.id ?? null,
    });

    if (!session?.token) {
      console.log("[playback] playTrack aborted: no session token");
      return;
    }

    if (track.id === activeTrack?.id && audioRef.current) {
      console.log("[playback] toggling existing active track", {
        trackId: track.id,
        paused: audioRef.current.paused,
      });

      if (audioRef.current.paused) {
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }

    try {
      const playbackSession = await playbackApi.createSession(session.token, track.id);
      console.log("[playback] playback session created", {
        trackId: track.id,
        provider: playbackSession.provider,
        streamUrl: playbackSession.streamUrl,
      });
      setActiveTrack(track);
      setStreamUrl(playbackSession.streamUrl);
    } catch (error) {
      console.error("[playback] playTrack failed", {
        trackId: track.id,
        error,
      });

      if (error instanceof ApiClientError && error.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        await logout();
        return;
      }

      toast.error(error instanceof Error ? error.message : "Unable to start playback");
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const seekTo = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const skipBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Math.max(0, Math.min(duration || 0, audio.currentTime + delta));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const setVolumeLevel = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const value = useMemo<GlobalPlaybackContextValue>(
    () => ({
      activeTrack,
      activeTrackId: activeTrack?.id ?? null,
      isPlaying,
      currentTime,
      duration,
      volume,
      playTrack,
      togglePlayback,
      seekTo,
      skipBy,
      setVolumeLevel,
    }),
    [activeTrack, isPlaying, currentTime, duration, volume],
  );

  return (
    <GlobalPlaybackContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
      <GlobalPlaybackBar
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        togglePlayback={togglePlayback}
        seekTo={seekTo}
        skipBy={skipBy}
        setVolumeLevel={setVolumeLevel}
      />
    </GlobalPlaybackContext.Provider>
  );
};

export const useGlobalPlayback = () => {
  const context = useContext(GlobalPlaybackContext);

  if (!context) {
    throw new Error("useGlobalPlayback must be used within GlobalPlaybackProvider");
  }

  return context;
};
