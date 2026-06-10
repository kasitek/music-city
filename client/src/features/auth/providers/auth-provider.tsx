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
const DYNAMIC_FAILED_SYNC_KEY = "music-city-dynamic-failed-sync-key";
const DYNAMIC_SYNC_RETRY_COUNT = 12;
const DYNAMIC_SYNC_RETRY_DELAY_MS = 250;

export const DYNAMIC_AUTH_SUCCESS_EVENT = "music-city:dynamic-auth-success";
export const DYNAMIC_AUTH_FAILURE_EVENT = "music-city:dynamic-auth-failure";
export const DYNAMIC_AUTH_CANCEL_EVENT = "music-city:dynamic-auth-cancel";

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

const readFailedSyncKey = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(DYNAMIC_FAILED_SYNC_KEY);
};

const persistFailedSyncKey = (syncKey: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!syncKey) {
    window.localStorage.removeItem(DYNAMIC_FAILED_SYNC_KEY);
    return;
  }

  window.localStorage.setItem(DYNAMIC_FAILED_SYNC_KEY, syncKey);
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isStellarAddress = (value?: string | null) =>
  typeof value === "string" && value.startsWith("G");

const summarizeCredential = (credential: unknown) => {
  if (!credential || typeof credential !== "object") {
    return credential;
  }

  const record = credential as Record<string, unknown>;

  return {
    chain:
      typeof record.chain === "string"
        ? record.chain
        : typeof record.network === "string"
          ? record.network
          : null,
    address:
      typeof record.address === "string"
        ? record.address
        : typeof record.public_identifier === "string"
          ? record.public_identifier
          : typeof record.publicIdentifier === "string"
            ? record.publicIdentifier
            : null,
    format: typeof record.format === "string" ? record.format : null,
    signInEnabled:
      typeof record.sign_in_enabled === "boolean"
        ? record.sign_in_enabled
        : typeof record.signInEnabled === "boolean"
          ? record.signInEnabled
          : null,
  };
};

const findStellarCredentialAddress = (
  user:
    | {
        verifiedCredentials?: Array<{
          address?: string | null;
          chain?: string | null;
        }>;
      }
    | null
    | undefined,
) =>
  user?.verifiedCredentials?.find(
    (credential) =>
      credential.chain?.toLowerCase().includes("stellar") && credential.address,
  )?.address;

