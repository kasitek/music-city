import type { UserProfile } from "@music-city/shared";

import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<UserProfile>("users");

export const usersRepository = {
  findByWallet(walletAddress: string) {
    return (
      store.list().find((user) => user.walletAddress === walletAddress) ?? null
    );
  },

  upsert(user: UserProfile) {
    return store.upsert(user);
  },

  listArtists() {
    return store.list().filter((user) => user.role === "artist");
  },
};
