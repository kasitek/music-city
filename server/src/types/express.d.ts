import type { AdminSession, AuthSession } from "@music-city/shared";

declare global {
  namespace Express {
    interface Request {
      session?: AuthSession;
      adminSession?: AdminSession;
      rawBody?: string;
    }
  }
}
