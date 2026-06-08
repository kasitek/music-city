import { createJsonStore } from "../../services/json-store.service.js";
const store = createJsonStore("tracks");
export const tracksRepository = {
    list() {
        return store.list();
    },
    listByArtist(artistId) {
        return store.list().filter((track) => track.artistId === artistId);
    },
    findById(trackId) {
        return store.findById(trackId);
    },
    upsert(track) {
        return store.upsert(track);
    },
};
