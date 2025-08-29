import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { WalletType } from "./types";

export interface SessionData {
  connected: boolean;
  connectedWalletType: WalletType;
  principalId?: string;
  aid?: string;
  isBackendAuthenticated?: boolean;
  chainAddress?: string;
  updatedAt?: number;
  setTime: number;
}

export const useSessionData = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const { getItem, setItem, removeItem } = useLocalStorage();

  const updateSessionData = (sessionData: SessionData) => {
    setSessionData(sessionData);
    setItem("session-data", JSON.stringify(sessionData));
  };

  const deleteSessionData = () => {
    setSessionData(null);
    removeItem("session-data");
  };

  const syncSessionData = () => {
    const sessionData = getItem("session-data");
    if (sessionData) setSessionData(JSON.parse(sessionData));
  };

  return { sessionData, updateSessionData, deleteSessionData, syncSessionData };
};
