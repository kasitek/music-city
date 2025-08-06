"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { 
  initWeb3Auth, 
  connectWallet as web3authConnect, 
  disconnectWallet as web3authDisconnect, 
  getUserInfo, 
  getAccounts,
} from "@/lib/web3auth"

interface Web3AuthProps {
  onConnect: (address: string, email?: string, name?: string) => void
  onDisconnect: () => void
  isConnected: boolean
  address?: string
}

export default function Web3Auth({ onConnect, onDisconnect, isConnected, address }: Web3AuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeWeb3Auth = async () => {
      try {
        setIsInitializing(true)
        await initWeb3Auth()
        setIsInitialized(true)
      } catch (err) {
        console.error("Failed to initialize Web3Auth:", err)
        setError("Failed to initialize Web3Auth")
      } finally {
        setIsInitializing(false)
      }
    }

    initializeWeb3Auth()
  }, [])

  const connectWallet = async () => {
    if (!isInitialized) {
      setError("Web3Auth is not initialized")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = await web3authConnect()
      if (provider) {
        // Get user info and wallet address
        const [userInfo, accounts] = await Promise.all([
          getUserInfo(),
          getAccounts(provider)
        ])
        
        const walletAddress = accounts[0]
        onConnect(walletAddress, userInfo.email, userInfo.name)
      }
    } catch (err: any) {
      console.error("Failed to connect:", err)
      setError("Failed to connect. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    setIsLoading(true)
    try {
      await web3authDisconnect()
      onDisconnect()
      setError(null)
    } catch (err) {
      console.error("Failed to disconnect:", err)
      setError("Failed to disconnect")
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isInitializing) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-300">Initializing Web3Auth...</p>
        </CardContent>
      </Card>
    )
  }

  if (isConnected && address) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-white text-lg">Connected Successfully</div>
                <div className="text-sm text-gray-400">{formatAddress(address)}</div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={disconnectWallet}
              disabled={isLoading}
              className="border-gray-600 text-gray-300 bg-transparent hover:bg-gray-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-white text-2xl">
          <Wallet className="h-6 w-6" />
          <span>Connect Your Wallet</span>
        </CardTitle>
        <CardDescription className="text-gray-400 text-lg">
          Sign in with your preferred method to access Music City
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center space-x-2 p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={connectWallet}
            disabled={!isInitialized || isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-lg py-6"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Sign In with Web3Auth</span>
              </div>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">Supports Google, Facebook, Twitter, Discord, and more</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center leading-relaxed">
          By connecting, you agree to our{" "}
          <a href="#" className="text-purple-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-purple-400 hover:underline">
            Privacy Policy
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
