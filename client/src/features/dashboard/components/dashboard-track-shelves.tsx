"use client";

import Link from "next/link";
import { useState } from "react";
import type { TrackAccess, TrackSummary } from "@music-city/shared";
import {
  Check,
  ExternalLink,
  LoaderCircle,
  MoreHorizontal,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tracksApi } from "@/features/music/lib/tracks-api";
import {
  TrackTable,
  formatTrackAccessLabel,
} from "@/features/music/components/track-table";
import { useGlobalPlayback } from "@/features/playback/providers/global-playback-provider";
import { useAuth } from "@/hooks/use-auth";

interface DashboardTrackShelvesProps {
  tracks: TrackSummary[];
  onTrackSynced: (track: TrackSummary) => void;
  onTrackDeleted: (trackId: string) => void;
}

const TrackTableSection = ({
  title,
  description,
  tracks,
  activeTrackId,
  syncingTrackId,
  deletingTrackId,
  selectionMode,
  selectedTrackIds,
  canPlayTrack,
  onPlay,
  onSync,
  onDelete,
  onUpdateAccess,
  onToggleSelectionMode,
  onToggleTrackSelected,
}: {
  title: string;
  description: string;
  tracks: TrackSummary[];
  activeTrackId: string | null;
  syncingTrackId: string | null;
  deletingTrackId: string | null;
  selectionMode: boolean;
  selectedTrackIds: string[];
  canPlayTrack: (track: TrackSummary) => boolean;
  onPlay: (track: TrackSummary) => Promise<void>;
  onSync: (track: TrackSummary) => Promise<void>;
  onDelete: (track: TrackSummary) => Promise<void>;
  onUpdateAccess: (track: TrackSummary, access: TrackAccess) => Promise<void>;
  onToggleSelectionMode: (track: TrackSummary) => void;
  onToggleTrackSelected: (trackId: string) => void;
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
      <TrackTable
        tracks={tracks}
        titleHref={(track) => `/dashboard/tracks/${track.id}`}
        onRowClick={(track) => void onPlay(track)}
        isRowClickable={canPlayTrack}
        renderSelectionCell={(track) =>
          selectionMode ? (
            <button
              type="button"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                selectedTrackIds.includes(track.id)
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-white/15 bg-white/5 text-transparent hover:border-white/30"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleTrackSelected(track.id);
              }}
              aria-label={
                selectedTrackIds.includes(track.id)
                  ? "Deselect track"
                  : "Select track"
              }
            >
              <Check className="h-4 w-4" />
            </button>
          ) : null
        }
        renderAction={(track) => {
          const isSyncing = syncingTrackId === track.id;
          const isDeleting = deletingTrackId === track.id;
          const isActive = activeTrackId === track.id;

          return (
            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
              {track.playbackReady ? (
                <Button
                  variant={isActive ? "default" : "outline"}
                  className={
                    isActive
                      ? "bg-emerald-400 px-3 text-slate-950 hover:bg-emerald-300"
                      : "border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                  }
                  disabled={!canPlayTrack(track)}
                  onClick={(event) => {
                    event.stopPropagation();
                    console.log("[dashboard][play] button clicked", {
                      trackId: track.id,
                      title: track.title,
                      playbackReady: track.playbackReady,
                      access: track.access,
                      canPlay: canPlayTrack(track),
                    });
                    void onPlay(track);
                  }}
                >
                  <Play className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={isSyncing}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onSync(track);
                  }}
                >
                  {isSyncing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                    disabled={isDeleting}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 border-white/10 bg-[#101625] text-white"
                >
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white">
                    <Link href={`/dashboard/tracks/${track.id}`}>
                      Manage
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                    onClick={() => void onUpdateAccess(track, "private")}
                  >
                    Make private
                    {track.access === "private" ? (
                      <Check className="ml-auto h-4 w-4 text-emerald-300" />
                    ) : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                    onClick={() => void onUpdateAccess(track, "subscribers")}
                  >
                    Make subscriber-only
                    {track.access === "subscribers" ? (
                      <Check className="ml-auto h-4 w-4 text-emerald-300" />
                    ) : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                    onClick={() => void onUpdateAccess(track, "public")}
                  >
                    Make public
                    {track.access === "public" ? (
                      <Check className="ml-auto h-4 w-4 text-emerald-300" />
                    ) : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                    onClick={() => onToggleSelectionMode(track)}
                  >
                    {selectionMode ? "Stop selecting" : "Select"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-200 focus:bg-red-500/10 focus:text-red-100"
                    disabled={isDeleting || isSyncing}
                    onClick={() => void onDelete(track)}
                  >
                    {isDeleting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Deleting
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }}
      />
    </section>
  );
};

export const DashboardTrackShelves = ({
  tracks,
  onTrackSynced,
  onTrackDeleted,
}: DashboardTrackShelvesProps) => {
  const { session } = useAuth();
  const { activeTrackId, playTrack } = useGlobalPlayback();
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const canPlayTrack = (track: TrackSummary) =>
    Boolean(track.playbackReady && session?.token);

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

  const deleteTrack = async (track: TrackSummary) => {
    const token = session?.token;

    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${track.title}" everywhere? This will remove it from Mux, storage, and the database.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTrackId(track.id);
      await tracksApi.deleteTrack(token, track.id);
      onTrackDeleted(track.id);
      toast.success("Track deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete track",
      );
    } finally {
      setDeletingTrackId(null);
    }
  };

  const toggleSelectionMode = (track: TrackSummary) => {
    setSelectionMode((current) => {
      const next = !current;

      if (next) {
        setSelectedTrackIds((currentIds) =>
          currentIds.includes(track.id) ? currentIds : [track.id],
        );
      } else {
        setSelectedTrackIds([]);
      }

      return next;
    });
  };

  const toggleTrackSelected = (trackId: string) => {
    setSelectedTrackIds((current) =>
      current.includes(trackId)
        ? current.filter((id) => id !== trackId)
        : [...current, trackId],
    );
  };

  const updateTrackAccess = async (track: TrackSummary, access: TrackAccess) => {
    const token = session?.token;

    if (!token || track.access === access) {
      return;
    }

    try {
      const updated = await tracksApi.updateTrackAccess(token, track.id, access);
      onTrackSynced(updated);
      toast.success(`${track.title} is now ${formatTrackAccessLabel(updated).toLowerCase()}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update track access",
      );
    }
  };

  return (
    <div className="space-y-10 pb-40">
      {selectionMode ? (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          <span>
            {selectedTrackIds.length} track{selectedTrackIds.length === 1 ? "" : "s"} selected
          </span>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              setSelectionMode(false);
              setSelectedTrackIds([]);
            }}
          >
            Done
          </Button>
        </div>
      ) : null}

      <TrackTableSection
        title="Ready to play"
        description="Finished releases you can preview right now."
        tracks={readyTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        deletingTrackId={deletingTrackId}
        selectionMode={selectionMode}
        selectedTrackIds={selectedTrackIds}
        canPlayTrack={canPlayTrack}
        onPlay={playTrack}
        onSync={syncTrack}
        onDelete={deleteTrack}
        onUpdateAccess={updateTrackAccess}
        onToggleSelectionMode={toggleSelectionMode}
        onToggleTrackSelected={toggleTrackSelected}
      />
      <TrackTableSection
        title="Processing"
        description="Uploads still being finalized by Mux or waiting for sync."
        tracks={pipelineTracks}
        activeTrackId={activeTrackId}
        syncingTrackId={syncingTrackId}
        deletingTrackId={deletingTrackId}
        selectionMode={selectionMode}
        selectedTrackIds={selectedTrackIds}
        canPlayTrack={canPlayTrack}
        onPlay={playTrack}
        onSync={syncTrack}
        onDelete={deleteTrack}
        onUpdateAccess={updateTrackAccess}
        onToggleSelectionMode={toggleSelectionMode}
        onToggleTrackSelected={toggleTrackSelected}
      />
    </div>
  );
};
