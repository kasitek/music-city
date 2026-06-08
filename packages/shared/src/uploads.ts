import { z } from "zod";

export const createUploadSessionSchema = z.object({
  trackId: z.string().min(1),
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
});
export type CreateUploadSessionInput = z.infer<typeof createUploadSessionSchema>;

export interface UploadSession {
  id: string;
  trackId: string;
  storageKey: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  provider: "local" | "s3";
  expiresAt: string;
}

export const completeUploadSessionSchema = z.object({
  uploadSessionId: z.string().min(1),
  eTag: z.string().optional(),
});
export type CompleteUploadSessionInput = z.infer<
  typeof completeUploadSessionSchema
>;
