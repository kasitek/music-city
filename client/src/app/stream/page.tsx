"use client";

import { useEffect, useState } from "react";
import type { TrackSummary } from "@music-city/shared";

import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { TrackGrid } from "@/features/music/components/track-grid";
import { tracksApi } from "@/features/music/lib/tracks-api";

export default function StreamPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextTracks = await tracksApi.listTracks();

        if (!cancelled) {
          setTracks(nextTracks);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Streaming"
            title="Playback will be served from encrypted HLS, not chain storage."
            description="This route is now a focused streaming surface. Signed playback access and media manifests will come from the new Node backend."
          />
          {isLoading ? (
            <div className="text-sm text-slate-400">Loading tracks...</div>
          ) : (
            <TrackGrid tracks={tracks} />
          )}
        </div>
      </PageContainer>
    </section>
  );
}
