"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Star } from 'lucide-react'

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { listArtists, resetActor } from "@/lib/ic/backend"
import { fromCandidUser } from "@/lib/mappers"
import type { UserModel } from "@/lib/types"

export default function ArtistsPage() {
  // Add state and useEffect:
  const [artists, setArtists] = useState<UserModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Reset actor cache to ensure fresh connection
        resetActor()
        console.log('[Artists] Attempting to load artists from backend...')
        console.log('[Artists] Environment check:', {
          NEXT_PUBLIC_DFX_NETWORK: process.env.NEXT_PUBLIC_DFX_NETWORK,
          NEXT_PUBLIC_IC_HOST: process.env.NEXT_PUBLIC_IC_HOST,
          NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID: process.env.NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID
        })
        
        const res = await listArtists()
        console.log('[Artists] Raw backend response:', res)
        if (!mounted) return
        
        const all: UserModel[] = (res || []).map((u: any) => fromCandidUser(u))
        console.log('[Artists] Mapped artists:', all)
        
        // Deduplicate by principal/id just in case
        const uniqueArtists = Array.from(new Map(all.map((a: UserModel) => [String(a.owner).toLowerCase(), a])).values())
        if (!mounted) return
        setArtists(uniqueArtists)
      } catch (e: any) {
        if (!mounted) return
        console.error('[Artists] Error loading artists:', e)
        const msg = e?.message || String(e)
        // Common local dev issue: agent didn't fetch root key or wrong host
        if (msg.includes('node signatures') || msg.includes('certificate') || msg.includes('IC0503')) {
          setError(
            'Query failed certificate validation. Ensure NEXT_PUBLIC_DFX_NETWORK=local and NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943 are set, the local replica is running (dfx start), and canister IDs match your local deploy.'
          )
        } else {
          setError(msg || "Failed to load artists")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation currentPage="artists" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">All Artists</h1>
          <p className="text-gray-400 mt-2">Fetched from the backend canister</p>
        </div>

        <section>
          {loading && <div className="text-gray-400">Loading artists…</div>}
          {error && <div className="text-red-400">{error}</div>}
          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {artists.map((artist) => (
                <Card key={artist.owner} className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={artist.profileImage || "/placeholder.svg"}
                          alt={artist.displayName}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        {artist.isVerified && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                            <Star className="h-3 w-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-semibold">{artist.displayName}</div>
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                            {artist.genres[0] || "Music"}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{Number(artist.followers).toLocaleString()} followers</span>
                        </div>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">View</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {artists.length === 0 && <div className="text-gray-400">No artists found.</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
