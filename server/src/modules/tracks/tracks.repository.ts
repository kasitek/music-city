import type { TrackSummary } from "@music-city/shared";

import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<TrackSummary>("tracks");

export const tracksRepository = {
  list() {
    return store.list();
  },

  listByArtist(artistId: string) {
    return store.list().filter((track) => track.artistId === artistId);
  },

  findById(trackId: string) {
    return store.findById(trackId);
  },

  upsert(track: TrackSummary) {
    return store.upsert(track);
  },
};
