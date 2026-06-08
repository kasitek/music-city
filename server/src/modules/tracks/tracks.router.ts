import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { tracksService } from "./tracks.service.js";

const tracksRouter = Router();

tracksRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({ items: tracksService.listTracks() });
  }),
);

tracksRouter.get(
  "/:trackId",
  asyncHandler(async (request, response) => {
    response.json({ track: tracksService.getTrack(String(request.params.trackId)) });
  }),
);

tracksRouter.get(
  "/mine",
  requireSession,
  asyncHandler(async (request, response) => {
    response.json({
      items: tracksService.listMyTracks(request.session!.walletAddress),
    });
  }),
);

tracksRouter.post(
  "/",
  requireSession,
  asyncHandler(async (request, response) => {
    try {
      const track = tracksService.createTrack(
        request.session!.walletAddress,
        request.body,
      );

      response.status(201).json({ track });
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : "Track creation failed",
      );
    }
  }),
);

export { tracksRouter };
