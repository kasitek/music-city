import type { AuthSession } from "@music-city/shared";

export interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}
