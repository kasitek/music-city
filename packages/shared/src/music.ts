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
  access: trackAccessSchema.default("private"),
});
export type TrackCreateInput = z.infer<typeof trackCreateSchema>;
