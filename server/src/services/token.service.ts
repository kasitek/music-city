import jwt from "jsonwebtoken";

import {
  adminSessionSchema,
  authSessionSchema,
  type AdminSession,
  type AuthSession,
} from "@music-city/shared";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export const tokenService = {
  issueSession(session: Omit<AuthSession, "token">) {
    return jwt.sign(session, env.JWT_SECRET, { expiresIn: "1d" });
  },

  verifySession(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return authSessionSchema.parse(decoded);
    } catch {
      throw new HttpError(401, "Invalid or expired session");
    }
  },

  issueAdminSession(session: Omit<AdminSession, "token">) {
    return jwt.sign(session, env.ADMIN_JWT_SECRET, { expiresIn: "12h" });
  },

  verifyAdminSession(token: string) {
    try {
      const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET);
      return adminSessionSchema.parse(decoded);
    } catch {
      throw new HttpError(401, "Invalid or expired admin session");
    }
  },

  issuePlaybackToken(payload: { playbackSessionId: string; trackId: string }) {
    return jwt.sign(payload, env.PLAYBACK_TOKEN_SECRET, { expiresIn: "5m" });
  },

  verifyPlaybackToken(token: string) {
    try {
      return jwt.verify(token, env.PLAYBACK_TOKEN_SECRET) as {
        playbackSessionId: string;
        trackId: string;
      };
    } catch {
      throw new HttpError(401, "Invalid or expired playback token");
    }
  },
};
