"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TrackAccess, TrackSummary } from "@music-city/shared";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { tracksApi } from "@/features/music/lib/tracks-api";

const accessOptions: Array<{
  value: TrackAccess;
  label: string;
  description: string;
}> = [
  {
    value: "private",
    label: "Private",
    description: "Only you and explicitly entitled listeners can access it.",
  },
  {
    value: "subscribers",
    label: "Subscribers",
    description: "Visible in discovery, but reserved for gated listener access.",
  },
  {
    value: "public",
    label: "Public",
    description: "Visible in discovery and open for normal listening.",
  },
];

export const TrackManageOverview = ({ trackId }: { trackId: string }) => {
  const router = useRouter();
  const { session } = useAuth();
  const [track, setTrack] = useState<TrackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTrack = async () => {
      if (!session?.token) {
        setIsLoading(false);
        return;
      }

      try {
        const nextTrack = await tracksApi.getManageTrack(session.token, trackId);

        if (!cancelled) {
          setTrack(nextTrack);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Unable to load track details",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTrack();

    return () => {
      cancelled = true;
    };
  }, [session?.token, trackId]);

  const updateAccess = async (access: TrackAccess) => {
    if (!session?.token || !track || track.access === access) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedTrack = await tracksApi.updateTrackAccess(
        session.token,
        track.id,
        access,
      );
      setTrack(updatedTrack);
      toast.success(`Track access updated to ${access}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update track access",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-slate-300">
        Connect your account before managing a track.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-slate-300">
        Loading track details...
      </div>
    );
  }

  if (!track) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-slate-300">
        Track not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          asChild
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={() => router.push("/discover")}
        >
          Open discover
        </Button>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Track details
          </p>
          <h2 className="text-3xl font-semibold text-white">{track.title}</h2>
          <p className="text-slate-400">
            {track.artistName} · {track.genre} · {track.runtime}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Status
            </p>
            <p className="mt-3 text-xl text-white">{track.status}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Playback
            </p>
            <p className="mt-3 text-xl text-white">
              {track.playbackReady ? "Ready" : "Not ready"}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Current access
            </p>
            <p className="mt-3 text-xl capitalize text-emerald-300">
              {track.access}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Access control
          </p>
          <h3 className="text-2xl font-semibold text-white">
            Change who can discover and play this song.
          </h3>
          <p className="text-slate-400">
            Private songs stay out of discovery. Subscriber and public songs can
            appear in discovery once playback is ready.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {accessOptions.map((option) => {
            const isActive = option.value === track.access;

            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-[24px] border p-5 text-left transition ${
                  isActive
                    ? "border-emerald-400/50 bg-emerald-400/10"
                    : "border-white/10 bg-slate-950/50 hover:border-white/20 hover:bg-white/[0.06]"
                }`}
                disabled={isSaving}
                onClick={() => void updateAccess(option.value)}
              >
                <p className="text-xl font-semibold text-white">{option.label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {option.description}
                </p>
                {isActive ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-emerald-300">
                    Active
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>

        {isSaving ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-300">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Saving access...
          </div>
        ) : null}
      </div>
    </div>
  );
};
