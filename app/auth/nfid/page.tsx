"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function NFIDSignInPage() {
  const router = useRouter()
  const { loginWithNFID } = useAuth()
  const [status, setStatus] = useState<string>("Opening NFID…")
  const [busy, setBusy] = useState<boolean>(true)

  const start = async () => {
    setBusy(true)
    setStatus("Opening NFID…")
    try {
      await loginWithNFID()
      setStatus("Signed in. Redirecting…")
      router.replace("/dashboard")
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
