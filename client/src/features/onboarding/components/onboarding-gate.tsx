"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { OnboardingForm } from "./onboarding-form";

export const OnboardingGate = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const shouldShow = useMemo(() => {
    if (!session || session.profileComplete) {
      return false;
    }

    return pathname !== "/onboarding";
  }, [pathname, session]);

  const handleCompleted = useCallback(
    (role: "artist" | "fan") => {
      router.push(role === "artist" ? "/dashboard" : "/stream");
    },
    [router],
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
            Profile setup
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Finish setting up your account
          </h2>
          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            Add your profile details before continuing.
          </p>
        </div>

        <OnboardingForm mode="modal" onCompleted={handleCompleted} />

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => void logout()}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};
