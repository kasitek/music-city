"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAuthToken, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { toast } from "sonner";

import type { AuthSession } from "@music-city/shared";

import { usersApi } from "@/features/users/lib/users-api";
import { clientEnv } from "@/lib/config/env";
import { authApi } from "../lib/auth-api";

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  refreshSessionProfile: () => Promise<void>;
  logout: () => Promise<void>;
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

const persistSession = (session: AuthSession | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

const useBaseSessionState = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSyncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setSession(readStoredSession());
    setIsLoading(false);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
    persistSession(null);
    lastSyncedKeyRef.current = null;
  }, []);

  return {
    session,
    setSession,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearSession,
    lastSyncedKeyRef,
  };
};

const FallbackAuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    session,
    setSession,
    isLoading,
    error,
    setError,
    clearSession,
  } = useBaseSessionState();

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
    persistSession(nextSession);
  }, [session, setSession]);

  const connectWallet = useCallback(async () => {
    const message =
      "Dynamic is not configured. Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID first.";

    setError(message);
    toast.error(message);
  }, [setError]);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

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

const DynamicAuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    sdkHasLoaded,
    user,
    primaryWallet,
    showAuthFlow,
    setShowAuthFlow,
    handleLogOut,
  } = useDynamicContext();
  const {
    session,
    setSession,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearSession,
    lastSyncedKeyRef,
  } = useBaseSessionState();

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
    persistSession(nextSession);
  }, [session, setSession]);

  const syncDynamicSession = useCallback(async () => {
    if (!sdkHasLoaded) {
      return;
    }

    if (!user || !primaryWallet?.address) {
      clearSession();
      return;
    }

    const dynamicToken = getAuthToken();

    if (!dynamicToken) {
      setError("Dynamic auth token is not available yet");
      setIsLoading(false);
      return;
    }

    const syncKey = `${user.userId ?? user.email ?? "user"}:${primaryWallet.address}`;

    if (
      lastSyncedKeyRef.current === syncKey &&
      session?.walletAddress === primaryWallet.address
    ) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const verifiedSession = await authApi.createDynamicSession(
        { walletAddress: primaryWallet.address },
        dynamicToken,
      );

      setSession(verifiedSession);
      persistSession(verifiedSession);
      lastSyncedKeyRef.current = syncKey;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Social login session failed";

      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    clearSession,
    lastSyncedKeyRef,
    primaryWallet?.address,
    sdkHasLoaded,
    session?.walletAddress,
    setError,
    setIsLoading,
    setSession,
    user,
  ]);

  useEffect(() => {
    void syncDynamicSession();
  }, [syncDynamicSession]);

  useEffect(() => {
    if (!isLoading || showAuthFlow) {
      return;
    }

    if (session) {
      setIsLoading(false);
      return;
    }

    if (sdkHasLoaded && user && !primaryWallet?.address) {
      setError(
        "Login completed, but no Stellar wallet was provisioned for this Dynamic environment.",
      );
      setIsLoading(false);
      return;
    }

    if (sdkHasLoaded && !user) {
      setIsLoading(false);
    }
  }, [
    isLoading,
    primaryWallet?.address,
    sdkHasLoaded,
    session,
    setError,
    setIsLoading,
    showAuthFlow,
    user,
  ]);

  const connectWallet = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setShowAuthFlow(true);
  }, [setError, setIsLoading, setShowAuthFlow]);

  const logout = useCallback(async () => {
    clearSession();
    await handleLogOut();
  }, [clearSession, handleLogOut]);

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (!clientEnv.isDynamicConfigured) {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  return <DynamicAuthProvider>{children}</DynamicAuthProvider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
};
