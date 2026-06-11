import type { EntitlementRecord } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";

export const entitlementsRepository = {
  async listByWallet(walletAddress: string) {
    return databaseService.listEntitlementsByWallet<EntitlementRecord>(walletAddress);
  },

  async listByTrack(trackId: string) {
    return databaseService.listEntitlementsByTrack<EntitlementRecord>(trackId);
  },

  async upsert(entitlement: EntitlementRecord) {
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
  },
};
