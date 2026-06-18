import { createPlaybackSessionSchema } from "@music-city/shared";
import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { entitlementsService } from "../entitlements/entitlements.service.js";
import { tracksService } from "../tracks/tracks.service.js";
import { playbackService } from "./playback.service.js";

const playbackRouter = Router();

playbackRouter.post(
  "/sessions",
  requireSession,
  asyncHandler(async (request, response) => {
    const input = createPlaybackSessionSchema.parse(request.body);
    console.log("[server][playback] create session request", {
      trackId: input.trackId,
      walletAddress: request.session?.walletAddress,
    });
    const track = await tracksService.getTrackForPlayback(input.trackId);

    if (!track) {
      console.log("[server][playback] track not found for playback", {
        trackId: input.trackId,
      });
      throw new HttpError(404, "Track not found");
    }

    const canPlay = await entitlementsService.canPlayTrack(
      request.session!.walletAddress,
      input.trackId,
    );

    console.log("[server][playback] entitlement result", {
      trackId: input.trackId,
      walletAddress: request.session?.walletAddress,
      canPlay,
      access: track.access,
      artistId: track.artistId,
    });

    if (!canPlay) {
      throw new HttpError(403, "You do not have access to this track");
    }

    const playbackSession = await playbackService.createSession(input.trackId);
    console.log("[server][playback] session created", {
      trackId: input.trackId,
      sessionId: playbackSession.id,
      provider: playbackSession.provider,
    });

    response.status(201).json({
      playbackSession,
    });
  }),
);

playbackRouter.get(
  "/sessions/:sessionId/manifest.m3u8",
  asyncHandler(async (request, response) => {
    const token = String(request.query.token ?? "");
    const manifest = await playbackService.getManifest(
      String(request.params.sessionId),
      token,
    );

    response.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    response.send(manifest);
  }),
);

playbackRouter.get(
  "/sessions/:sessionId/media",
  asyncHandler(async (request, response) => {
    const token = String(request.query.token ?? "");
    const url = await playbackService.getMediaRedirect(
      String(request.params.sessionId),
      token,
    );

    response.redirect(url);
  }),
);

export { playbackRouter };
