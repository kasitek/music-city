import { Router } from "express";

import { requireSession } from "../../middleware/require-session.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { usersService } from "./users.service.js";

const usersRouter = Router();

usersRouter.get(
  "/me",
  requireSession,
  asyncHandler(async (request, response) => {
    const profile = usersService.getProfile(request.session!.walletAddress);

    response.json({ profile });
  }),
);

usersRouter.put(
  "/me",
  requireSession,
  asyncHandler(async (request, response) => {
    const profile = usersService.upsertProfile(
      request.session!.walletAddress,
      request.body,
    );

    response.json({ profile });
  }),
);

usersRouter.get(
  "/artists",
  asyncHandler(async (_request, response) => {
    response.json({ items: usersService.listArtists() });
  }),
);

export { usersRouter };
