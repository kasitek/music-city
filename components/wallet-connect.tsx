"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface WalletConnectProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
  isConnected: boolean
  address?: string
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function WalletConnect({ onConnect, onDisconnect, isConnected, address }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMetaMask, setHasMetaMask] = useState(false)

  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && typeof window.ethereum !== "undefined")
  }, [])

  const connectWallet = async () => {
    if (!hasMetaMask) {
      setError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        onConnect(accounts[0])
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected by user")
      } else {
        setError("Failed to connect wallet")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    onDisconnect()
    setError(null)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-white">Wallet Connected</div>
                <div className="text-sm text-gray-400">{formatAddress(address)}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="border-gray-600 text-gray-300 bg-transparent"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Wallet className="h-5 w-5" />
          <span>Connect Wallet</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect your MetaMask wallet to access Music City features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasMetaMask && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-300">
              MetaMask not detected.
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                Install MetaMask
              </a>
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        <Button
          onClick={connectWallet}
          disabled={!hasMetaMask || isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Connect MetaMask"}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  )
}
