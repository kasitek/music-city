import type { SubscriptionRecord } from "@music-city/shared";

import { createId } from "../../services/id.service.js";
import { subscriptionsRepository } from "./subscriptions.repository.js";

const nowMs = () => Date.now();

const isActive = (subscription: SubscriptionRecord) =>
  subscription.status === "active" && Date.parse(subscription.endsAt) > nowMs();

export const subscriptionsService = {
  async listMine(walletAddress: string) {
    const items = await subscriptionsRepository.listByWallet(walletAddress);
    return items.map((subscription) =>
      isActive(subscription)
        ? subscription
        : {
            ...subscription,
            status: "expired" as const,
          },
    );
  },

  async hasActiveArtistSubscription(walletAddress: string, artistId: string) {
    const items = await subscriptionsRepository.listByWallet(walletAddress);

    return items.some(
      (subscription) =>
        subscription.artistId === artistId && isActive(subscription),
    );
  },

  async findByArtistAndPayment(walletAddress: string, artistId: string, paymentId: string) {
    const items = await subscriptionsRepository.listByWallet(walletAddress);

    return items.find(
      (subscription) =>
        subscription.artistId === artistId &&
        subscription.paymentId === paymentId,
    );
  },

  async activateOrExtend(
    walletAddress: string,
    artistId: string,
    paymentId: string,
    periodDays: number,
  ) {
    const existing = (await subscriptionsRepository.listByWallet(walletAddress))
      .filter((subscription) => subscription.artistId === artistId)
      .sort(
        (left, right) =>
          Date.parse(right.endsAt) - Date.parse(left.endsAt),
      )[0];

    const baseMs =
      existing && Date.parse(existing.endsAt) > nowMs()
        ? Date.parse(existing.endsAt)
        : nowMs();
    const startsAt =
      existing && Date.parse(existing.endsAt) > nowMs()
        ? existing.startsAt
        : new Date(nowMs()).toISOString();
    const endsAt = new Date(
      baseMs + periodDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const timestamp = new Date().toISOString();

    return subscriptionsRepository.upsert({
      id: existing?.id ?? createId("sub"),
      walletAddress,
      artistId,
      status: "active",
      startsAt,
      endsAt,
      paymentId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  },
};
