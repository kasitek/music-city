"use client"

import { Button } from "@/components/ui/button"
import { Music, Shield, Coins, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import WalletConnect from "@/components/wallet-connect"
import { useAuth } from "@/hooks/use-auth"

export default function AuthPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleConnect = async (address: string) => {
    setIsConnected(true)
    setWalletAddress(address)

    // Try to login with existing user
    const user = await login(address)

    if (user) {
      // User exists, redirect to dashboard
      router.push("/dashboard")
    } else {
      // New user, continue to onboarding
      // login() already set the wallet connection state
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
  }

  const handleContinue = () => {
    if (isConnected) {
      router.push("/onboarding")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <Music className="h-10 w-10 text-purple-500" />
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Music City
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome to Music City</h1>
          <p className="text-gray-400">Connect your wallet to start your journey in decentralized music</p>
        </div>

        {/* Wallet Connection */}
        <WalletConnect
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnected={isConnected}
          address={walletAddress}
        />

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-white">Secure & Transparent</div>
              <div className="text-xs text-gray-400">Blockchain-powered security</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-sm font-medium text-white">Fair Royalties</div>
              <div className="text-xs text-gray-400">Direct payments to artists</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <Users className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm font-medium text-white">Community Driven</div>
              <div className="text-xs text-gray-400">Connect with fans directly</div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {isConnected && (
          <Button onClick={handleContinue} className="w-full bg-purple-600 hover:bg-purple-700">
            Continue to Onboarding
          </Button>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          New to crypto wallets?{" "}
          <a
            href="https://metamask.io/faqs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            Learn more about MetaMask
          </a>
        </div>
      </div>
    </div>
  )
}
