import type { ArchiveRecord } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";

export const archivesRepository = {
  async listByTrack(trackId: string) {
    return databaseService.listArchivesByTrack<ArchiveRecord>(trackId);
  },

  async upsert(record: ArchiveRecord) {
    await databaseService.upsertArchive(
      record.id,
      record.trackId,
      record.createdAt,
      record,
    );
    return record;
  },
};
