import type { PlaybackSession } from "@music-city/shared";

import { createId } from "../../services/id.service.js";
import { tokenService } from "../../services/token.service.js";
import { storageService } from "../../services/storage.service.js";
import { HttpError } from "../../utils/http-error.js";
import { playbackRepository } from "./playback.repository.js";
import { tracksService } from "../tracks/tracks.service.js";

const expiresInMinutes = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000).toISOString();

export const playbackService = {
  createSession(trackId: string) {
    const id = createId("ply");
    const token = tokenService.issuePlaybackToken({ playbackSessionId: id, trackId });
    const session = {
      id,
      trackId,
      token,
      playbackUrl: `/api/v1/playback/sessions/${id}/manifest.m3u8?token=${encodeURIComponent(token)}`,
      mediaUrl: `/api/v1/playback/sessions/${id}/media?token=${encodeURIComponent(token)}`,
      expiresAt: expiresInMinutes(5),
    } satisfies PlaybackSession;

    return playbackRepository.upsert(session);
  },

  getSession(id: string, token: string) {
    const session = playbackRepository.findById(id);

    if (!session) {
      throw new HttpError(404, "Playback session not found");
    }

    const claims = tokenService.verifyPlaybackToken(token);

    if (claims.playbackSessionId !== id || claims.trackId !== session.trackId) {
      throw new HttpError(401, "Playback token does not match the session");
    }

    if (Date.parse(session.expiresAt) < Date.now()) {
      throw new HttpError(401, "Playback session expired");
    }

    return session;
  },

  getManifest(sessionId: string, token: string) {
    const session = this.getSession(sessionId, token);
    const track = tracksService.getTrack(session.trackId);

    if (!track?.playbackReady) {
      throw new HttpError(404, "Track media is not available");
    }

    const baseUrl =
      track.streamMediaUrl ??
      (track.masterStorageKey ? storageService.getDownloadUrl(track.masterStorageKey) : undefined);

    if (!baseUrl) {
      throw new HttpError(404, "Track playback URL is not available");
    }

    const segmentUrl = `${baseUrl}${
      baseUrl.includes("?") ? "&" : "?"
    }playbackSession=${encodeURIComponent(session.id)}`;

    return [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-TARGETDURATION:30",
      "#EXT-X-MEDIA-SEQUENCE:0",
      "#EXTINF:30.0,",
      segmentUrl,
      "#EXT-X-ENDLIST",
      "",
    ].join("\n");
  },

  getMediaRedirect(sessionId: string, token: string) {
    const session = this.getSession(sessionId, token);
    const track = tracksService.getTrack(session.trackId);

    if (!track?.playbackReady) {
      throw new HttpError(404, "Track media is not available");
    }

    if (track.streamMediaUrl) {
      return track.streamMediaUrl;
    }

    if (!track.masterStorageKey) {
      throw new HttpError(404, "Track media is not available");
    }

    return storageService.getDownloadUrl(track.masterStorageKey);
  },
};
