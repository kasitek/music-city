import type { PlaybackSession } from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const playbackApi = {
  async createSession(token: string, trackId: string) {
    const response = await httpClient.post<{ playbackSession: PlaybackSession }>(
      "/playback/sessions",
      { trackId },
      token,
    );

    return response.playbackSession;
  },
};
