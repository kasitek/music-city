import { createJsonStore } from "../../services/json-store.service.js";
const store = createJsonStore("archives");
export const archivesRepository = {
    listByTrack(trackId) {
        return store.list().filter((item) => item.trackId === trackId);
    },
    upsert(record) {
        return store.upsert(record);
    },
};
