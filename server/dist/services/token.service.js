import jwt from "jsonwebtoken";
import { authSessionSchema } from "@music-city/shared";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
export const tokenService = {
    issueSession(session) {
        return jwt.sign(session, env.JWT_SECRET, { expiresIn: "1d" });
    },
    verifySession(token) {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            return authSessionSchema.parse(decoded);
        }
        catch {
            throw new HttpError(401, "Invalid or expired session");
        }
    },
    issuePlaybackToken(payload) {
        return jwt.sign(payload, env.PLAYBACK_TOKEN_SECRET, { expiresIn: "5m" });
    },
    verifyPlaybackToken(token) {
        try {
            return jwt.verify(token, env.PLAYBACK_TOKEN_SECRET);
        }
        catch {
            throw new HttpError(401, "Invalid or expired playback token");
        }
    },
};
