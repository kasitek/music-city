import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { entitlementsService } from "./entitlements.service.js";

const entitlementsRouter = Router();

entitlementsRouter.get(
  "/mine",
  requireSession,
  asyncHandler(async (request, response) => {
    response.json({
      items: entitlementsService.listMine(request.session!.walletAddress),
    });
  }),
);

entitlementsRouter.post(
  "/grant",
  requireSession,
  asyncHandler(async (request, response) => {
    response.status(201).json({
      entitlement: entitlementsService.grant(
        request.session!.walletAddress,
        request.body,
      ),
    });
  }),
);

export { entitlementsRouter };
