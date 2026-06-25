import type {
  ConfirmPaymentInput,
  PaymentIntentRecord,
  PaymentProductType,
  PaymentRecord,
  StellarAssetDescriptor,
} from "@music-city/shared";
import {
  confirmPaymentSchema,
  paymentIntentSchema,
} from "@music-city/shared";

import { env } from "../../config/env.js";
import { entitlementsService } from "../entitlements/entitlements.service.js";
import { tracksService } from "../tracks/tracks.service.js";
import { usersService } from "../users/users.service.js";
import { createId } from "../../services/id.service.js";
import { HttpError } from "../../utils/http-error.js";
import { paymentsRepository } from "./payments.repository.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";

const INTENT_TTL_MS = 15 * 60 * 1000;

const normalizeAmount = (value: string) => Number(value).toFixed(7);

const withIntentPrecision = (amount: string, intentId: string) => {
  const baseUnits = Math.round(Number(amount) * 10_000_000);
  const nonce = [...intentId].reduce(
    (sum, char, index) => (sum + char.charCodeAt(0) * (index + 1)) % 100_000,
    0,
  );

  return ((baseUnits + nonce) / 10_000_000).toFixed(7);
};

const settlementAsset = (): StellarAssetDescriptor => ({
  code: env.STELLAR_SETTLEMENT_ASSET_CODE,
  issuer: env.STELLAR_SETTLEMENT_ASSET_ISSUER,
  isNative:
    env.STELLAR_SETTLEMENT_ASSET_CODE.toUpperCase() === "XLM" &&
    !env.STELLAR_SETTLEMENT_ASSET_ISSUER,
});

const requireTreasuryAddress = () => {
  if (!env.STELLAR_TREASURY_ADDRESS) {
    throw new HttpError(500, "STELLAR_TREASURY_ADDRESS is not configured");
  }

  return env.STELLAR_TREASURY_ADDRESS;
};

