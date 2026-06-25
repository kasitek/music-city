"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ArtistPublicProfile, TrackSummary } from "@music-city/shared";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TrackCommerceActions } from "@/features/music/components/track-commerce-actions";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { usersApi } from "@/features/users/lib/users-api";
import { useGlobalPlayback } from "@/features/playback/providers/global-playback-provider";

const formatAccessLabel = (track: TrackSummary) => {
  switch (track.access) {
    case "public":
      return "Public release";
    case "subscribers":
      return "Subscriber release";
    case "purchase_required":
      return "Purchase required";
    default:
      return "Private release";
  }
};

export const TrackDetailOverview = ({ trackId }: { trackId: string }) => {
  const { setPlaybackQueue } = useGlobalPlayback();
  const [track, setTrack] = useState<TrackSummary | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTrack = async () => {
      try {
        const nextTrack = await tracksApi.getTrack(trackId);

        if (!cancelled) {
          setTrack(nextTrack);
          setArtistProfile(
            nextTrack ? await usersApi.getArtistProfile(nextTrack.artistId) : null,
          );
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
  }, [trackId]);

  useEffect(() => {
    setPlaybackQueue(track ? [track] : []);
  }, [track, setPlaybackQueue]);

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
      <Button
        asChild
        variant="outline"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
      >
        <Link href="/stream">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to streaming
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04]">
          {track.coverImageUrl ? (
            <div
              className="aspect-square bg-cover bg-center"
              style={{ backgroundImage: `url(${track.coverImageUrl})` }}
            />
          ) : (
            <div className="aspect-square bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.28),_transparent_52%),linear-gradient(180deg,_rgba(15,23,42,0.15),_rgba(15,23,42,0.94))]" />
          )}
        </div>

        <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/[0.04] p-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Track details
            </p>
            <h2 className="text-4xl font-semibold text-white sm:text-5xl">
              {track.title}
            </h2>
            <p className="text-lg text-slate-300">{track.artistName}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Genre
              </p>
              <p className="mt-2 text-base text-white">{track.genre}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Runtime
              </p>
              <p className="mt-2 text-base text-white">{track.runtime}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Status
              </p>
              <p className="mt-2 text-base text-white">{track.status}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Access
              </p>
              <p className="mt-2 text-base text-emerald-300">
                {formatAccessLabel(track)}
              </p>
            </div>
          </div>

          {track.description ? (
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Description
              </p>
              <p className="max-w-3xl text-base leading-7 text-slate-300">
                {track.description}
              </p>
            </div>
          ) : null}

          <TrackCommerceActions
            track={track}
            artistProfile={artistProfile}
            onUnlocked={async () => {
              setTrack(await tracksApi.getTrack(track.id));
            }}
          />
        </div>
      </div>
    </div>
  );
};
