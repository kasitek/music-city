"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { AuthSession } from "@music-city/shared";

import { authApi } from "../lib/auth-api";
import { freighterWallet } from "../lib/freighter-wallet";
import { usersApi } from "@/features/users/lib/users-api";

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  refreshSessionProfile: () => Promise<void>;
  logout: () => void;
};

const AUTH_STORAGE_KEY = "music-city-auth-session";

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(readStoredSession());
    setIsLoading(false);
  }, []);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletAddress = await freighterWallet.connect();
      const challenge = await authApi.requestChallenge(walletAddress);
      const signedChallenge = await freighterWallet.signChallenge(
        challenge.transaction,
        walletAddress,
      );
      const verifiedSession = await authApi.verifyChallenge({
        transaction: signedChallenge,
      });

      setSession(verifiedSession);
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(verifiedSession),
      );
      toast.success("Wallet connected");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Wallet connection failed";

      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSessionProfile = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    const profile = await usersApi.getMe(session.token);

    if (!profile) {
      return;
    }

    const nextSession: AuthSession = {
      ...session,
      displayName: profile.displayName,
      role: profile.role,
      profileComplete: true,
    };

    setSession(nextSession);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  }, [session]);

  const logout = useCallback(() => {
    setSession(null);
    setError(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      error,
      connectWallet,
      refreshSessionProfile,
      logout,
    }),
    [connectWallet, error, isLoading, logout, refreshSessionProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
};
