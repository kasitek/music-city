"use client";

import { useState } from "react";
import type { TrackSummary } from "@music-city/shared";
import MuxAudio from "@mux/mux-audio-react";
import { Play } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { playbackApi } from "@/features/playback/lib/playback-api";
import { useAuth } from "@/hooks/use-auth";

export const TrackGrid = ({ tracks }: { tracks: TrackSummary[] }) => {
  const { session } = useAuth();
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamProvider, setStreamProvider] = useState<"local" | "mux" | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        No tracks are published yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tracks.map((track) => (
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
            <Button
              variant="outline"
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              disabled={!session?.token || !track.playbackReady}
              onClick={async () => {
                if (!session?.token) {
                  return;
                }

                const playbackSession = await playbackApi.createSession(
                  session.token,
                  track.id,
                );
                setActiveTrackId(track.id);
                setStreamUrl(playbackSession.streamUrl);
                setStreamProvider(playbackSession.provider);
              }}
            >
              Play
            </Button>
            {activeTrackId === track.id && streamUrl ? (
              streamProvider === "mux" ? (
                <MuxAudio
                  className="w-full"
                  src={streamUrl}
                  type="hls"
                  streamType="on-demand"
                  preferPlayback="mse"
                  controls
                  metadata={{
                    video_id: track.id,
                    video_title: track.title,
                    viewer_user_id: session?.walletAddress ?? "anonymous",
                  }}
                />
              ) : (
                <audio controls className="w-full" src={streamUrl} />
              )
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
