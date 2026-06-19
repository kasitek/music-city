"use client";

import { useEffect, type ReactNode } from "react";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import {
  DynamicContextProvider,
  DynamicMultiWalletPromptsWidget,
} from "@dynamic-labs/sdk-react-core";
import { DynamicWaasStellarConnectors } from "@dynamic-labs/stellar";

import { ThemeProvider } from "@/components/common/theme-provider";
import {
  AuthProvider,
  DYNAMIC_AUTH_CANCEL_EVENT,
  DYNAMIC_AUTH_FAILURE_EVENT,
  DYNAMIC_AUTH_SUCCESS_EVENT,
} from "@/features/auth/providers/auth-provider";
import { OnboardingGate } from "@/features/onboarding/components/onboarding-gate";
import { GlobalPlaybackProvider } from "@/features/playback/providers/global-playback-provider";
import { clientEnv } from "@/lib/config/env";

const dispatchDynamicEvent = (name: string) => {
  if (typeof window === "undefined") {
    return;
  }

  console.log("[dynamic][event]", name);
  window.dispatchEvent(new CustomEvent(name));
};

export const AppProviders = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    console.log("[dynamic][boot]", {
      environmentId: clientEnv.dynamicEnvironmentId,
      isConfigured: clientEnv.isDynamicConfigured,
      redirectUrl: clientEnv.appBaseUrl,
      socialStrategy: "redirect",
      href: window.location.href,
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {clientEnv.isDynamicConfigured ? (
        <DynamicContextProvider
          settings={{
            environmentId: clientEnv.dynamicEnvironmentId,
            redirectUrl: clientEnv.appBaseUrl,
            walletConnectors: [
              EthereumWalletConnectors,
              DynamicWaasStellarConnectors,
            ],
            social: {
              strategy: "redirect",
            },
            events: {
              onAuthSuccess: (args) => {
                console.log("[dynamic][event] onAuthSuccess", {
                  hasArgs: Boolean(args),
                });
                dispatchDynamicEvent(DYNAMIC_AUTH_SUCCESS_EVENT);
              },
              onAuthFailure: (args) => {
                console.log("[dynamic][event] onAuthFailure", args);
                dispatchDynamicEvent(DYNAMIC_AUTH_FAILURE_EVENT);
              },
              onAuthFlowCancel: () => {
                console.log("[dynamic][event] onAuthFlowCancel");
                dispatchDynamicEvent(DYNAMIC_AUTH_CANCEL_EVENT);
              },
            },
          }}
        >
          <AuthProvider>
            <GlobalPlaybackProvider>
              {children}
              <OnboardingGate />
            </GlobalPlaybackProvider>
          </AuthProvider>
          <DynamicMultiWalletPromptsWidget />
        </DynamicContextProvider>
      ) : (
        <AuthProvider>
          <GlobalPlaybackProvider>
            {children}
            <OnboardingGate />
          </GlobalPlaybackProvider>
        </AuthProvider>
      )}
    </ThemeProvider>
  );
};
