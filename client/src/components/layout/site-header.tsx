"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, LayoutDashboard, Music2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navigationItems } from "@/lib/constants/navigation";
import { useAuth } from "@/hooks/use-auth";
import { freighterWallet } from "@/features/auth/lib/freighter-wallet";

export const SiteHeader = () => {
  const { session, connectWallet, isLoading, logout, error } = useAuth();
  const [walletAvailable, setWalletAvailable] = useState<boolean>(false);
  const [walletCheckComplete, setWalletCheckComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkWallet = async () => {
      console.log("[header] checking Freighter availability");
      try {
        const available = await freighterWallet.isAvailable();
        console.log("[header] Freighter availability resolved", { available });

        if (!cancelled) {
          setWalletAvailable(available);
          setWalletCheckComplete(true);
        }
      } catch (caughtError) {
        console.error("[header] Freighter availability failed", caughtError);

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
      !session &&
      walletCheckComplete &&
      (!walletAvailable ||
        error?.includes("Freighter extension was not detected") ||
        error?.includes("Freighter API is unavailable") ||
        error?.includes("Freighter access request timed out")),
    [error, session, walletAvailable, walletCheckComplete],
  );

  const handleWalletAction = () => {
    console.log("[header] wallet action", {
      showInstallAction,
      walletAvailable,
      walletCheckComplete,
      isLoading,
    });

    if (showInstallAction) {
      freighterWallet.openInstallPage();
      return;
    }

    void connectWallet();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
            <Music2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Music City</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline">
                {session.walletAddress.slice(0, 6)}...
                {session.walletAddress.slice(-4)}
              </span>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href={session.profileComplete ? "/dashboard" : "/onboarding"}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Workspace
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              onClick={handleWalletAction}
              disabled={isLoading || !walletCheckComplete}
            >
              {showInstallAction ? (
                <Download className="mr-2 h-4 w-4" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              {isLoading
                ? "Connecting"
                : !walletCheckComplete
                  ? "Checking Wallet"
                : showInstallAction
                  ? "Install Wallet"
                  : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
