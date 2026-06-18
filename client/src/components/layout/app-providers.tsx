"use client";

import type { ReactNode } from "react";
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
import { clientEnv } from "@/lib/config/env";

const dispatchDynamicEvent = (name: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(name));
};

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {clientEnv.isDynamicConfigured ? (
        <DynamicContextProvider
          settings={{
            environmentId: clientEnv.dynamicEnvironmentId,
            walletConnectors: [
              EthereumWalletConnectors,
              DynamicWaasStellarConnectors,
            ],
            social: {
              strategy: "popup",
            },
            events: {
              onAuthSuccess: () => {
                dispatchDynamicEvent(DYNAMIC_AUTH_SUCCESS_EVENT);
              },
              onAuthFailure: () => {
                dispatchDynamicEvent(DYNAMIC_AUTH_FAILURE_EVENT);
              },
              onAuthFlowCancel: () => {
                dispatchDynamicEvent(DYNAMIC_AUTH_CANCEL_EVENT);
              },
            },
          }}
        >
          <AuthProvider>
            {children}
            <OnboardingGate />
          </AuthProvider>
          <DynamicMultiWalletPromptsWidget />
        </DynamicContextProvider>
      ) : (
        <AuthProvider>
          {children}
          <OnboardingGate />
        </AuthProvider>
      )}
    </ThemeProvider>
  );
};
