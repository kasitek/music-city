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
    const track = tracksService.getTrack(input.trackId);

    if (!track) {
      throw new HttpError(404, "Track not found");
    }

    if (
      !(await entitlementsService.canPlayTrack(
        request.session!.walletAddress,
        input.trackId,
      ))
    ) {
      throw new HttpError(403, "You do not have access to this track");
    }

    response.status(201).json({
      playbackSession: playbackService.createSession(input.trackId),
    });
  }),
);

playbackRouter.get(
  "/sessions/:sessionId/manifest.m3u8",
  asyncHandler(async (request, response) => {
    const token = String(request.query.token ?? "");
    const manifest = playbackService.getManifest(
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
    const url = playbackService.getMediaRedirect(
      String(request.params.sessionId),
      token,
    );

    response.redirect(url);
  }),
);

export { playbackRouter };
