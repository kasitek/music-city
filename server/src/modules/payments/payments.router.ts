import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { paymentsService } from "./payments.service.js";

const paymentsRouter = Router();

paymentsRouter.get(
  "/mine",
  requireSession,
  asyncHandler(async (request, response) => {
    response.json({
      items: await paymentsService.listMine(request.session!.walletAddress),
    });
  }),
);

paymentsRouter.post(
  "/intents/track/:trackId",
  requireSession,
  asyncHandler(async (request, response) => {
    response.status(201).json({
      intent: await paymentsService.createTrackPurchaseIntent(
        request.session!.walletAddress,
        String(request.params.trackId),
      ),
    });
  }),
);

paymentsRouter.post(
  "/intents/subscription/:artistId",
  requireSession,
  asyncHandler(async (request, response) => {
    response.status(201).json({
      intent: await paymentsService.createArtistSubscriptionIntent(
        request.session!.walletAddress,
        String(request.params.artistId),
      ),
    });
  }),
);

paymentsRouter.post(
  "/confirm",
  requireSession,
  asyncHandler(async (request, response) => {
    response.json(
      await paymentsService.confirm(
        request.session!.walletAddress,
        request.body,
      ),
    );
  }),
);

export { paymentsRouter };
