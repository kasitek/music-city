"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Shield, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { freighterWallet } from "../lib/freighter-wallet";

export const AuthPanel = () => {
  const router = useRouter();
  const { connectWallet, error, isLoading, session } = useAuth();
  const [walletAvailable, setWalletAvailable] = useState<boolean>(false);
  const [walletCheckComplete, setWalletCheckComplete] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    router.push(session.profileComplete ? "/dashboard" : "/onboarding");
  }, [router, session]);

  useEffect(() => {
    let cancelled = false;

    const checkWallet = async () => {
      console.log("[auth][panel] checking Freighter availability");
      try {
        const available = await freighterWallet.isAvailable();
        console.log("[auth][panel] Freighter availability resolved", { available });

        if (!cancelled) {
          setWalletAvailable(available);
          setWalletCheckComplete(true);
        }
      } catch (caughtError) {
        console.error("[auth][panel] Freighter availability failed", caughtError);

        if (!cancelled) {
          setWalletAvailable(false);
          setWalletCheckComplete(true);
        }
      }
    };

    void checkWallet();

    return () => {
      cancelled = true;
    };
  }, []);

  const showInstallAction = useMemo(
    () =>
      walletCheckComplete &&
      (!walletAvailable ||
        error?.includes("Freighter extension was not detected") ||
        error?.includes("Freighter API is unavailable") ||
        error?.includes("Freighter access request timed out")),
    [error, walletAvailable, walletCheckComplete],
  );

  console.log("[auth][panel] render state", {
    walletAvailable,
    walletCheckComplete,
    hasError: Boolean(error),
    error,
    showInstallAction,
    isLoading,
    hasSession: Boolean(session),
  });

  const handlePrimaryAction = () => {
    console.log("[auth][panel] primary action", {
      showInstallAction,
      isLoading,
    });

    if (showInstallAction) {
      console.log("[auth][panel] redirecting to Freighter download");
      freighterWallet.openInstallPage();
      return;
    }

    void connectWallet();
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-none">
      <CardHeader className="space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Wallet className="h-5 w-5" />
        </span>
        <CardTitle className="text-2xl">Stellar wallet authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm leading-7 text-slate-300">
          The new auth path is server-backed. The wallet provides identity
          proof, then the Node server issues the session used by the rest of the
          product.
        </p>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
          <div className="mb-2 flex items-center gap-2 text-emerald-300">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Current status</span>
          </div>
          {session ? (
            <p>
              Connected as {session.walletAddress}. Redirecting to your
              workspace.
            </p>
          ) : showInstallAction ? (
            <p>
              Freighter is not installed in this browser. Install it first,
              then refresh this page and connect your Stellar wallet.
            </p>
          ) : !walletCheckComplete ? (
            <p>Checking for Freighter wallet...</p>
          ) : (
            <p>No session yet. Connect a wallet to start the SEP-10 flow.</p>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <Button
          className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          onClick={handlePrimaryAction}
          disabled={isLoading || !walletCheckComplete}
        >
          {isLoading
            ? "Connecting..."
            : !walletCheckComplete
              ? "Checking wallet..."
            : showInstallAction
              ? "Install Wallet"
              : "Connect Freighter"}
        </Button>

        {showInstallAction ? (
          <Button
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => freighterWallet.openInstallPage()}
          >
            <Download className="h-4 w-4" />
            Download Wallet
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};
