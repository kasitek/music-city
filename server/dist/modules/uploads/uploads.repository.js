import { createJsonStore } from "../../services/json-store.service.js";
const store = createJsonStore("upload-sessions");
export const uploadsRepository = {
    findById(id) {
        return store.findById(id);
    },
    upsert(session) {
        return store.upsert(session);
    },
};
