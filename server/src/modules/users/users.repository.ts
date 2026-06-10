import type { UserProfile } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";
import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<UserProfile>("users");

export const usersRepository = {
  async findByWallet(walletAddress: string) {
    if (databaseService.isEnabled()) {
      return databaseService.findUserByWallet<UserProfile>(walletAddress);
    }

    return (
      store.list().find((user) => user.walletAddress === walletAddress) ?? null
    );
  },

  async upsert(user: UserProfile) {
    if (databaseService.isEnabled()) {
      await databaseService.upsertUser(
        user.id,
        user.walletAddress,
        user.role,
        user,
      );
      return user;
    }

    return store.upsert(user);
  },

  async listArtists() {
    if (databaseService.isEnabled()) {
      return databaseService.listUsersByRole<UserProfile>("artist");
    }

    return store.list().filter((user) => user.role === "artist");
  },
};
