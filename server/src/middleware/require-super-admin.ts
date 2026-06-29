import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../utils/http-error.js";

export const requireSuperAdmin = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if (!request.adminSession) {
    next(new HttpError(401, "Admin authentication required"));
    return;
  }

  if (request.adminSession.role !== "super_admin") {
    next(new HttpError(403, "Super admin access required"));
    return;
  }

  next();
};
