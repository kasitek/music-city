import type { PlaybackSession } from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

export const playbackApi = {
  async createSession(token: string, trackId: string) {
    console.log("[playback-api] createSession:start", {
      trackId,
      hasToken: Boolean(token),
    });

    const response = await httpClient.post<{ playbackSession: PlaybackSession }>(
      "/playback/sessions",
      { trackId },
      token,
    );

    console.log("[playback-api] createSession:success", {
      trackId,
      provider: response.playbackSession.provider,
      streamUrl: response.playbackSession.streamUrl,
    });

    return response.playbackSession;
  },
};
