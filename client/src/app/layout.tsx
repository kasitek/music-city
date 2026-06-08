import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { AppProviders } from "@/components/layout/app-providers";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music City",
  description: "Stellar-native music platform with a standalone backend.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          <div className="min-h-screen bg-slate-950 text-white">
            <SiteHeader />
            <main>{children}</main>
            <Toaster richColors position="top-right" />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
