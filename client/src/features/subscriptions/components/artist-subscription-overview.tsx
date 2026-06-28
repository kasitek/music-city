"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import type {
  ArtistPublicProfile,
  SubscriptionRecord,
  TrackSummary,
} from "@music-city/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { paymentsApi } from "@/features/payments/lib/payments-api";
import { useStellarCheckout } from "@/features/payments/hooks/use-stellar-checkout";
import { TrackThumbnail } from "@/features/music/components/track-table";
import { subscriptionsApi } from "@/features/subscriptions/lib/subscriptions-api";
import { useAuth } from "@/hooks/use-auth";
import { usersApi } from "@/features/users/lib/users-api";

const formatAmountLabel = (amount?: string, assetCode?: string) => {
  if (!amount) {
    return "Subscription amount unavailable";
  }

  return `${amount} ${assetCode ?? "XLM"}`;
};

export const ArtistSubscriptionOverview = ({
  artistId,
  trackId,
}: {
  artistId: string;
  trackId?: string;
}) => {
  const router = useRouter();
  const { session } = useAuth();
  const runCheckout = useStellarCheckout();
  const [artistProfile, setArtistProfile] = useState<ArtistPublicProfile | null>(null);
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const hasActivePlan = Boolean(
    artistProfile?.subscriptionEnabled && artistProfile.subscriptionPrice,
  );
  const isOwnArtistPage =
    Boolean(session?.walletAddress) &&
    session?.walletAddress === artistProfile?.walletAddress;

  const load = async () => {
    setIsLoading(true);

    try {
      const [profile, allTracks, mySubscriptions] = await Promise.all([
        usersApi.getArtistProfile(artistId),
        tracksApi.listTracks(),
        session?.token ? subscriptionsApi.listMine(session.token) : Promise.resolve([]),
      ]);

      setArtistProfile(profile);
      setTracks(
        allTracks.filter(
          (track) => track.artistId === artistId && track.access === "subscribers",
        ),
      );
      setSubscription(
        mySubscriptions.find(
          (item) => item.artistId === artistId && item.status === "active",
        ) ?? null,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load subscription page",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [artistId, session?.token]);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === trackId) ?? null,
    [trackId, tracks],
  );

  const openSelectedTrack = () => {
    if (trackId) {
      router.push(`/stream/${trackId}`);
      return;
    }

    router.push("/stream");
  };

  const handleSubscribe = async () => {
    if (!session?.token) {
      toast.error("Sign in with your Stellar wallet first.");
      router.push("/auth");
      return;
    }

    if (!artistProfile?.subscriptionEnabled) {
      toast.error("This artist does not have an active subscription plan yet.");
      return;
    }

    try {
      setIsSubscribing(true);
      const intent = await paymentsApi.createArtistSubscriptionIntent(
        session.token,
        artistProfile.id,
      );
      const txHash = await runCheckout(intent);
      await paymentsApi.confirm(session.token, {
        intentId: intent.id,
        txHash,
      });
      toast.success("Subscription activated.");
      await load();
      openSelectedTrack();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to complete subscription",
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-400">Loading subscription page...</div>;
  }

  if (!artistProfile) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Artist profile not found.
      </div>
    );
  }

  const amountLabel = hasActivePlan
    ? formatAmountLabel(
        artistProfile.subscriptionPrice,
        artistProfile.subscriptionAssetCode,
      )
    : "Unavailable";

  return (
    <div className="space-y-8">
      <Button
        asChild
        variant="outline"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
      >
        <Link href={trackId ? `/stream/${trackId}` : "/artists"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {trackId ? "Back to track" : "Back to artists"}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Artist subscription
            </p>
            <div className="space-y-2">
              <CardTitle className="text-4xl">{artistProfile.displayName}</CardTitle>
              <p className="text-base text-slate-300">
                Unlock subscriber-only tracks and future releases from this artist.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedTrack ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
                  Selected release
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{selectedTrack.title}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {hasActivePlan
                    ? "Subscribe to unlock this track and the rest of the subscriber catalog."
                    : "This release is marked subscriber-only, but the artist has not finished publishing a subscription plan yet."}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Amount</p>
                <p className="mt-3 text-lg text-white">{amountLabel}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Period</p>
                <p className="mt-3 text-lg text-white">
                  {hasActivePlan
                    ? `Every ${artistProfile.subscriptionPeriodDays} days`
                    : "Unavailable"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Access</p>
                <p className="mt-3 text-lg text-white">
                  {hasActivePlan
                    ? `${tracks.length} subscriber-only ${tracks.length === 1 ? "track" : "tracks"}`
                    : "Plan inactive"}
                </p>
              </div>
            </div>

            {!hasActivePlan ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-sm text-amber-100">
                This artist has not published an active subscription plan yet, so
                nobody can subscribe from this page right now.
              </div>
            ) : tracks.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-300">
                This artist has enabled subscriptions, but there are no subscriber-only
                tracks published yet.
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Subscriber-only releases</h3>
                <div className="grid gap-4">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <TrackThumbnail track={track} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white">
                          {track.title}
                        </p>
                        <p className="truncate text-sm text-slate-400">{track.genre}</p>
                      </div>
                      <Link
                        href={`/stream/${track.id}`}
                        className="text-sm text-emerald-300 transition hover:text-emerald-200"
                      >
                        View track
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">Subscription action</CardTitle>
            <p className="text-sm text-slate-400">
              Use your connected Stellar wallet to activate access.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
                  Active subscription
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Access ends {new Date(subscription.endsAt).toLocaleDateString()}
                </p>
              </div>
            ) : null}

            {!hasActivePlan ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                {isOwnArtistPage
                  ? "Your subscription plan is not active yet. Enable it in Account before fans can subscribe."
                  : "This artist has not published an active subscription plan yet."}
              </div>
            ) : subscription ? (
              <Button
                className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                onClick={openSelectedTrack}
              >
                Open unlocked music
              </Button>
            ) : (
              <Button
                className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                disabled={isSubscribing}
                onClick={() => void handleSubscribe()}
              >
                {isSubscribing ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Subscribe now
              </Button>
            )}

            {!hasActivePlan && isOwnArtistPage ? (
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => router.push("/account")}
              >
                Open subscription settings
              </Button>
            ) : null}

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 text-emerald-300" />
                <p>
                  Subscriber-only tracks stay locked until your payment is confirmed on
                  Stellar. After checkout, Music City refreshes access immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
