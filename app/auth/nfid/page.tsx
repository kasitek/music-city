"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/ic/auth-context"
import { WalletType } from "@/hooks/ic/types"
import { Button } from "@/components/ui/button"

export default function NFIDSignInPage() {
  const router = useRouter()
  const { login, backendActor } = useAuth()
  const [status, setStatus] = useState<string>("Opening NFID…")
  const [busy, setBusy] = useState<boolean>(true)

  const start = async () => {
    setBusy(true)
    setStatus("Opening NFID…")
    try {
      await login(WalletType.NFID)
      setStatus("Signed in. Checking profile…")
      
      // Wait a moment for the backend actor to be available
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check user type and redirect appropriately
      if (backendActor) {
        try {
          const icUser = await backendActor.getMyUser()
          if (icUser && icUser.length > 0) {
            const user = icUser[0]
            const isArtist = user?.userType && 'artist' in user.userType
            
            if (isArtist) {
              setStatus("Redirecting to dashboard…")
              router.replace("/dashboard")
            } else {
              setStatus("Redirecting to stream…")
              router.replace("/stream")
            }
          } else {
            setStatus("Redirecting to complete registration…")
            router.replace("/auth")
          }
        } catch (profileError) {
          setStatus("Redirecting to complete registration…")
          router.replace("/auth")
        }
      } else {
        setStatus("Redirecting to complete registration…")
        router.replace("/auth")
      }
    } catch (e: any) {
      setStatus(e?.message || "Sign-in failed. You can retry.")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/60 border border-gray-700 rounded-lg p-6">
        <div className="text-lg font-semibold mb-2">NFID</div>
        <div className="text-sm text-gray-300 mb-4">{status}</div>
        <div className="flex gap-3">
          <Button disabled={busy} onClick={start} className="bg-purple-600 hover:bg-purple-700">Retry</Button>
          <Button variant="outline" className="border-gray-600 text-gray-200" onClick={() => router.push("/auth")}>Back</Button>
        </div>
      </div>
    </div>
  )
}
