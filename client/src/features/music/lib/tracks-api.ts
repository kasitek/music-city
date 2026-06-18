import type {
  TrackAccess,
  TrackCreateInput,
  TrackSummary,
} from "@music-city/shared";

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

  async getManageTrack(token: string, trackId: string) {
    const response = await httpClient.get<{ track: TrackSummary | null }>(
      `/tracks/${trackId}/manage`,
      token,
    );

    return response.track;
  },

  async syncTrackMedia(token: string, trackId: string) {
    const response = await httpClient.post<{ track: TrackSummary }>(
      `/tracks/${trackId}/sync-media`,
      {},
      token,
    );

    return response.track;
  },

  async deleteTrack(token: string, trackId: string) {
    await httpClient.delete(`/tracks/${trackId}`, token);
  },

  async updateTrackAccess(token: string, trackId: string, access: TrackAccess) {
    const response = await httpClient.put<{ track: TrackSummary }>(
      `/tracks/${trackId}/access`,
      { access },
      token,
    );

    return response.track;
  },
};
