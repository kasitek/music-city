import type { EntitlementRecord } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";
import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<EntitlementRecord>("entitlements");

export const entitlementsRepository = {
  async listByWallet(walletAddress: string) {
    if (databaseService.isEnabled()) {
      return databaseService.listEntitlementsByWallet<EntitlementRecord>(walletAddress);
    }

    return store.list().filter((item) => item.walletAddress === walletAddress);
  },

  async listByTrack(trackId: string) {
    if (databaseService.isEnabled()) {
      return databaseService.listEntitlementsByTrack<EntitlementRecord>(trackId);
    }

    return store.list().filter((item) => item.trackId === trackId);
  },

  async upsert(entitlement: EntitlementRecord) {
    if (databaseService.isEnabled()) {
      await databaseService.upsertEntitlement(
        entitlement.id,
        entitlement.walletAddress,
        entitlement.trackId,
        entitlement.source,
        entitlement.startsAt,
        entitlement.endsAt ?? null,
        entitlement,
      );
      return entitlement;
    }

    return store.upsert(entitlement);
  },
};
