"use client"

import { Music, Shield, Coins, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Web3Auth from "@/components/web3-auth"
import { useAuth } from "@/hooks/use-auth"
import OnboardingModal from "@/components/onboarding-modal"

export default function AuthPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleConnect = async (address: string, email?: string) => {
    setIsConnected(true)
    setWalletAddress(address)

    // Try to login with existing user
    const user = await login(address)

    if (user) {
      // User exists, redirect to dashboard
      router.push("/dashboard")
    } else {
      // New user, show onboarding modal
      setShowOnboarding(true)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    setShowOnboarding(false)
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
            <Music className="h-12 w-12 text-purple-500" />
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Music City
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-3">Welcome to Music City</h1>
          <p className="text-gray-400 text-lg">Connect your wallet to start your journey in decentralized music</p>
        </div>

        {/* Web3Auth Connection */}
        <Web3Auth
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnected={isConnected}
          address={walletAddress}
        />

        {/* Features */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
            <Shield className="h-6 w-6 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-white">Secure & Transparent</div>
              <div className="text-xs text-gray-400">Blockchain-powered security</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
            <Coins className="h-6 w-6 text-yellow-500" />
            <div>
              <div className="text-sm font-medium text-white">Fair Royalties</div>
              <div className="text-xs text-gray-400">Direct payments to artists</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
            <Users className="h-6 w-6 text-green-500" />
            <div>
              <div className="text-sm font-medium text-white">Community Driven</div>
              <div className="text-xs text-gray-400">Connect with fans directly</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          New to Web3?{" "}
          <a
            href="https://web3auth.io/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            Learn more about Web3Auth
          </a>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          walletAddress={walletAddress}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
