"use client";

import { useState } from "react";
import type { TrackSummary } from "@music-city/shared";
import { LoaderCircle, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { useGlobalPlayback } from "@/features/playback/providers/global-playback-provider";
import { useAuth } from "@/hooks/use-auth";

export const TrackGrid = ({
  tracks,
  onTrackSynced,
}: {
  tracks?: TrackSummary[];
  onTrackSynced?: (track: TrackSummary) => void;
}) => {
  const { session } = useAuth();
  const { activeTrackId, playTrack } = useGlobalPlayback();
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);
  const safeTracks = Array.isArray(tracks) ? tracks : [];

  if (safeTracks.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No tracks are published yet.
      </div>
    );
  }

    return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {safeTracks.map((track) => (
        <Card
          key={track.id}
          className="border-white/10 bg-white/5 text-white shadow-none"
        >
          <CardHeader className="space-y-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Play className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-xl">{track.title}</CardTitle>
              <p className="text-sm text-slate-400">{track.artistName}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>{track.genre}</span>
              <span>{track.runtime}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{track.status}</span>
              <span>{track.plays} plays</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-emerald-300">
              {track.priceLabel}
            </div>
            {track.playbackReady ? (
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={!session?.token}
                onClick={() => void playTrack(track)}
              >
                Play
              </Button>
            ) : track.mediaProvider === "mux" && session?.token ? (
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={syncingTrackId === track.id}
                onClick={async () => {
                  const token = session?.token;

                  if (!token) {
                    return;
                  }

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
                      error instanceof Error ? error.message : "Unable to refresh track status",
                    );
                  } finally {
                    setSyncingTrackId(null);
                  }
                }}
              >
                {syncingTrackId === track.id ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Checking
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check status
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled
              >
                Play
              </Button>
            )}
            {activeTrackId === track.id ? (
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
                Now playing
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
