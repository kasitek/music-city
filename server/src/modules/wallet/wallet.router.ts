import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { walletService } from "./wallet.service.js";

const walletRouter = Router();

walletRouter.get(
  "/me",
  requireSession,
  asyncHandler(async (request, response) => {
    response.json({
      account: await walletService.getWalletAccount(request.session!.walletAddress),
    });
  }),
);

export { walletRouter };
