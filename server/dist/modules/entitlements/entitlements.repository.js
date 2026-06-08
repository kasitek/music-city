import { createJsonStore } from "../../services/json-store.service.js";
const store = createJsonStore("entitlements");
export const entitlementsRepository = {
    listByWallet(walletAddress) {
        return store.list().filter((item) => item.walletAddress === walletAddress);
    },
    listByTrack(trackId) {
        return store.list().filter((item) => item.trackId === trackId);
    },
    upsert(entitlement) {
        return store.upsert(entitlement);
    },
};
