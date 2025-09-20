"use client"

import { useState, useEffect } from "react"
import { X, Wallet, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

import { useAuth } from "@/hooks/ic/auth-context"
import { WalletType } from "@/hooks/ic/types"
import { connectInternetIdentityWallet } from "@/hooks/ic/internetidentity"
import { connectNFIDWallet } from "@/hooks/ic/nfid"
import { Alert, AlertDescription } from "./ui/alert"


interface WalletConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletConnectionModal({ isOpen, onClose }: WalletConnectionModalProps) {
  const { login } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletConnectCallback = (success: boolean, walletType: WalletType) => {
    if (success) {
      login(walletType)
      onClose()
    }
  }

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    if (walletId === 'internet-identity') {
      connectInternetIdentityWallet(walletConnectCallback);
    } else if (walletId === 'nfid') {
      connectNFIDWallet(walletConnectCallback);
    }
  };

  const handleBack = () => {
    setSelectedWallet(null);
    setError(null);
  };

  const handleClose = () => {
    if (!connecting) {
      setError(null)
      setSelectedWallet(null);
      setConnecting(false)
      onClose()
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = "unset"
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div
          className="w-full max-w-md bg-background border rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!selectedWallet && <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("internet-identity")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/icp.png"
                    alt="Internet Identity"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Internet Identity</span>
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("nfid")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/email.png"
                    alt="NFID"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Sign in with Email (NFID)</span>
              </Button>

            </div>
            }

            {connecting && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
