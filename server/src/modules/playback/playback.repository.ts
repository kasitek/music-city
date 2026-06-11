import type { PlaybackSession } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";

export const playbackRepository = {
  async findById(id: string) {
    return databaseService.findPayloadById<PlaybackSession>("playback_sessions", id);
  },

  async upsert(session: PlaybackSession) {
    await databaseService.upsertPlaybackSession(
      session.id,
      session.trackId,
      session.provider,
      session.expiresAt,
      session,
    );
    return session;
  },
};
