import type { NextFunction, Request, Response } from "express";

import { tokenService } from "../services/token.service.js";
import { HttpError } from "../utils/http-error.js";

const readBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export const requireAdminSession = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const token = readBearerToken(request.headers.authorization);

  if (!token) {
    next(new HttpError(401, "Admin authentication required"));
    return;
  }

  request.adminSession = tokenService.verifyAdminSession(token);
  next();
};
