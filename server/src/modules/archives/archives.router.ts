import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { tracksService } from "../tracks/tracks.service.js";
import { archivesService } from "./archives.service.js";

const archivesRouter = Router();

archivesRouter.post(
  "/tracks/:trackId",
  requireSession,
  asyncHandler(async (request, response) => {
    const trackId = String(request.params.trackId);

    if (!tracksService.userOwnsTrack(request.session!.walletAddress, trackId)) {
      throw new HttpError(404, "Track not found");
    }

    response.status(201).json({
      archive: await archivesService.createArchive(trackId),
    });
  }),
);

export { archivesRouter };
