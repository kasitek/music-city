"use client"

import { useCallback, useState } from "react"
import { becomeArtist, getMyUser } from "@/lib/ic/backend"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function BecomeArtistPage() {
  const { user, loginWithII, loginWithNFID } = useAuth()
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const promote = useCallback(async () => {
    try {
      setStatus("")
      setLoading(true)
      // Ensure signed in (prefer existing session)
      if (!user) {
        try {
          await loginWithII()
        } catch {
          // fallback to NFID if II blocked/cancelled
          await loginWithNFID()
        }
      }
      const res = await becomeArtist()
      if ("ok" in res) {
        setStatus("Success: you are now an artist. Reloading profile...")
        await getMyUser()
      } else {
        setStatus(`Error: ${res.err}`)
      }
    } catch (e: any) {
      setStatus(`Error: ${e?.message || String(e)}`)
    } finally {
      setLoading(false)
    }
  }, [user, loginWithII, loginWithNFID])

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Become Artist</h1>
      <p className="text-sm text-muted-foreground">
        Click the button to promote your current signed-in account to <b>artist</b>.
      </p>
      <div className="flex items-center gap-3">
        <Button disabled={loading} onClick={promote}>
          {loading ? "Promoting..." : "Promote to Artist"}
        </Button>
        {status && <span className="text-sm">{status}</span>}
      </div>
    </div>
  )
}
