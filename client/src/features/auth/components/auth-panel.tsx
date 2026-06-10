"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { clientEnv } from "@/lib/config/env";

export const AuthPanel = () => {
  const router = useRouter();
  const { connectWallet, error, isLoading, session } = useAuth();
  const dynamicConfigured = clientEnv.isDynamicConfigured;

  useEffect(() => {
    if (!session) {
      return;
    }

    router.push(session.profileComplete ? "/dashboard" : "/onboarding");
  }, [router, session]);

  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-none">
      <CardHeader className="space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Sparkles className="h-5 w-5" />
        </span>
        <CardTitle className="text-2xl">Social login with an embedded Stellar wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm leading-7 text-slate-300">
          Users log in with social or email first. Dynamic provisions the
          embedded Stellar wallet, and the backend still owns the application
          session.
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
          ) : dynamicConfigured ? (
            <p>Ready. Continue with Google, email, or another enabled social provider.</p>
          ) : (
            <p>
              Dynamic is not configured yet. Set `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`
              before using social login.
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <Button
          className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          onClick={() => void connectWallet()}
          disabled={isLoading || !dynamicConfigured}
        >
          {isLoading ? "Opening login..." : "Login"}
        </Button>
      </CardContent>
    </Card>
  );
};