const createIntentRecord = (input: {
  walletAddress: string;
  productType: PaymentProductType;
  trackId?: string;
  artistId?: string;
  amount: string;
  asset: StellarAssetDescriptor;
}) => {
  const timestamp = new Date().toISOString();
  const id = createId("payi");
  const preciseAmount = withIntentPrecision(input.amount, id);

  return paymentIntentSchema.parse({
    id,
    walletAddress: input.walletAddress,
    productType: input.productType,
    trackId: input.trackId,
    artistId: input.artistId,
    amount: preciseAmount,
    assetCode: input.asset.code,
    assetIssuer: input.asset.issuer,
    destinationAddress: requireTreasuryAddress(),
    memo: `${input.productType}:${id}`,
    status: "pending",
    expiresAt: new Date(Date.now() + INTENT_TTL_MS).toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
};

type HorizonTransaction = {
  successful?: boolean;
  source_account?: string;
  memo?: string;
  memo_type?: string;
  hash?: string;
};

type HorizonOperation = {
  type?: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
};

const fetchTransaction = async (txHash: string) => {
  const response = await fetch(
    `${env.STELLAR_HORIZON_URL}/transactions/${encodeURIComponent(txHash)}`,
  );

  if (!response.ok) {
    throw new HttpError(400, "Stellar transaction could not be found");
  }

  return (await response.json()) as HorizonTransaction;
};

const fetchTransactionOperations = async (txHash: string) => {
  const response = await fetch(
    `${env.STELLAR_HORIZON_URL}/transactions/${encodeURIComponent(txHash)}/operations?limit=200&order=asc`,
  );

  if (!response.ok) {
    throw new HttpError(400, "Stellar transaction operations could not be loaded");
  }

  const payload = (await response.json()) as {
    _embedded?: { records?: HorizonOperation[] };
  };

  return payload._embedded?.records ?? [];
};

const operationMatchesAsset = (
  operation: HorizonOperation,
  intent: PaymentIntentRecord,
) => {
  const nativeIntent =
    intent.assetCode.toUpperCase() === "XLM" && !intent.assetIssuer;

  if (nativeIntent) {
    return operation.asset_type === "native";
  }

  return (
    operation.asset_code === intent.assetCode &&
    operation.asset_issuer === intent.assetIssuer
  );
};

const verifyTransactionAgainstIntent = async (
  walletAddress: string,
  txHash: string,
  intent: PaymentIntentRecord,
) => {
  const transaction = await fetchTransaction(txHash);

  if (!transaction.successful) {
    throw new HttpError(400, "Stellar payment transaction was not successful");
  }

  if (transaction.source_account !== walletAddress) {
    throw new HttpError(403, "Stellar payment source account does not match session wallet");
  }

  if (
    transaction.memo &&
    (transaction.memo_type !== "text" || transaction.memo !== intent.memo)
  ) {
    throw new HttpError(400, "Stellar payment memo does not match payment intent");
  }

  const operations = await fetchTransactionOperations(txHash);
  const paymentOperation = operations.find(
    (operation) =>
      operation.type === "payment" &&
      operation.to === intent.destinationAddress &&
      operationMatchesAsset(operation, intent) &&
      normalizeAmount(operation.amount ?? "0") === normalizeAmount(intent.amount),
  );

  if (!paymentOperation) {
    throw new HttpError(400, "No matching Stellar payment operation was found");
  }

  return {
    transaction,
    paymentOperation,
  };
};

export const paymentsService = {
  async listMine(walletAddress: string) {
    return paymentsRepository.listPaymentsByWallet(walletAddress);
  },

  async createTrackPurchaseIntent(walletAddress: string, trackId: string) {
    const track = await tracksService.getTrackForPlayback(trackId);

    if (!track || !track.playbackReady || track.access === "private") {
      throw new HttpError(404, "Track not found");
    }

    if (track.artistId === (await usersService.getProfile(walletAddress))?.id) {
      throw new HttpError(400, "Artists do not need to purchase their own track");
    }

    if (!track.purchaseEnabled || !track.purchasePrice) {
      throw new HttpError(400, "Track purchase is not enabled");
    }

    const existingEntitlements = await entitlementsService.listMine(walletAddress);

    if (existingEntitlements.some((entitlement) => entitlement.trackId === trackId)) {
      throw new HttpError(400, "Track is already unlocked for this wallet");
    }

    const intent = createIntentRecord({
      walletAddress,
      productType: "track_purchase",
      trackId,
      amount: track.purchasePrice,
      asset: {
        code: track.purchaseAssetCode ?? settlementAsset().code,
        issuer: track.purchaseAssetIssuer ?? settlementAsset().issuer,
        isNative:
          (track.purchaseAssetCode ?? settlementAsset().code).toUpperCase() ===
            "XLM" &&
          !(track.purchaseAssetIssuer ?? settlementAsset().issuer),
      },
    });

    return paymentsRepository.upsertIntent(intent);
  },

  async createArtistSubscriptionIntent(walletAddress: string, artistId: string) {
    const artist = await usersService.getProfileById(artistId);

    if (!artist) {
      throw new HttpError(404, "Artist not found");
    }

    if (artist.walletAddress === walletAddress) {
      throw new HttpError(400, "Artists do not need to subscribe to themselves");
    }

    if (!artist.subscriptionEnabled || !artist.subscriptionPrice) {
      throw new HttpError(400, "Artist subscription is not enabled");
    }

    const intent = createIntentRecord({
      walletAddress,
      productType: "artist_subscription",
      artistId,
      amount: artist.subscriptionPrice,
      asset: {
        code: artist.subscriptionAssetCode ?? settlementAsset().code,
        issuer: artist.subscriptionAssetIssuer ?? settlementAsset().issuer,
        isNative:
          (artist.subscriptionAssetCode ?? settlementAsset().code).toUpperCase() ===
            "XLM" &&
          !(artist.subscriptionAssetIssuer ?? settlementAsset().issuer),
      },
    });

    return paymentsRepository.upsertIntent(intent);
  },

  async confirm(walletAddress: string, input: ConfirmPaymentInput) {
    const parsed = confirmPaymentSchema.parse(input);
    const intent = await paymentsRepository.findIntentById(parsed.intentId);

    if (!intent || intent.walletAddress !== walletAddress) {
      throw new HttpError(404, "Payment intent not found");
    }

    if (intent.status !== "pending") {
      throw new HttpError(400, "Payment intent is no longer pending");
    }

    if (Date.parse(intent.expiresAt) < Date.now()) {
      await paymentsRepository.upsertIntent({
        ...intent,
        status: "expired",
        updatedAt: new Date().toISOString(),
      });
      throw new HttpError(400, "Payment intent has expired");
    }

    const existingPayment = await paymentsRepository.findPaymentByTxHash(
      parsed.txHash,
    );

    if (existingPayment) {
      throw new HttpError(400, "Transaction has already been used");
    }

    await verifyTransactionAgainstIntent(walletAddress, parsed.txHash, intent);

    const timestamp = new Date().toISOString();
    const payment: PaymentRecord = {
      id: createId("pay"),
      intentId: intent.id,
      walletAddress,
      productType: intent.productType,
      trackId: intent.trackId,
      artistId: intent.artistId,
      txHash: parsed.txHash,
      amount: intent.amount,
      assetCode: intent.assetCode,
      assetIssuer: intent.assetIssuer,
      status: "confirmed",
      confirmedAt: timestamp,
      createdAt: timestamp,
    };

    await paymentsRepository.upsertPayment(payment);
    await paymentsRepository.upsertIntent({
      ...intent,
      status: "confirmed",
      txHash: parsed.txHash,
      updatedAt: timestamp,
    });

    if (intent.productType === "track_purchase" && intent.trackId) {
      const entitlement = await entitlementsService.grantPurchase(
        walletAddress,
        intent.trackId,
      );
      return { payment, entitlement };
    }

    if (intent.productType === "artist_subscription" && intent.artistId) {
      const artist = await usersService.getProfileById(intent.artistId);

      if (!artist) {
        throw new HttpError(404, "Artist not found");
      }

      const subscription = await subscriptionsService.activateOrExtend(
        walletAddress,
        intent.artistId,
        payment.id,
        artist.subscriptionPeriodDays,
      );

      return { payment, subscription };
    }

    throw new HttpError(400, "Unsupported payment product");
  },
};
