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

  if (track.status === "awaiting_upload") {
    return "Awaiting upload";
  }

  return track.status;
};

const formatAccessLabel = (track: TrackSummary) => {
  switch (track.access) {
    case "public":
      return "Public release";
    case "subscribers":
      return "Subscriber release";
    default:
      return "Private release";
  }
};

const TrackThumbnail = ({ track }: { track: TrackSummary }) => {
  if (track.coverImageUrl) {
    return (
      <div
        className="h-14 w-14 shrink-0 rounded-2xl bg-cover bg-center"
        style={{ backgroundImage: `url(${track.coverImageUrl})` }}
      />
    );
  }

  return (
    <div className="h-14 w-14 shrink-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.28),_transparent_52%),linear-gradient(180deg,_rgba(15,23,42,0.15),_rgba(15,23,42,0.94))]" />
  );
};

const TrackTableSection = ({
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

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
        <div className="hidden grid-cols-[minmax(260px,2.2fr)_1fr_1fr_1.1fr_180px] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.24em] text-slate-500 lg:grid">
          <span>Track</span>
          <span>Status</span>
          <span>Runtime</span>
          <span>Access</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/10">
          {tracks.map((track) => {
            const isSyncing = syncingTrackId === track.id;
            const isActive = activeTrackId === track.id;

            return (
              <article
                key={track.id}
                className="px-4 py-4 sm:px-6"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(260px,2.2fr)_1fr_1fr_1.1fr_180px] lg:items-center">
                  <div className="flex items-center gap-4">
                    <TrackThumbnail track={track} />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-lg font-semibold text-white">
                          {track.title}
                        </h4>
                        <span className="rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                          {track.genre}
                        </span>
                      </div>
                      <p className="truncate text-sm text-slate-400">
                        {track.artistName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 lg:hidden">
                      Status
                    </p>
                    <p className="text-sm text-slate-200">{formatStatus(track)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 lg:hidden">
                      Runtime
                    </p>
                    <p className="text-sm text-slate-200">{track.runtime}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 lg:hidden">
                      Access
                    </p>
                    <p className="text-sm text-emerald-300">
                      {formatAccessLabel(track)}
                    </p>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {track.playbackReady ? (
                      <Button
                        variant={isActive ? "default" : "outline"}
                        className={
                          isActive
                            ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }
                        onClick={() => void onPlay(track)}
                      >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        {isActive ? "Playing" : "Play"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        disabled={isSyncing}
                        onClick={() => void onSync(track)}
                      >
                        {isSyncing ? (
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
            );
          })}
        </div>
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
      toast.error(
        error instanceof Error ? error.message : "Unable to refresh track status",
      );
    } finally {
      setSyncingTrackId(null);
    }
  };

  return (
    <div className="space-y-10 pb-40">
      <TrackTableSection
        title="Ready to play"
        description="Finished releases you can preview right now."
        tracks={readyTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        onPlay={playTrack}
        onSync={syncTrack}
      />
      <TrackTableSection
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
