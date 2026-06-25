"use client";

import type {
  ConfirmPaymentInput,
  PaymentIntentRecord,
  PaymentRecord,
} from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const paymentsApi = {
  async listMine(token: string) {
    const response = await httpClient.get<{ items: PaymentRecord[] }>(
      "/payments/mine",
      token,
    );

    return response.items;
  },

  async createTrackPurchaseIntent(token: string, trackId: string) {
    const response = await httpClient.post<{ intent: PaymentIntentRecord }>(
      `/payments/intents/track/${trackId}`,
      {},
      token,
    );

    return response.intent;
  },

  async createArtistSubscriptionIntent(token: string, artistId: string) {
    const response = await httpClient.post<{ intent: PaymentIntentRecord }>(
      `/payments/intents/subscription/${artistId}`,
      {},
      token,
    );

    return response.intent;
  },

  async confirm(token: string, input: ConfirmPaymentInput) {
    return httpClient.post<{
      payment: PaymentRecord;
      entitlement?: { id: string; trackId: string };
      subscription?: { id: string; artistId: string; endsAt: string };
    }>("/payments/confirm", input, token);
  },
};
