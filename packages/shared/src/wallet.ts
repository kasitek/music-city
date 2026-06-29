import { z } from "zod";

import {
  optionalStellarAssetIssuerSchema,
  stellarAssetCodeSchema,
  stellarWalletAddressSchema,
} from "./commerce.js";

const nonNegativeDecimalSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,7})?$/, "Amount must be a non-negative decimal with up to 7 decimals");

export const walletBalanceSchema = z.object({
  assetType: z.string(),
  assetCode: stellarAssetCodeSchema,
  assetIssuer: optionalStellarAssetIssuerSchema,
  assetKey: z.string().min(1),
  amount: nonNegativeDecimalSchema,
  availableAmount: nonNegativeDecimalSchema,
  buyingLiabilities: nonNegativeDecimalSchema.default("0"),
  sellingLiabilities: nonNegativeDecimalSchema.default("0"),
  limit: nonNegativeDecimalSchema.optional(),
  isNative: z.boolean().default(false),
});
export type WalletBalance = z.infer<typeof walletBalanceSchema>;

export const walletAccountSchema = z.object({
  walletAddress: stellarWalletAddressSchema,
  exists: z.boolean().default(false),
  sequence: z.string().optional(),
  subentryCount: z.number().int().nonnegative().default(0),
  balances: z.array(walletBalanceSchema).default([]),
  updatedAt: z.string(),
});
export type WalletAccount = z.infer<typeof walletAccountSchema>;
