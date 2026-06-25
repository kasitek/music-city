"use client";

import { useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isStellarWallet } from "@dynamic-labs/stellar";

import type { PaymentIntentRecord } from "@music-city/shared";

export const useStellarCheckout = () => {
  const { primaryWallet } = useDynamicContext();

  return useCallback(
    async (intent: PaymentIntentRecord) => {
      if (!primaryWallet || !isStellarWallet(primaryWallet)) {
        throw new Error("A Stellar wallet is required to complete this payment.");
      }

      const walletAddress = primaryWallet.address;

      if (!walletAddress) {
        throw new Error("Connected Stellar wallet address is missing.");
      }

      return primaryWallet.sendBalance({
        amount: intent.amount,
        toAddress: intent.destinationAddress,
        token:
          intent.assetCode.toUpperCase() === "XLM" && !intent.assetIssuer
            ? undefined
            : {
                address: `${intent.assetCode}:${intent.assetIssuer ?? ""}`,
              },
      });
    },
    [primaryWallet],
  );
};
