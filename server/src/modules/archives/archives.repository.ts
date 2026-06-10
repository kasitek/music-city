import type { ArchiveRecord } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";
import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<ArchiveRecord>("archives");

export const archivesRepository = {
  async listByTrack(trackId: string) {
    if (databaseService.isEnabled()) {
      return databaseService.listArchivesByTrack<ArchiveRecord>(trackId);
    }

    return store.list().filter((item) => item.trackId === trackId);
  },

  async upsert(record: ArchiveRecord) {
    if (databaseService.isEnabled()) {
      await databaseService.upsertArchive(
        record.id,
        record.trackId,
        record.createdAt,
        record,
      );
      return record;
    }

    return store.upsert(record);
  },
};
