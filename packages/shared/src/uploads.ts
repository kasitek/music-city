import { z } from "zod";

export const createUploadSessionSchema = z.object({
  trackId: z.string().min(1),
  purpose: z.enum(["audio", "cover"]).default("audio"),
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
});
export type CreateUploadSessionInput = z.infer<typeof createUploadSessionSchema>;

export interface UploadSession {
  id: string;
  trackId: string;
  purpose: "audio" | "cover";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey?: string;
  remoteUploadId?: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  provider: "local" | "s3" | "mux";
  expiresAt: string;
}

export const completeUploadSessionSchema = z.object({
  uploadSessionId: z.string().min(1),
  eTag: z.string().optional(),
});
export type CompleteUploadSessionInput = z.infer<
  typeof completeUploadSessionSchema
>;
