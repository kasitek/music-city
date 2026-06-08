import type {
  ArtistSummary,
  UpsertUserProfileInput,
  UserProfile,
} from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const usersApi = {
  async getMe(token: string) {
    const response = await httpClient.get<{ profile: UserProfile | null }>(
      "/users/me",
      token,
    );

    return response.profile;
  },

  async saveMe(token: string, input: UpsertUserProfileInput) {
    const response = await httpClient.put<{ profile: UserProfile }>(
      "/users/me",
      input,
      token,
    );

    return response.profile;
  },

  async listArtists() {
    const response = await httpClient.get<{ items: ArtistSummary[] }>(
      "/users/artists",
    );

    return response.items;
  },
};
