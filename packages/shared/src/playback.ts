import { z } from "zod";

export const createPlaybackSessionSchema = z.object({
  trackId: z.string().min(1),
});
export type CreatePlaybackSessionInput = z.infer<
  typeof createPlaybackSessionSchema
>;

export interface PlaybackSession {
  id: string;
  trackId: string;
  playbackUrl: string;
  mediaUrl: string;
  token: string;
  expiresAt: string;
}
