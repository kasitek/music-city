import type { WalletAccount, WalletBalance } from "@music-city/shared";

import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";

type HorizonBalance = {
  balance?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
  limit?: string;
};

type HorizonAccountResponse = {
  sequence?: string;
  subentry_count?: number;
  balances?: HorizonBalance[];
};

const DECIMAL_SCALE = 10_000_000n;

const parseAmount = (value?: string) => {
  const normalized = (value ?? "0").trim();
  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}0000000`.slice(0, 7);
  return BigInt(whole || "0") * DECIMAL_SCALE + BigInt(paddedFraction || "0");
};

const formatAmount = (value: bigint) => {
  const whole = value / DECIMAL_SCALE;
  const fraction = `${value % DECIMAL_SCALE}`.padStart(7, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
};

const subtractAmounts = (amount: string, other?: string) => {
  const result = parseAmount(amount) - parseAmount(other);
  return formatAmount(result > 0n ? result : 0n);
};

const toAssetCode = (balance: HorizonBalance) =>
  balance.asset_type === "native" ? "XLM" : balance.asset_code ?? "UNKNOWN";

const toAssetKey = (balance: HorizonBalance) => {
  if (balance.asset_type === "native") {
    return "native";
  }

  return `${toAssetCode(balance)}:${balance.asset_issuer ?? ""}`;
};

const balancePriority = (balance: WalletBalance) => {
  if (balance.isNative) {
    return 0;
  }

  if (balance.assetCode === "USDC") {
    return 1;
  }

  return 2;
};

const sortBalances = (balances: WalletBalance[]) =>
  [...balances].sort((left, right) => {
    const priorityDelta = balancePriority(left) - balancePriority(right);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.assetKey.localeCompare(right.assetKey);
  });

const parseBalance = (balance: HorizonBalance): WalletBalance => {
  const amount = balance.balance?.trim() || "0";
  const sellingLiabilities = balance.selling_liabilities?.trim() || "0";
  const buyingLiabilities = balance.buying_liabilities?.trim() || "0";

  return {
    assetType: balance.asset_type ?? "unknown",
    assetCode: toAssetCode(balance),
    assetIssuer: balance.asset_type === "native" ? undefined : balance.asset_issuer,
    assetKey: toAssetKey(balance),
    amount,
    availableAmount: subtractAmounts(amount, sellingLiabilities),
    buyingLiabilities,
    sellingLiabilities,
    limit: balance.limit?.trim() || undefined,
    isNative: balance.asset_type === "native",
  };
};

export const walletService = {
  async getWalletAccount(walletAddress: string): Promise<WalletAccount> {
    const response = await fetch(
      `${env.STELLAR_HORIZON_URL}/accounts/${encodeURIComponent(walletAddress)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (response.status === 404) {
      return {
        walletAddress,
        exists: false,
        balances: [],
        subentryCount: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    if (!response.ok) {
      throw new HttpError(502, "Unable to load Stellar wallet balances right now");
    }

    const payload = (await response.json()) as HorizonAccountResponse;
    const balances = sortBalances((payload.balances ?? []).map(parseBalance));

    return {
      walletAddress,
      exists: true,
      sequence: payload.sequence,
      subentryCount: payload.subentry_count ?? 0,
      balances,
      updatedAt: new Date().toISOString(),
    };
  },
};
