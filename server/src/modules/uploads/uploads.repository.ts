import type { UploadSession } from "@music-city/shared";

import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<UploadSession>("upload-sessions");

export const uploadsRepository = {
  findById(id: string) {
    return store.findById(id);
  },

  upsert(session: UploadSession) {
    return store.upsert(session);
  },
};
