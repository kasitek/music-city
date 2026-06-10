import type { TrackCreateInput, TrackSummary } from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const tracksApi = {
  async listTracks() {
    const response = await httpClient.get<{ items: TrackSummary[] }>("/tracks");

    return response.items;
  },

  async listMyTracks(token: string) {
    const response = await httpClient.get<{ items: TrackSummary[] }>(
      "/tracks/mine",
      token,
    );

    return response.items;
  },

  async createTrack(token: string, input: TrackCreateInput) {
    const response = await httpClient.post<{ track: TrackSummary }>(
      "/tracks",
      input,
      token,
    );

    return response.track;
  },

  async getTrack(trackId: string) {
    const response = await httpClient.get<{ track: TrackSummary | null }>(
      `/tracks/${trackId}`,
    );

    return response.track;
  },
};
