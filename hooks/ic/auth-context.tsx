"use client";
import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import {
  _SERVICE as BACKEND_SERVICE,
} from "../../src/declarations/music_city_backend/music_city_backend.did";


import { SessionData, useSessionData } from "./useSessionData";
import { WalletType } from "./types";
import { AuthClient } from "@dfinity/auth-client";
import { getAuthClient } from "./nfid";
import { host, network } from "../constants/urls";
import { backendCanisterId, backendIDL } from "../constants/canisters-config";
import { setIdentity as setBackendIdentity } from "@/lib/ic/backend";

interface AuthContextType {
  login: (walletType: WalletType) => Promise<void>;
  logout: () => void;
  identity: any;
  principalId: string | null;
  sessionData: SessionData | null;
  isAuthenticated: boolean;
  backendActor: ActorSubclass<BACKEND_SERVICE> | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  const [identity, setIdentity] = useState<any>(null);
  const { sessionData, updateSessionData, deleteSessionData, syncSessionData } =
    useSessionData();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [backendActor, setBackendActor] =
    useState<ActorSubclass<BACKEND_SERVICE> | null>(null);



  useEffect(() => {
    const session = localStorage.getItem("session-data")
    if (session) {
      const sessionData: SessionData = JSON.parse(session);
      switch (sessionData.connectedWalletType) {
        case WalletType.InternetIdentity:
          updateInternetIdentityClient();
          break;
        case WalletType.NFID:
          updateNFIDClient();
          break;
      }
    }
  }, []);

  const login = async (walletType: WalletType) => {
    const result = await getPrincipalAddress(walletType);
    if (!result) {
      throw new Error("Failed to get principal address.");
    }
    const { principalAddress } = result;
    updateSessionData({
      connected: true,
      isBackendAuthenticated: false,
      connectedWalletType: walletType,
      principalId: principalAddress,
      setTime: Date.now(),
    });
    updateClient(walletType);
  };

  const logout = () => {
    const session = localStorage.getItem("session-data");
    if (session) {
      const sessionData = JSON.parse(session);
      switch (sessionData.connectedWalletType) {
        case WalletType.InternetIdentity:
          logoutInternetIdentity();
          break;

        case WalletType.NFID:
          logoutNFID();
          break;
      }
    }

    deleteSessionData();
    // Unset backend actor identity used by lib/ic/backend
    try { setBackendIdentity(undefined) } catch {}
    setIsAuthenticated(false);
  };

  const logoutInternetIdentity = async () => {
    const authClient = await AuthClient.create();
    authClient.logout();
  };

  const logoutNFID = async () => {
    const authClient = await getAuthClient();
    authClient.logout();
  };

  const logoutSIWB = async () => {
    setIdentity(null);
    setPrincipalId(null);
    setIsAuthenticated(false);
    setBackendActor(null);
    deleteSessionData();
    try { setBackendIdentity(undefined) } catch {}
  };


  const autoLogin = () => {
    syncSessionData();
  };

  const updateClient = async (walletType: WalletType) => {
    switch (walletType) {
      case WalletType.InternetIdentity:
        await updateInternetIdentityClient();
        break;
      case WalletType.NFID:
        await updateNFIDClient();
        break;
    }
  };

  const updateInternetIdentityClient = async () => {
    try {
      const authClient = await AuthClient.create();
      setAuthClient(authClient);
      const isAuthenticated = await authClient.isAuthenticated();
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        const agent = await HttpAgent.create({
          identity,
          host: host,
        });
        if (network === "local") {
          agent.fetchRootKey().catch((err) => {
            console.log("Error fetching root key: ", err);
          });
        }
        setPrincipalId(identity.getPrincipal().toText());
        const _backendActor = Actor.createActor<BACKEND_SERVICE>(backendIDL, {
          agent,
          canisterId: backendCanisterId,
        });
        setBackendActor(_backendActor);
        setIdentity(identity);
        // Also set identity for lib/ic/backend actor factory
        try { setBackendIdentity(identity as any) } catch {}
        setIsAuthenticated(isAuthenticated);
        syncSessionData();
      }
    } catch (error) {
      console.log("Error in updateInternetIdentityClient: ", error);
    }
  };

  const updateNFIDClient = async () => {
    const authClient = await getAuthClient();
    const isAuthenticated = await authClient.isAuthenticated();
    setIsAuthenticated(isAuthenticated);
    if (isAuthenticated) {
      const identity = authClient.getIdentity();
      setPrincipalId(identity.getPrincipal().toText());
      setIdentity(identity);
      const agent = await HttpAgent.create({
        identity,
        host: host,
      });
      if (network === "local") {
        agent.fetchRootKey().catch((err) => {
          console.log("Error fetching root key: ", err);
        });
      }
      const _backendActor = Actor.createActor<BACKEND_SERVICE>(backendIDL, {
        agent,
        canisterId: backendCanisterId,
      });
      setBackendActor(_backendActor);
      // Also set identity for lib/ic/backend actor factory
      try { setBackendIdentity(identity as any) } catch {}
      syncSessionData();
    }
  };

  const getPrincipalAddress = async (walletType: WalletType) => {
    switch (walletType) {
      case WalletType.InternetIdentity:
        return getInternetIdentityPrincipalAddress();
      case WalletType.NFID:
        return getNFIDPrincipalAddress();
    }
  };

  const getInternetIdentityPrincipalAddress = async () => {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const principalAddress = identity.getPrincipal().toText();
    return { principalAddress };
  };

  const getNFIDPrincipalAddress = async () => {
    const authClient = await getAuthClient();
    const identity = authClient.getIdentity();
    const principalAddress = identity.getPrincipal().toText();
    return { principalAddress };
  };

  const value: AuthContextType = {
    login,
    logout,
    identity,
    principalId,
    sessionData,
    isAuthenticated,
    backendActor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
