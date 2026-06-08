import type { PlaybackSession } from "@music-city/shared";

import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<PlaybackSession>("playback-sessions");

export const playbackRepository = {
  findById(id: string) {
    return store.findById(id);
  },

  upsert(session: PlaybackSession) {
    return store.upsert(session);
  },
};
