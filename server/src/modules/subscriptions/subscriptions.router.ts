import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { subscriptionsService } from "./subscriptions.service.js";

const subscriptionsRouter = Router();

subscriptionsRouter.get(
  "/platform-plan",
  asyncHandler(async (_request, response) => {
    response.json({
      plan: await subscriptionsService.getPlatformPlan(),
    });
  }),
);

subscriptionsRouter.get(
  "/mine",
  requireSession,
  asyncHandler(async (request, response) => {
    response.json({
      items: await subscriptionsService.listMine(
        request.session!.walletAddress,
      ),
    });
  }),
);

export { subscriptionsRouter };
