import type { PlaybackSession } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";
import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<PlaybackSession>("playback-sessions");

export const playbackRepository = {
  async findById(id: string) {
    if (databaseService.isEnabled()) {
      return databaseService.findPayloadById<PlaybackSession>("playback_sessions", id);
    }

    return store.findById(id);
  },

  async upsert(session: PlaybackSession) {
    if (databaseService.isEnabled()) {
      await databaseService.upsertPlaybackSession(
        session.id,
        session.trackId,
        session.provider,
        session.expiresAt,
        session,
      );
      return session;
    }

    return store.upsert(session);
  },
};
