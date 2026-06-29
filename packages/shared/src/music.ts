import { z } from "zod";

import {
  optionalPositiveAmountSchema,
  optionalStellarAssetCodeSchema,
  optionalStellarAssetIssuerSchema,
  requireIssuerForNonNativeAsset,
  stellarWalletAddressSchema,
} from "./commerce.js";

export const trackStatusSchema = z.enum([
  "draft",
  "awaiting_upload",
  "uploaded",
  "processing",
  "published",
  "failed",
]);
export type TrackStatus = z.infer<typeof trackStatusSchema>;

export const trackAccessSchema = z.enum([
  "private",
  "subscribers",
  "purchase_required",
  "public",
]);
export type TrackAccess = z.infer<typeof trackAccessSchema>;

export const creatorTrackAccessSchema = z.enum([
  "private",
  "purchase_required",
  "public",
]);
export type CreatorTrackAccess = z.infer<typeof creatorTrackAccessSchema>;

export interface ArtistSummary {
  id: string;
  walletAddress: z.infer<typeof stellarWalletAddressSchema>;
  name: string;
  genre: string;
  city: string;
  monthlyListeners: string;
  verified: boolean;
}

export interface TrackSummary {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  releaseArtistName?: string;
  featuredArtists?: string[];
  composer?: string;
  producer?: string;
  isrc?: string;
  recordLabel?: string;
  publisher?: string;
  country?: string;
  genre: string;
  runtime: string;
  priceLabel: string;
  status: TrackStatus;
  access: TrackAccess;
  plays: number;
  likes: number;
  description?: string;
  coverImageUrl?: string;
  coverStorageKey?: string;
  purchaseEnabled?: boolean;
  purchasePrice?: string;
  purchaseAssetCode?: string;
  purchaseAssetIssuer?: string;
  playbackUrl?: string;
  streamManifestUrl?: string;
  streamMediaUrl?: string;
  masterStorageKey?: string;
  streamManifestKey?: string;
  mediaProvider?: "local" | "mux";
  sourceFileName?: string;
  sourceContentType?: string;
  sourceSizeBytes?: number;
  muxUploadId?: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  muxAssetStatus?: "waiting" | "asset_created" | "ready" | "errored";
  playbackReady?: boolean;
  archiveStatus?: "not_requested" | "pending" | "ready" | "failed";
  createdAt?: string;
  updatedAt?: string;
}

export const trackCreateSchema = z.object({
  title: z.string().min(1).max(160),
  artistName: z.string().min(1).max(120).optional(),
  featuredArtists: z.array(z.string().min(1).max(120)).max(8).optional(),
  composer: z.string().max(120).optional(),
  producer: z.string().max(120).optional(),
  isrc: z.string().max(32).optional(),
  recordLabel: z.string().max(120).optional(),
  publisher: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
  genre: z.string().min(1).max(80),
  description: z.string().max(1000).optional(),
  priceLabel: z.string().max(80).optional(),
  access: creatorTrackAccessSchema.default("private"),
  purchaseEnabled: z.boolean().optional(),
  purchasePrice: optionalPositiveAmountSchema,
  purchaseAssetCode: optionalStellarAssetCodeSchema,
  purchaseAssetIssuer: optionalStellarAssetIssuerSchema,
}).superRefine((value, context) => {
  if (value.access === "purchase_required" && !value.purchasePrice) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["purchasePrice"],
      message: "Purchase price is required when purchase access is enabled",
    });
  }

  const issue = requireIssuerForNonNativeAsset({
    assetCode: value.purchaseAssetCode,
    assetIssuer: value.purchaseAssetIssuer,
  });

  if (issue) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["purchaseAssetIssuer"],
      message: issue.message,
    });
  }
});
export type TrackCreateInput = z.infer<typeof trackCreateSchema>;

export const trackAccessUpdateSchema = z.object({
  access: creatorTrackAccessSchema,
});
export type TrackAccessUpdateInput = z.infer<typeof trackAccessUpdateSchema>;

export const trackMonetizationUpdateSchema = z
  .object({
    access: creatorTrackAccessSchema,
    purchaseEnabled: z.boolean().optional(),
    purchasePrice: optionalPositiveAmountSchema,
    purchaseAssetCode: optionalStellarAssetCodeSchema,
    purchaseAssetIssuer: optionalStellarAssetIssuerSchema,
  })
  .superRefine((value, context) => {
    const purchaseEnabled =
      value.purchaseEnabled ?? value.access === "purchase_required";

    if (purchaseEnabled && !value.purchasePrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purchasePrice"],
        message: "Purchase price is required when track purchases are enabled",
      });
    }

    const issue = requireIssuerForNonNativeAsset({
      assetCode: value.purchaseAssetCode,
      assetIssuer: value.purchaseAssetIssuer,
    });

    if (issue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purchaseAssetIssuer"],
        message: issue.message,
      });
    }
  });
export type TrackMonetizationUpdateInput = z.infer<
  typeof trackMonetizationUpdateSchema
>;
