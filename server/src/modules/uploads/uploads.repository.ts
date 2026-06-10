import type { UploadSession } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";
import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<UploadSession>("upload-sessions");

export const uploadsRepository = {
  async findById(id: string) {
    if (databaseService.isEnabled()) {
      return databaseService.findPayloadById<UploadSession>("upload_sessions", id);
    }

    return store.findById(id);
  },

  async upsert(session: UploadSession) {
    if (databaseService.isEnabled()) {
      await databaseService.upsertUploadSession(
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