const useBaseSessionState = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSyncedKeyRef = useRef<string | null>(null);
  const failedSyncKeyRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);

  useEffect(() => {
    setSession(readStoredSession());
    failedSyncKeyRef.current = readFailedSyncKey();
    setIsLoading(false);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
    persistSession(null);
    lastSyncedKeyRef.current = null;
    failedSyncKeyRef.current = null;
    syncInFlightRef.current = false;
    persistFailedSyncKey(null);
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
    failedSyncKeyRef,
    syncInFlightRef,
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
    userWithMissingInfo,
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
    failedSyncKeyRef,
    syncInFlightRef,
  } = useBaseSessionState();
  const userRef = useRef(user);
  const primaryWalletRef = useRef(primaryWallet);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    primaryWalletRef.current = primaryWallet;
  }, [primaryWallet]);

  useEffect(() => {
    console.log("[auth][dynamic] context state", {
      sdkHasLoaded,
      showAuthFlow,
      hasUser: Boolean(user),
      hasUserWithMissingInfo: Boolean(userWithMissingInfo),
      primaryWalletAddress: primaryWallet?.address ?? null,
      userEmail: user?.email ?? userWithMissingInfo?.email ?? null,
    });
  }, [
    primaryWallet?.address,
    sdkHasLoaded,
    showAuthFlow,
    user,
    userWithMissingInfo,
  ]);

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

  const waitForDynamicWalletAddress = useCallback(async () => {
    for (let attempt = 0; attempt < DYNAMIC_SYNC_RETRY_COUNT; attempt += 1) {
      const address = primaryWalletRef.current?.address;

      if (address) {
        console.log("[auth][dynamic] wallet ready", { attempt, address });
        return address;
      }

      console.log("[auth][dynamic] waiting for wallet", { attempt });
      await delay(DYNAMIC_SYNC_RETRY_DELAY_MS);
    }

    console.warn("[auth][dynamic] wallet not available after retries");
    return null;
  }, []);

  const resolveRequestedWalletAddress = useCallback(
    (address: string | null) => {
      if (isStellarAddress(address)) {
        return address;
      }

      return findStellarCredentialAddress(userRef.current) ?? undefined;
    },
    [],
  );

  const waitForDynamicToken = useCallback(async () => {
    for (let attempt = 0; attempt < DYNAMIC_SYNC_RETRY_COUNT; attempt += 1) {
      const token = getAuthToken();

      if (token) {
        console.log("[auth][dynamic] token ready", { attempt });
        return token;
      }

      console.log("[auth][dynamic] waiting for token", { attempt });
      await delay(DYNAMIC_SYNC_RETRY_DELAY_MS);
    }

    console.warn("[auth][dynamic] token not available after retries");
    return null;
  }, []);

  const syncDynamicSession = useCallback(async () => {
    if (!sdkHasLoaded) {
      console.log("[auth][dynamic] sync skipped: sdk not loaded");
      return;
    }

    if (syncInFlightRef.current) {
      console.log("[auth][dynamic] sync skipped: already in flight");
      return;
    }

    const currentUser = userRef.current;
    const stellarCredentialAddress = findStellarCredentialAddress(currentUser);

    if (!currentUser) {
      console.log("[auth][dynamic] sync skipped: no Dynamic user");
      setIsLoading(false);
      return;
    }

    console.log("[auth][dynamic] sync start", {
      userId: currentUser.userId,
      email: currentUser.email,
      hasPrimaryWallet: Boolean(primaryWalletRef.current?.address),
      stellarCredentialAddress: stellarCredentialAddress ?? null,
      hasSession: Boolean(session),
    });

    if (userWithMissingInfo && !stellarCredentialAddress) {
      const message =
        "Dynamic login is incomplete. No Stellar wallet credential is present in the verified token yet.";

      console.warn("[auth][dynamic] sync blocked", { message });
      setError(message);
      setIsLoading(false);
      return;
    }

    syncInFlightRef.current = true;
    const walletAddress = await waitForDynamicWalletAddress();

    if (!walletAddress) {
      setError(
        "Dynamic login succeeded, but no Stellar embedded wallet is available for this user.",
      );
      setIsLoading(false);
      syncInFlightRef.current = false;
      return;
    }

    const dynamicToken = await waitForDynamicToken();

    if (!dynamicToken) {
      setError("Dynamic login succeeded, but no Dynamic auth token is available yet.");
      setIsLoading(false);
      syncInFlightRef.current = false;
      return;
    }

    const decodedPayload = decodeJwtPayload(dynamicToken);
    const summarizedVerifiedCredentials = Array.isArray(
      decodedPayload?.verified_credentials,
    )
      ? decodedPayload.verified_credentials.map(summarizeCredential)
      : Array.isArray(decodedPayload?.verifiedCredentials)
        ? decodedPayload.verifiedCredentials.map(summarizeCredential)
        : null;

    console.log("[auth][dynamic] token claims", {
      scope:
        typeof decodedPayload?.scope === "string" ? decodedPayload.scope : null,
      environmentId:
        typeof decodedPayload?.environment_id === "string"
          ? decodedPayload.environment_id
          : typeof decodedPayload?.environmentId === "string"
            ? decodedPayload.environmentId
            : null,
      verifiedAccount:
        decodedPayload?.verified_account &&
        typeof decodedPayload.verified_account === "object"
          ? decodedPayload.verified_account
          : null,
      verifiedCredentials: summarizedVerifiedCredentials,
    });
    console.log(
      "[auth][dynamic] token credentials json",
      JSON.stringify(summarizedVerifiedCredentials, null, 2),
    );

    const syncKey = `${currentUser.userId ?? currentUser.email ?? "user"}:${walletAddress}`;
    const requestedWalletAddress = resolveRequestedWalletAddress(walletAddress);
    console.log("[auth][dynamic] sync prepared", {
      syncKey,
      requestedWalletAddress: requestedWalletAddress ?? null,
      currentSessionWallet: session?.walletAddress ?? null,
      lastSyncedKey: lastSyncedKeyRef.current,
    });

    if (
      lastSyncedKeyRef.current === syncKey &&
      session?.walletAddress === walletAddress
    ) {
      setIsLoading(false);
      return;
    }

    if (failedSyncKeyRef.current === syncKey) {
      console.warn("[auth][dynamic] sync skipped after prior terminal failure", {
        syncKey,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[auth][dynamic] creating backend session", {
        walletAddress,
        requestedWalletAddress: requestedWalletAddress ?? null,
      });
      const verifiedSession = await authApi.createDynamicSession(
        requestedWalletAddress ? { walletAddress: requestedWalletAddress } : {},
        dynamicToken,
      );

      console.log("[auth][dynamic] backend session created", {
        walletAddress: verifiedSession.walletAddress,
        profileComplete: verifiedSession.profileComplete,
      });
      setSession(verifiedSession);
      persistSession(verifiedSession);
      lastSyncedKeyRef.current = syncKey;
      failedSyncKeyRef.current = null;
      persistFailedSyncKey(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Social login session failed";

      console.error("[auth][dynamic] backend session failed", {
        message,
        error: caughtError,
      });
      if (
        message.includes("Requested Stellar wallet is not linked to this Dynamic user") ||
        message.includes("No Stellar wallet is linked to this account")
      ) {
        failedSyncKeyRef.current = syncKey;
        persistFailedSyncKey(syncKey);
      }
      setError(message);
      toast.error(message);
    } finally {
      syncInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [
    lastSyncedKeyRef,
    failedSyncKeyRef,
    sdkHasLoaded,
    session?.walletAddress,
    setError,
    setIsLoading,
    setSession,
    resolveRequestedWalletAddress,
    syncInFlightRef,
    waitForDynamicToken,
    waitForDynamicWalletAddress,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleAuthSuccess = () => {
      console.log("[auth][dynamic] auth success event received");
      setError(null);
      setIsLoading(true);
      void syncDynamicSession();
    };

    const handleAuthStop = () => {
      console.log("[auth][dynamic] auth flow stopped");
      setIsLoading(false);
    };

    window.addEventListener(DYNAMIC_AUTH_SUCCESS_EVENT, handleAuthSuccess);
    window.addEventListener(DYNAMIC_AUTH_FAILURE_EVENT, handleAuthStop);
    window.addEventListener(DYNAMIC_AUTH_CANCEL_EVENT, handleAuthStop);

    return () => {
      window.removeEventListener(DYNAMIC_AUTH_SUCCESS_EVENT, handleAuthSuccess);
      window.removeEventListener(DYNAMIC_AUTH_FAILURE_EVENT, handleAuthStop);
      window.removeEventListener(DYNAMIC_AUTH_CANCEL_EVENT, handleAuthStop);
    };
  }, [setError, setIsLoading, syncDynamicSession]);

  useEffect(() => {
    if (!sdkHasLoaded) {
      return;
    }

    if (user && primaryWallet?.address && !session) {
      console.log("[auth][dynamic] detected existing Dynamic auth state");
      setIsLoading(true);
      void syncDynamicSession();
      return;
    }

    if (!showAuthFlow) {
      setIsLoading(false);
    }
  }, [
    primaryWallet?.address,
    sdkHasLoaded,
    session,
    setIsLoading,
    showAuthFlow,
    syncDynamicSession,
    user,
  ]);

  useEffect(() => {
    if (!sdkHasLoaded || showAuthFlow || user) {
      return;
    }

    clearSession();
    setIsLoading(false);
  }, [clearSession, sdkHasLoaded, setIsLoading, showAuthFlow, user]);

  const connectWallet = useCallback(async () => {
    console.log("[auth][dynamic] opening auth flow");
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
