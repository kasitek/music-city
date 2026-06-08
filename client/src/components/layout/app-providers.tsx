"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/features/auth/providers/auth-provider";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
};
