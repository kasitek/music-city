"use client";

import type { WalletAccount } from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const walletApi = {
  async getMe(token: string) {
    const response = await httpClient.get<{ account: WalletAccount }>(
      "/wallet/me",
      token,
    );

    return response.account;
  },
};
