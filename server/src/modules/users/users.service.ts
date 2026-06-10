import {
  upsertUserProfileSchema,
  type UpsertUserProfileInput,
  type UserProfile,
} from "@music-city/shared";

import { createId } from "../../services/id.service.js";
import { usersRepository } from "./users.repository.js";

const nowIso = () => new Date().toISOString();

export const usersService = {
  getProfile(walletAddress: string) {
    return usersRepository.findByWallet(walletAddress);
  },

  async upsertProfile(walletAddress: string, input: UpsertUserProfileInput) {
    const parsed = upsertUserProfileSchema.parse(input);
    const existing = await usersRepository.findByWallet(walletAddress);
    const timestamp = nowIso();

    const profile: UserProfile = {
      id: existing?.id ?? createId("usr"),
      walletAddress,
      displayName: parsed.displayName,
      role: parsed.role,
      bio: parsed.bio ?? existing?.bio ?? "",
      location: parsed.location ?? existing?.location ?? "",
      genres: parsed.genres ?? existing?.genres ?? [],
      profileImageUrl: existing?.profileImageUrl,
      verified: existing?.verified ?? false,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    return usersRepository.upsert(profile);
  },

  async listArtists() {
    const artists = await usersRepository.listArtists();

    return artists.map((artist) => ({
      id: artist.id,
      walletAddress: artist.walletAddress,
      name: artist.displayName,
      genre: artist.genres[0] ?? "Independent",
      city: artist.location || "Remote",
      monthlyListeners: "0",
      verified: artist.verified,
    }));
  },
};
