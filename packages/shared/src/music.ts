import { z } from "zod";

export const trackStatusSchema = z.enum([
  "draft",
  "awaiting_upload",
  "uploaded",
  "processing",
  "published",
  "failed",
]);
export type TrackStatus = z.infer<typeof trackStatusSchema>;

export const trackAccessSchema = z.enum(["private", "subscribers", "public"]);
export type TrackAccess = z.infer<typeof trackAccessSchema>;

export interface ArtistSummary {
  id: string;
  walletAddress: string;
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
  genre: string;
  runtime: string;
  priceLabel: string;
  status: TrackStatus;
  access: TrackAccess;
  plays: number;
  likes: number;
  description?: string;
  coverImageUrl?: string;
  playbackUrl?: string;
  streamManifestUrl?: string;
  streamMediaUrl?: string;
  masterStorageKey?: string;
  streamManifestKey?: string;
  sourceFileName?: string;
  sourceContentType?: string;
  sourceSizeBytes?: number;
  playbackReady?: boolean;
  archiveStatus?: "not_requested" | "pending" | "ready" | "failed";
  createdAt?: string;
  updatedAt?: string;
}

export const trackCreateSchema = z.object({
  title: z.string().min(1).max(160),
  genre: z.string().min(1).max(80),
  description: z.string().max(1000).optional(),
  priceLabel: z.string().max(80).optional(),
  access: trackAccessSchema.default("private"),
});
export type TrackCreateInput = z.infer<typeof trackCreateSchema>;
