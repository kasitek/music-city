import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { mediaService } from "./media.service.js";
const mediaRouter = Router();
mediaRouter.post("/webhooks/complete", asyncHandler(async (request, response) => {
    const secret = request.headers["x-media-webhook-secret"];
    if (!mediaService.verifyWebhook(typeof secret === "string" ? secret : secret?.[0])) {
        throw new HttpError(401, "Invalid media webhook secret");
    }
    response.json({
        track: mediaService.completeTrack({
            trackId: String(request.body.trackId),
            runtime: request.body.runtime,
            manifestUrl: request.body.manifestUrl,
            mediaUrl: request.body.mediaUrl,
        }),
    });
}));
export { mediaRouter };
