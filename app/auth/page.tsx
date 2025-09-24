"use client"

import { Music, Shield, Coins, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Web3Auth from "@/components/web3-auth"
import OnboardingModal from "@/components/onboarding-modal"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/hooks/ic/auth-context"
import WalletConnectionModal from "@/components/wallet-connection-modal"

export default function AuthPage() {
  const {isAuthenticated, login, logout, backendActor} = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileExists, setProfileExists] = useState(false)
  const closeWalletModal = () => setIsWalletModalOpen(false)
  const router = useRouter()

  useEffect(() => {
    const go = async () => {
      if (isAuthenticated && backendActor) {
        setLoading(true)
        try {
          const icUser = await backendActor.getMyUser()
          if (icUser && icUser.length > 0) {
            setProfileExists(true)
            const user = icUser[0]
            const isArtist = user?.userType && 'artist' in user.userType
            if (isArtist) {
              router.push("/dashboard")
            } else {
              router.push("/stream")
            }
          } else {
            setProfileExists(false)
            setShowOnboarding(true)
          }
        } catch (error) {
          setProfileExists(false)
          setShowOnboarding(true)
        } finally {
          setLoading(false)
        }
      }
    }
    go()
  }, [isAuthenticated, backendActor, router])

  const handleConnect = async (address: string, email?: string, name?: string) => {
    setIsConnected(true)
    setWalletAddress(address)

    // // Try to login with existing user
    // const user = await login(address, email, name)

    // if (user) {
    //   // User exists, redirect to dashboard
    //   router.push("/dashboard")
    // } else {
    //   // New user, show onboarding modal
    //   setShowOnboarding(true)
    // }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    setShowOnboarding(false)
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
  }

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false)
    try {
      if (backendActor) {
        const icUser = await backendActor.getMyUser()
        console.log("Onboarding complete, user profile:", icUser)
        
        if (icUser && icUser.length > 0) {
          const user = icUser[0]
          const isArtist = user?.userType && 'artist' in user.userType
          console.log("Redirecting user, isArtist:", isArtist)
          
          if (isArtist) {
            router.push("/dashboard")
          } else {
            router.push("/stream")
          }
        } else {
          // Fallback to stream page
          router.push("/stream")
        }
      } else {
        // Fallback if no backend actor
        router.push("/stream")
      }
    } catch (error) {
      console.error("Error after onboarding completion:", error)
      // Fallback to stream page
      router.push("/stream")
    }
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
          <p className="text-gray-400 text-lg">Connect your wallet or sign in with Internet Identity/NFID</p>
        </div>

        {loading && <div className="text-center text-purple-400">Checking your profile...</div>}
        {!loading && !isAuthenticated && <button
          onClick={() => setIsWalletModalOpen(true)}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded">
          Login
        </button>}
        {!loading && isAuthenticated && profileExists && (
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Go to Dashboard
          </button>
        )}
        {!loading && isAuthenticated && (
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        )}
        <WalletConnectionModal
          isOpen={isWalletModalOpen}
          onClose={closeWalletModal}
        />
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
      {showOnboarding && !profileExists && (
        <OnboardingModal
          walletAddress={walletAddress}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
