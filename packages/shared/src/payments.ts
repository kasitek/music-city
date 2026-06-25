import { z } from "zod";

export const paymentProductTypeSchema = z.enum([
  "track_purchase",
  "artist_subscription",
]);
export type PaymentProductType = z.infer<typeof paymentProductTypeSchema>;

export const paymentIntentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "expired",
  "failed",
]);
export type PaymentIntentStatus = z.infer<typeof paymentIntentStatusSchema>;

export const paymentStatusSchema = z.enum(["confirmed", "failed"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const subscriptionStatusSchema = z.enum(["active", "expired", "cancelled"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const stellarAssetSchema = z.object({
  code: z.string(),
  issuer: z.string().optional(),
  isNative: z.boolean().default(false),
});
export type StellarAssetDescriptor = z.infer<typeof stellarAssetSchema>;

export const paymentIntentSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  productType: paymentProductTypeSchema,
  trackId: z.string().optional(),
  artistId: z.string().optional(),
  amount: z.string(),
  assetCode: z.string(),
  assetIssuer: z.string().optional(),
  destinationAddress: z.string(),
  memo: z.string(),
  status: paymentIntentStatusSchema,
  txHash: z.string().optional(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PaymentIntentRecord = z.infer<typeof paymentIntentSchema>;

export const paymentRecordSchema = z.object({
  id: z.string(),
  intentId: z.string(),
  walletAddress: z.string(),
  productType: paymentProductTypeSchema,
  trackId: z.string().optional(),
  artistId: z.string().optional(),
  txHash: z.string(),
  amount: z.string(),
  assetCode: z.string(),
  assetIssuer: z.string().optional(),
  status: paymentStatusSchema,
  confirmedAt: z.string(),
  createdAt: z.string(),
});
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;

export const subscriptionRecordSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  artistId: z.string(),
  status: subscriptionStatusSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  paymentId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SubscriptionRecord = z.infer<typeof subscriptionRecordSchema>;

export const createTrackPurchaseIntentSchema = z.object({
  trackId: z.string().min(1),
});
export type CreateTrackPurchaseIntentInput = z.infer<
  typeof createTrackPurchaseIntentSchema
>;

export const createArtistSubscriptionIntentSchema = z.object({
  artistId: z.string().min(1),
});
export type CreateArtistSubscriptionIntentInput = z.infer<
  typeof createArtistSubscriptionIntentSchema
>;

export const confirmPaymentSchema = z.object({
  intentId: z.string().min(1),
  txHash: z.string().min(1),
});
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
