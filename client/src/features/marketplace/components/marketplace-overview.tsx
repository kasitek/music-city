"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ArtistPublicProfile, ArtistSummary, TrackSummary } from "@music-city/shared";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackCommerceActions } from "@/features/music/components/track-commerce-actions";
import { TrackThumbnail } from "@/features/music/components/track-table";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { usersApi } from "@/features/users/lib/users-api";

const ArtistSubscriptionCard = ({
  artist,
  profile,
  onUnlocked,
}: {
  artist: ArtistSummary;
  profile: ArtistPublicProfile;
  onUnlocked: () => Promise<void>;
}) => (
  <Card className="border-white/10 bg-white/5 text-white shadow-none">
    <CardHeader className="space-y-4">
      <div className="flex items-center gap-4">
        {profile.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profileImageUrl}
            alt=""
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <div className="size-14 rounded-full bg-gradient-to-br from-emerald-300/40 to-slate-950" />
        )}
        <div className="space-y-1">
          <CardTitle className="text-xl">{artist.name}</CardTitle>
          <p className="text-sm text-slate-400">{artist.city}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-slate-300">
        Unlock subscriber-only drops and private listening access from this artist.
      </p>
      <div className="text-sm text-emerald-300">
        {profile.subscriptionPrice} {profile.subscriptionAssetCode ?? "XLM"} every{" "}
        {profile.subscriptionPeriodDays} days
      </div>
      <TrackCommerceActions
        track={{
          id: `${artist.id}-subscription`,
          title: `${artist.name} subscriber access`,
          artistId: artist.id,
          artistName: artist.name,
          genre: artist.genre,
          runtime: "Membership",
          priceLabel: profile.subscriptionPrice ?? "",
          status: "published",
          access: "subscribers",
          plays: 0,
          likes: 0,
          playbackReady: false,
        }}
        artistProfile={profile}
        onUnlocked={onUnlocked}
        hidePlay
      />
    </CardContent>
  </Card>
);

export const MarketplaceOverview = () => {
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [artists, setArtists] = useState<ArtistSummary[]>([]);
  const [artistProfiles, setArtistProfiles] = useState<
    Record<string, ArtistPublicProfile>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);

    try {
      const [nextTracks, nextArtists] = await Promise.all([
        tracksApi.listTracks(),
        usersApi.listArtists(),
      ]);

      const monetizedArtists = await Promise.all(
        nextArtists.map(async (artist) => {
          const profile = await usersApi.getArtistProfile(artist.id);
          return profile?.subscriptionEnabled ? [artist.id, profile] : null;
        }),
      );

      setTracks(nextTracks.filter((track) => track.access === "purchase_required"));
      setArtists(nextArtists);
      setArtistProfiles(
        Object.fromEntries(
          monetizedArtists.filter(Boolean) as Array<[string, ArtistPublicProfile]>,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load marketplace",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const artistsWithSubscriptions = artists.filter((artist) => artistProfiles[artist.id]);

  if (isLoading) {
    return <div className="text-sm text-slate-400">Loading marketplace...</div>;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white">Tracks to unlock</h2>
          <p className="text-sm text-slate-400">
            One-time purchases that unlock playback immediately.
          </p>
        </div>
        {tracks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No track purchases are live yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tracks.map((track) => (
              <Card
                key={track.id}
                className="border-white/10 bg-white/5 text-white shadow-none"
              >
                <CardContent className="flex gap-4 p-5">
                  <TrackThumbnail track={track} />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="space-y-1">
                      <Link
                        href={`/stream/${track.id}`}
                        className="block truncate text-lg font-semibold hover:text-emerald-300"
                      >
                        {track.title}
                      </Link>
                      <p className="truncate text-sm text-slate-400">{track.artistName}</p>
                    </div>
                    <p className="text-sm text-slate-300">{track.description || track.genre}</p>
                    <TrackCommerceActions track={track} onUnlocked={load} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white">Artist subscriptions</h2>
          <p className="text-sm text-slate-400">
            Recurring access to subscriber-only tracks and future drops.
          </p>
        </div>
        {artistsWithSubscriptions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No artist subscriptions are live yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {artistsWithSubscriptions.map((artist) => (
              <ArtistSubscriptionCard
                key={artist.id}
                artist={artist}
                profile={artistProfiles[artist.id]}
                onUnlocked={load}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
