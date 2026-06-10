"use client";

import { useEffect, useState } from "react";
import type { TrackSummary } from "@music-city/shared";

import { TrackGrid } from "@/features/music/components/track-grid";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { useAuth } from "@/hooks/use-auth";
import { TrackCreateForm } from "./track-create-form";

export const DashboardOverview = () => {
  const { session } = useAuth();
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTracks = async () => {
    if (!session?.token) {
      setTracks([]);
      return;
    }

    setIsLoading(true);

    try {
      setTracks(await tracksApi.listMyTracks(session.token));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTracks();
  }, [session?.token]);

  if (!session) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Connect your wallet before using the dashboard.
      </div>
    );
  }

  if (!session.profileComplete) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Complete onboarding before creating tracks.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TrackCreateForm onCreated={() => void loadTracks()} />
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Your tracks</h2>
        {isLoading ? (
          <div className="text-sm text-slate-400">Loading your tracks...</div>
        ) : (
          <TrackGrid tracks={tracks} />
        )}
      </div>
    </div>
  );
};
