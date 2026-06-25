"use client";

import type { SubscriptionRecord } from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const subscriptionsApi = {
  async listMine(token: string) {
    const response = await httpClient.get<{ items: SubscriptionRecord[] }>(
      "/subscriptions/mine",
      token,
    );

    return response.items;
  },
};
