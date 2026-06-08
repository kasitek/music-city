import type { ArchiveRecord } from "@music-city/shared";

import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<ArchiveRecord>("archives");

export const archivesRepository = {
  listByTrack(trackId: string) {
    return store.list().filter((item) => item.trackId === trackId);
  },

  upsert(record: ArchiveRecord) {
    return store.upsert(record);
  },
};
