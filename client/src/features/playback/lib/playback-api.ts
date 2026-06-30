import type { PlaybackSession } from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";
import { clientEnv } from "@/lib/config/env";

const resolveStreamUrl = (streamUrl: string) => {
  if (/^https?:\/\//i.test(streamUrl)) {
    return streamUrl;
  }

  return new URL(streamUrl, new URL(clientEnv.apiBaseUrl).origin).toString();
};

export const playbackApi = {
  async createSession(token: string, trackId: string) {
    const response = await httpClient.post<{ playbackSession: PlaybackSession }>(
      "/playback/sessions",
      { trackId },
      token,
    );

    return {
      ...response.playbackSession,
      streamUrl: resolveStreamUrl(response.playbackSession.streamUrl),
    };
  },
};
