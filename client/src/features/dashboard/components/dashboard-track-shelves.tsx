"use client";

import { useState } from "react";
import type { TrackSummary } from "@music-city/shared";
import { LoaderCircle, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { useGlobalPlayback } from "@/features/playback/providers/global-playback-provider";
import { useAuth } from "@/hooks/use-auth";

interface DashboardTrackShelvesProps {
  tracks: TrackSummary[];
  onTrackSynced: (track: TrackSummary) => void;
}

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
                {track.playbackReady ? (
                  <Play className="h-5 w-5 fill-current" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
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
  const { session } = useAuth();
  const { activeTrackId, playTrack } = useGlobalPlayback();
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);

  const readyTracks = tracks.filter((track) => track.playbackReady);
  const pipelineTracks = tracks.filter((track) => !track.playbackReady);

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

  return (
    <div className="space-y-10 pb-40">
      <TrackRow
        title="Ready to play"
        description="Finished releases you can preview right now."
        tracks={readyTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        onPlay={playTrack}
        onSync={syncTrack}
      />
      <TrackRow
        title="Processing"
        description="Uploads still being finalized by Mux or waiting for sync."
        tracks={pipelineTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        onPlay={playTrack}
        onSync={syncTrack}
      />
    </div>
  );
};
