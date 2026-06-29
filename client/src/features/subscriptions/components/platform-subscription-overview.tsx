"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  Lock,
  Sparkles,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";

import type {
  PlatformSubscriptionPlan,
  SubscriptionRecord,
  TrackSummary,
} from "@music-city/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackThumbnail } from "@/features/music/components/track-table";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { paymentsApi } from "@/features/payments/lib/payments-api";
import { useStellarCheckout } from "@/features/payments/hooks/use-stellar-checkout";
import { subscriptionsApi } from "@/features/subscriptions/lib/subscriptions-api";
import { useAuth } from "@/hooks/use-auth";

const formatAmountLabel = (plan: PlatformSubscriptionPlan | null) => {
  if (!plan) {
    return "Membership unavailable";
  }

  return `${plan.price} ${plan.assetCode ?? "XLM"}`;
};

export const PlatformSubscriptionOverview = ({
  trackId,
}: {
  trackId?: string;
}) => {
  const router = useRouter();
  const { session } = useAuth();
  const runCheckout = useStellarCheckout();
  const [plan, setPlan] = useState<PlatformSubscriptionPlan | null>(null);
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const load = async () => {
    setIsLoading(true);

    try {
      const [nextPlan, allTracks, mySubscriptions] = await Promise.all([
        subscriptionsApi.getPlatformPlan(),
        tracksApi.listTracks(),
        session?.token ? subscriptionsApi.listMine(session.token) : Promise.resolve([]),
      ]);

      setPlan(nextPlan);
      setTracks(
        allTracks.filter((track) => track.access === "subscribers"),
      );
      setSubscription(
        mySubscriptions.find(
          (item) => item.scope === "platform" && item.status === "active",
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
  }, [session?.token]);

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

    if (!plan?.enabled) {
      toast.error("Music City Pass is not available right now.");
      return;
    }

    try {
      setIsSubscribing(true);
      const intent = await paymentsApi.createPlatformSubscriptionIntent(session.token);
      const txHash = await runCheckout(intent);
      await paymentsApi.confirm(session.token, {
        intentId: intent.id,
        txHash,
      });
      toast.success("Music City Pass activated.");
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

  if (!plan) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Subscription plan unavailable.
      </div>
    );
  }

  const amountLabel = formatAmountLabel(plan);

  return (
    <div className="space-y-8">
      <Button
        asChild
        variant="outline"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
      >
        <Link href={trackId ? `/stream/${trackId}` : "/stream"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {trackId ? "Back to track" : "Back to streaming"}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Platform membership
            </p>
            <div className="space-y-2">
              <CardTitle className="text-4xl">{plan.name}</CardTitle>
              <p className="text-base text-slate-300">{plan.description}</p>
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
                  Activate Music City Pass once to unlock this track and every other subscriber-only release across the platform.
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
                <p className="mt-3 text-lg text-white">Every {plan.periodDays} days</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Access</p>
                <p className="mt-3 text-lg text-white">
                  {tracks.length} subscriber-only {tracks.length === 1 ? "track" : "tracks"}
                </p>
              </div>
            </div>

            {!plan.enabled ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-sm text-amber-100">
                Music City Pass is not available right now.
              </div>
            ) : tracks.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-300">
                Subscriber-only releases will appear here once artists publish them.
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Included releases</h3>
                <div className="grid gap-4">
                  {tracks.slice(0, 8).map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <TrackThumbnail track={track} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white">
                          {track.title}
                        </p>
                        <p className="truncate text-sm text-slate-400">
                          {track.artistName}
                        </p>
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
            <CardTitle className="text-2xl">Membership action</CardTitle>
            <p className="text-sm text-slate-400">
              Use your connected Stellar wallet to activate platform-wide access.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
                  Active membership
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Access ends {new Date(subscription.endsAt).toLocaleDateString()}
                </p>
              </div>
            ) : null}

            {!plan.enabled ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                Music City Pass has not been enabled yet.
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
                  <Ticket className="mr-2 h-4 w-4" />
                )}
                Join Music City Pass
              </Button>
            )}

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 text-emerald-300" />
                <p>
                  One active membership unlocks every subscriber-only release across Music City. Playback refreshes right after Stellar payment confirmation.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-emerald-300" />
                <p>
                  New subscriber-only tracks are included automatically while your pass is active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
