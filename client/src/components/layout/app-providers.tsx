"use client";

import type { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWaasStellarConnectors } from "@dynamic-labs/stellar";

import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { clientEnv } from "@/lib/config/env";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {clientEnv.isDynamicConfigured ? (
        <DynamicContextProvider
          settings={{
            environmentId: clientEnv.dynamicEnvironmentId,
            walletConnectors: [DynamicWaasStellarConnectors],
            social: {
              strategy: "popup",
            },
          }}
        >
          <AuthProvider>{children}</AuthProvider>
        </DynamicContextProvider>
      ) : (
        <AuthProvider>{children}</AuthProvider>
      )}
    </ThemeProvider>
  );
};
