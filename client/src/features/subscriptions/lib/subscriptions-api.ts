"use client";

import type {
  PlatformSubscriptionPlan,
  SubscriptionRecord,
} from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const subscriptionsApi = {
  async getPlatformPlan() {
    const response = await httpClient.get<{ plan: PlatformSubscriptionPlan }>(
      "/subscriptions/platform-plan",
    );

    return response.plan;
  },

  async listMine(token: string) {
    const response = await httpClient.get<{ items: SubscriptionRecord[] }>(
      "/subscriptions/mine",
      token,
    );

    return response.items;
  },
};
