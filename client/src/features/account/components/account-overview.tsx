"use client";

import { useEffect, useState } from "react";
import type { TrackSummary, UserProfile } from "@music-city/shared";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { usersApi } from "@/features/users/lib/users-api";

const formatRole = (role?: "artist" | "fan") =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";

const activityLabel = (track: TrackSummary) => {
  if (track.playbackReady) {
    return "Ready to play";
  }

  switch (track.status) {
    case "awaiting_upload":
      return "Waiting for upload";
    case "uploaded":
      return "Uploaded";
    case "processing":
      return "Processing";
    case "published":
      return "Published";
    case "failed":
      return "Needs attention";
    default:
      return "Draft";
  }
};

export const AccountOverview = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = session?.token;

    if (!token) {
      setProfile(null);
      setTracks([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const [nextProfile, nextTracks] = await Promise.all([
          usersApi.getMe(token),
          tracksApi.listMyTracks(token),
        ]);

        if (!cancelled) {
          setProfile(nextProfile);
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
  }, [session?.token]);

  if (!session) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Log in to view your account.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-sm text-slate-400">Loading your account...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/10 bg-white/5 text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p>
            <p className="text-base text-white">
              {profile?.displayName ?? session.displayName}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account</p>
            <p className="text-base text-white">
              {formatRole(profile?.role ?? session.role)}
            </p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Wallet</p>
            <p className="break-all text-base text-white">{session.walletAddress}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</p>
            <p className="text-base text-white">{profile?.location || "Not added"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Genres</p>
            <p className="text-base text-white">
              {profile?.genres?.length ? profile.genres.join(", ") : "Not added"}
            </p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bio</p>
            <p className="text-base leading-7 text-white">
              {profile?.bio || "No bio added yet."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Tracks
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {tracks.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Published
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {tracks.filter((track) => track.status === "published").length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Recent track activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tracks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                Your recent activity will appear here after you create a track.
              </div>
            ) : (
              tracks.slice(0, 5).map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-base font-medium text-white">{track.title}</p>
                    <p className="text-sm text-slate-400">{track.genre}</p>
                  </div>
                  <p className="text-sm text-emerald-300">{activityLabel(track)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
