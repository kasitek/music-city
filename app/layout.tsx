import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Web3Providers } from "@/hooks/ic/web3Provider"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Music City - Decentralized Music Platform for the World",
  description: "A blockchain-powered music streaming platform that ensures artists receive fair royalties directly",
  generator: "Gerald.dev",
  icons: { icon: "/favicon.png" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <Web3Providers>
            {children}
            <Toaster richColors position="top-right" />
          </Web3Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
