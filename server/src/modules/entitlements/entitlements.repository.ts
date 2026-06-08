import type { EntitlementRecord } from "@music-city/shared";

import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<EntitlementRecord>("entitlements");

export const entitlementsRepository = {
  listByWallet(walletAddress: string) {
    return store.list().filter((item) => item.walletAddress === walletAddress);
  },

  listByTrack(trackId: string) {
    return store.list().filter((item) => item.trackId === trackId);
  },

  upsert(entitlement: EntitlementRecord) {
    return store.upsert(entitlement);
  },
};
