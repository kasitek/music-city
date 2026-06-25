"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Play, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";

import type { ArtistPublicProfile, TrackSummary } from "@music-city/shared";

import { Button } from "@/components/ui/button";
import { paymentsApi } from "@/features/payments/lib/payments-api";
import { useStellarCheckout } from "@/features/payments/hooks/use-stellar-checkout";
import { useGlobalPlayback } from "@/features/playback/providers/global-playback-provider";
import { useAuth } from "@/hooks/use-auth";
import { ApiClientError } from "@/lib/api/http-client";

const formatAmountLabel = (amount?: string, assetCode?: string) => {
  if (!amount) {
    return null;
  }

  return `${amount} ${assetCode ?? "XLM"}`;
};

export const TrackCommerceActions = ({
  track,
  artistProfile,
  onUnlocked,
  hidePlay = false,
}: {
  track: TrackSummary;
  artistProfile?: ArtistPublicProfile | null;
  onUnlocked?: () => void | Promise<void>;
  hidePlay?: boolean;
}) => {
  const { session } = useAuth();
  const { activeTrackId, playTrack } = useGlobalPlayback();
  const runCheckout = useStellarCheckout();
  const [isBuying, setIsBuying] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const purchaseLabel = useMemo(
    () => formatAmountLabel(track.purchasePrice, track.purchaseAssetCode),
    [track.purchaseAssetCode, track.purchasePrice],
  );
  const subscriptionLabel = useMemo(
    () =>
      formatAmountLabel(
        artistProfile?.subscriptionPrice,
        artistProfile?.subscriptionAssetCode,
      ),
    [artistProfile?.subscriptionAssetCode, artistProfile?.subscriptionPrice],
  );

  const ensureSession = () => {
    if (!session?.token) {
      toast.error("Sign in with your Stellar wallet first.");
      return null;
    }

    return session.token;
  };

  const handleBuyTrack = async () => {
    const token = ensureSession();

    if (!token) {
      return;
    }

    try {
      setIsBuying(true);
      const intent = await paymentsApi.createTrackPurchaseIntent(token, track.id);
      const txHash = await runCheckout(intent);
      await paymentsApi.confirm(token, {
        intentId: intent.id,
        txHash,
      });
      toast.success("Track unlocked.");
      await onUnlocked?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to complete purchase",
      );
    } finally {
      setIsBuying(false);
    }
  };

  const handleSubscribe = async () => {
    const token = ensureSession();

    if (!token || !artistProfile?.subscriptionEnabled) {
      return;
    }

    try {
      setIsSubscribing(true);
      const intent = await paymentsApi.createArtistSubscriptionIntent(
        token,
        artistProfile.id,
      );
      const txHash = await runCheckout(intent);
      await paymentsApi.confirm(token, {
        intentId: intent.id,
        txHash,
      });
      toast.success("Subscription activated.");
      await onUnlocked?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to complete subscription",
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePlay = async () => {
    try {
      await playTrack(track);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        if (track.access === "purchase_required") {
          toast.error("Buy this track first to unlock playback.");
          return;
        }

        if (track.access === "subscribers") {
          toast.error("Subscribe to this artist first to unlock playback.");
          return;
        }
      }

      toast.error(
        error instanceof Error ? error.message : "Unable to start playback",
      );
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {!hidePlay ? (
        <Button
          className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          disabled={!track.playbackReady || !session?.token}
          onClick={() => void handlePlay()}
        >
          <Play className="mr-2 h-4 w-4 fill-current" />
          {activeTrackId === track.id ? "Playing" : "Play"}
        </Button>
      ) : null}

      {track.access === "purchase_required" ? (
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={isBuying}
          onClick={() => void handleBuyTrack()}
        >
          {isBuying ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBag className="mr-2 h-4 w-4" />
          )}
          {purchaseLabel ? `Buy ${purchaseLabel}` : "Buy track"}
        </Button>
      ) : null}

      {track.access === "subscribers" && artistProfile?.subscriptionEnabled ? (
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={isSubscribing}
          onClick={() => void handleSubscribe()}
        >
          {isSubscribing ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {subscriptionLabel
            ? `Subscribe ${subscriptionLabel} / ${artistProfile.subscriptionPeriodDays}d`
            : "Subscribe"}
        </Button>
      ) : null}
    </div>
  );
};
