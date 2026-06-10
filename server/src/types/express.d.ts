import type { AuthSession } from "@music-city/shared";

declare global {
  namespace Express {
    interface Request {
      session?: AuthSession;
      rawBody?: string;
    }
  }
}
