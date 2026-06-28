"use client";

import { useEffect, useState } from "react";
import type {
  PaymentRecord,
  SubscriptionRecord,
  TrackSummary,
  UserProfile,
} from "@music-city/shared";
import { Settings2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { paymentsApi } from "@/features/payments/lib/payments-api";
import { subscriptionsApi } from "@/features/subscriptions/lib/subscriptions-api";
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

const formatSubscriptionAccess = (enabled: boolean) =>
  enabled ? "Subscriber access is live" : "No active fan subscription plan";

export const AccountOverview = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMonetization, setIsSavingMonetization] = useState(false);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState("10");
  const [subscriptionAssetCode, setSubscriptionAssetCode] = useState("XLM");
  const [subscriptionAssetIssuer, setSubscriptionAssetIssuer] = useState("");
  const [subscriptionPeriodDays, setSubscriptionPeriodDays] = useState("30");
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

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
      setLoadError(null);

      try {
        const [nextProfile, nextTracks, nextPayments, nextSubscriptions] = await Promise.all([
          usersApi.getMe(token),
          tracksApi.listMyTracks(token),
          paymentsApi.listMine(token),
          subscriptionsApi.listMine(token),
        ]);

        if (!cancelled) {
          setProfile(nextProfile ?? null);
          setTracks(Array.isArray(nextTracks) ? nextTracks : []);
          setPayments(Array.isArray(nextPayments) ? nextPayments : []);
          setSubscriptions(Array.isArray(nextSubscriptions) ? nextSubscriptions : []);
          setSubscriptionEnabled(nextProfile?.subscriptionEnabled ?? false);
          setSubscriptionPrice(nextProfile?.subscriptionPrice ?? "10");
          setSubscriptionAssetCode(nextProfile?.subscriptionAssetCode ?? "XLM");
          setSubscriptionAssetIssuer(nextProfile?.subscriptionAssetIssuer ?? "");
          setSubscriptionPeriodDays(
            String(nextProfile?.subscriptionPeriodDays ?? 30),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setProfile(null);
          setTracks([]);
          setPayments([]);
          setSubscriptions([]);
          setLoadError(error instanceof Error ? error.message : "Failed to load account.");
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

  const saveArtistSubscriptionSettings = async () => {
    const token = session?.token;

    if (!token || !profile) {
      return false;
    }

    try {
      setIsSavingMonetization(true);
      const nextProfile = await usersApi.saveMe(token, {
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        location: profile.location,
        profileImageStorageKey: profile.profileImageStorageKey,
        headerImageStorageKey: profile.headerImageStorageKey,
        subscriptionEnabled,
        subscriptionPrice,
        subscriptionAssetCode,
        subscriptionAssetIssuer,
        subscriptionPeriodDays: Number(subscriptionPeriodDays),
      });

      setProfile(nextProfile);
      toast.success("Subscription settings saved.");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save subscription settings",
      );
      return false;
    } finally {
      setIsSavingMonetization(false);
    }
  };

  useEffect(() => {
    if (!isSubscriptionModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSubscriptionModalOpen]);

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

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
        {loadError}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/10 bg-white/5 text-white shadow-none">
        {profile?.headerImageUrl ? (
          <div className="h-40 overflow-hidden rounded-t-xl border-b border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.headerImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <CardHeader>
          <div className="flex items-center gap-4">
            {profile?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profileImageUrl}
                alt=""
                className="size-16 rounded-full object-cover ring-2 ring-emerald-300/40"
              />
            ) : (
              <div className="size-16 rounded-full bg-gradient-to-br from-emerald-300/40 to-slate-950 ring-1 ring-white/10" />
            )}
            <CardTitle className="text-2xl">Profile</CardTitle>
          </div>
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="text-base text-white">
              {profile?.email || session.email || "Not added"}
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

        {profile?.role === "artist" ? (
          <Card className="border-white/10 bg-white/5 text-white shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Artist subscription plan</CardTitle>
                  <p className="text-sm text-slate-400">
                    Set the plan up only when you need to update pricing or access rules.
                  </p>
                </div>
                <Button
                  className="shrink-0 rounded-full bg-emerald-400 px-4 text-slate-950 hover:bg-emerald-300"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                >
                  <Settings2 className="size-4" />
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {formatSubscriptionAccess(subscriptionEnabled)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Price
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {subscriptionPrice} {subscriptionAssetCode}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Billing
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    Every {subscriptionPeriodDays} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

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

        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                No payments yet.
              </div>
            ) : (
              payments.slice(0, 6).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-base font-medium text-white">
                      {payment.productType === "track_purchase"
                        ? "Track purchase"
                        : "Artist subscription"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {payment.amount} {payment.assetCode}
                    </p>
                  </div>
                  <p className="text-sm text-emerald-300">Confirmed</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                No active subscriptions yet.
              </div>
            ) : (
              subscriptions.slice(0, 6).map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-base font-medium text-white">
                      Artist subscription
                    </p>
                    <p className="text-sm text-slate-400">
                      Ends {new Date(subscription.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-emerald-300">{subscription.status}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {profile?.role === "artist" && isSubscriptionModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-md"
          onClick={() => setIsSubscriptionModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#111527] p-6 text-white shadow-[0_24px_100px_rgba(0,0,0,0.45)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">
                  Subscription setup
                </p>
                <h2 className="text-3xl font-semibold text-white">
                  Configure your artist plan
                </h2>
                <p className="max-w-xl text-sm text-slate-400">
                  Choose whether the plan is active, what fans pay, and how often access renews.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setIsSubscriptionModalOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-8 space-y-6">
              <label className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4">
                <div className="space-y-1">
                  <p className="text-base font-medium text-white">
                    Enable artist subscription
                  </p>
                  <p className="text-sm text-slate-400">
                    Fans can subscribe for access to subscriber-only tracks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={subscriptionEnabled}
                  onChange={(event) => setSubscriptionEnabled(event.target.checked)}
                  className="h-4 w-4 accent-emerald-400"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Price</p>
                  <Input
                    value={subscriptionPrice}
                    onChange={(event) => setSubscriptionPrice(event.target.value)}
                    className="h-12 border-white/10 bg-slate-950 text-white"
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Asset code</p>
                  <Input
                    value={subscriptionAssetCode}
                    onChange={(event) =>
                      setSubscriptionAssetCode(event.target.value.toUpperCase())
                    }
                    className="h-12 border-white/10 bg-slate-950 text-white"
                    placeholder="XLM"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-sm text-slate-300">
                    Asset issuer <span className="text-slate-500">(leave blank for XLM)</span>
                  </p>
                  <Input
                    value={subscriptionAssetIssuer}
                    onChange={(event) => setSubscriptionAssetIssuer(event.target.value)}
                    className="h-12 border-white/10 bg-slate-950 text-white"
                    placeholder="G..."
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Billing period (days)</p>
                  <Input
                    value={subscriptionPeriodDays}
                    onChange={(event) => setSubscriptionPeriodDays(event.target.value)}
                    className="h-12 border-white/10 bg-slate-950 text-white"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                className="border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                onClick={() => setIsSubscriptionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                disabled={isSavingMonetization}
                onClick={async () => {
                  const didSave = await saveArtistSubscriptionSettings();

                  if (didSave) {
                    setIsSubscriptionModalOpen(false);
                  }
                }}
              >
                {isSavingMonetization ? "Saving..." : "Save subscription settings"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
