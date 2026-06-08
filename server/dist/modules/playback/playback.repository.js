import { createJsonStore } from "../../services/json-store.service.js";
const store = createJsonStore("playback-sessions");
export const playbackRepository = {
    findById(id) {
        return store.findById(id);
    },
    upsert(session) {
        return store.upsert(session);
    },
};
