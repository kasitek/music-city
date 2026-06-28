"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TrackSummary } from "@music-city/shared";
import { ArrowUpRight, LoaderCircle, Lock, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { useGlobalPlayback } from "@/features/playback/providers/global-playback-provider";
import { useAuth } from "@/hooks/use-auth";
import { TrackTable } from "@/features/music/components/track-table";

export const TrackGrid = ({
  tracks,
  onTrackSynced,
}: {
  tracks?: TrackSummary[];
  onTrackSynced?: (track: TrackSummary) => void;
}) => {
  const router = useRouter();
  const { session } = useAuth();
  const { activeTrackId, playTrack, setPlaybackQueue } = useGlobalPlayback();
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);
  const safeTracks = Array.isArray(tracks) ? tracks : [];

  const routeToUnlock = (track: TrackSummary) => {
    if (track.access === "subscribers") {
      router.push(
        `/artists/${track.artistId}/subscribe?trackId=${encodeURIComponent(track.id)}`,
      );
      return;
    }

    router.push(`/stream/${track.id}`);
  };

  const isGatedTrack = (track: TrackSummary) =>
    track.access === "subscribers" || track.access === "purchase_required";

  const handleTrackAction = async (track: TrackSummary) => {
    if (isGatedTrack(track)) {
      routeToUnlock(track);
      return;
    }

    await playTrack(track);
  };

  useEffect(() => {
    setPlaybackQueue(safeTracks);
  }, [safeTracks, setPlaybackQueue]);

  if (safeTracks.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No tracks are published yet.
      </div>
    );
  }

  return (
    <TrackTable
      tracks={safeTracks}
      actionHeader="Action"
      titleHref={(track) => `/stream/${track.id}`}
      onRowClick={(track) => void handleTrackAction(track)}
      isRowClickable={(track) =>
        Boolean(track.playbackReady && (isGatedTrack(track) || session?.token))
      }
      renderAction={(track) =>
        track.playbackReady && isGatedTrack(track) ? (
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
            aria-label={
              track.access === "subscribers"
                ? "Open subscription options"
                : "Open unlock options"
            }
            title={
              track.access === "subscribers"
                ? "Open subscription options"
                : "Open unlock options"
            }
            onClick={(event) => {
              event.stopPropagation();
              routeToUnlock(track);
            }}
          >
            {track.access === "subscribers" ? (
              <Lock className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </Button>
        ) : track.playbackReady ? (
          <Button
            variant={activeTrackId === track.id ? "default" : "outline"}
            className={
              activeTrackId === track.id
                ? "bg-emerald-400 px-3 text-slate-950 hover:bg-emerald-300"
                : "border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
            }
            disabled={!session?.token}
            onClick={(event) => {
              event.stopPropagation();
              void handleTrackAction(track);
            }}
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>
        ) : track.mediaProvider === "mux" && session?.token ? (
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            disabled={syncingTrackId === track.id}
            onClick={async (event) => {
              const token = session?.token;

              if (!token) {
                return;
              }

              event.stopPropagation();

              try {
                setSyncingTrackId(track.id);
                const updated = await tracksApi.syncTrackMedia(token, track.id);
                onTrackSynced?.(updated);

                if (updated.playbackReady) {
                  toast.success("Track is ready to play.");
                } else {
                  toast.message("Track is still processing.");
                }
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to refresh track status",
                );
              } finally {
                setSyncingTrackId(null);
              }
            }}
          >
            {syncingTrackId === track.id ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
            disabled
            onClick={(event) => event.stopPropagation()}
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>
        )
      }
    />
  );
};
