"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Star, Share2, Music, Play, Pause } from 'lucide-react'

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { listArtists, resetActor } from "@/lib/ic/backend"
import { fromCandidUser, fromCandidTrack } from "@/lib/mappers"
import type { UserModel, TrackModel } from "@/lib/types"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/ic/auth-context"

export default function ArtistsPage() {
  const [artists, setArtists] = useState<UserModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artist, setArtist] = useState<UserModel | null>(null)
  const [tracks, setTracks] = useState<TrackModel[]>([])
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [volume, setVolume] = useState<number>(0.7)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const searchParams = useSearchParams()
  const owner = searchParams.get('owner') || ''
  const router = useRouter()
  const { isAuthenticated, principalId } = useAuth()

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

        if (owner) {
          // Detail view: load specific artist and their tracks
          const { getUser, listTracks } = await import("@/lib/ic/backend")
          const uOpt = await getUser(owner)
          const u = (Array.isArray(uOpt) ? uOpt[0] : uOpt) as any | undefined
          if (!u) throw new Error('Artist not found')
          const mappedUser = fromCandidUser(u)
          if (!mounted) return
          setArtist(mappedUser)

          const tr = await listTracks()
          if (!mounted) return
          const allTracks: TrackModel[] = (tr || []).map((t: any) => fromCandidTrack(t))
          const mine = allTracks.filter(t => String(t.artist) === String(owner))
          setTracks(mine)
        } else {
          // Index view: list all artists
          const res = await listArtists()
          console.log('[Artists] Raw backend response:', res)
          if (!mounted) return

          const all: UserModel[] = (res || []).map((u: any) => fromCandidUser(u))
          console.log('[Artists] Mapped artists:', all)

          // Deduplicate by principal/id just in case
          const uniqueArtists = Array.from(new Map(all.map((a: UserModel) => [String(a.owner).toLowerCase(), a])).values())
          if (!mounted) return
          setArtists(uniqueArtists)
        }
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
  }, [owner])

  // Audio helpers
  const stopAudio = () => {
    try { audioRef.current?.pause() } catch {}
    if (audioUrl) { try { URL.revokeObjectURL(audioUrl) } catch {} }
    setAudioUrl(null)
    audioRef.current = null
    setPlayingId(null)
  }

  const playTrackAudio = async (t: TrackModel) => {
    const id = String(t.id)
    if (playingId === id) {
      stopAudio()
      return
    }
    stopAudio()
    if (t.audioAssetId === undefined || t.audioAssetId === null) {
      alert('No audio asset linked to this track.')
      return
    }
    try {
      const { getData } = await import('@/lib/ic/storage')
      const assetIdBig = typeof t.audioAssetId === 'bigint' ? t.audioAssetId : BigInt(t.audioAssetId as any)
      const bytes = await getData(undefined, assetIdBig)
      const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as any)
      if (!u8 || u8.length === 0) {
        alert('Audio not found in storage bucket.')
        return
      }
      const blob = new Blob([u8], { type: 'audio/mpeg' })
      // Revoke previous URL if any
      if (audioUrl) { try { URL.revokeObjectURL(audioUrl) } catch {} }
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setPlayingId(id)
      // Defer play until audio element binds src
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume
          audioRef.current.play().catch(() => {/* ignore */})
          audioRef.current.onended = () => {
            setPlayingId(null)
            try { URL.revokeObjectURL(url) } catch {}
            setAudioUrl(null)
            audioRef.current = null
          }
        }
      }, 0)
    } catch (e) {
      console.error('Audio playback error:', e)
      alert('Failed to play audio')
    }
  }

  async function onFollow(a: UserModel) {
    try {
      if (!isAuthenticated) { router.push('/auth'); return }
      // Prevent following yourself
      if (principalId && String(principalId) === String(a.owner)) {
        return
      }
      const { follow } = await import('@/lib/ic/backend')
      const res = await follow(a.owner)
      if ('ok' in res && res.ok) {
        setFollowing(prev => ({ ...prev, [a.owner]: true }))
        if (artist && a.owner === artist.owner) {
          setArtist({ ...artist, followers: (BigInt(artist.followers || 0) + BigInt(1)) })
        }
      }
    } catch (e) {
      console.error('Follow failed:', e)
    }
  }

  async function onShare(a: UserModel) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/artists?owner=${a.owner}`
    try {
      if (navigator.share) {
        await navigator.share({ title: a.displayName, text: `Check out ${a.displayName} on Music City`, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('Artist link copied to clipboard')
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      {/* Navigation */}
      <Navigation currentPage="artists" />

      <div className="container mx-auto px-4 py-8">
        {!owner && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">All Artists</h1>
              <p className="text-gray-400 mt-2">Fetched from the backend canister</p>
            </div>
            <section>
              {loading && <div className="text-gray-400">Loading artists…</div>}
              {error && <div className="text-red-400">{error}</div>}
              {!loading && !error && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {artists.map((a) => (
                    <Card key={a.owner} className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors cursor-pointer" onClick={() => router.push(`/artists?owner=${a.owner}`)}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img src={a.profileImage || "/placeholder.svg"} alt={a.displayName} className="w-14 h-14 rounded-full object-cover" />
                            {a.isVerified && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                                <Star className="h-3 w-3 text-white fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-white font-semibold">{a.displayName}</div>
                              <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">{a.genres[0] || "Music"}</Badge>
                            </div>
                            <div className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{Number(a.followers).toLocaleString()} followers</span>
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
          </>
        )}

        {owner && (
          <>
            <div className="mb-6">
              {loading && <div className="text-gray-400">Loading artist…</div>}
              {error && <div className="text-red-400">{error}</div>}
              {!loading && !error && artist && (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="relative">
                      <img src={artist.profileImage || "/placeholder.svg"} alt={artist.displayName} className="w-24 h-24 rounded-full object-cover" />
                      {artist.isVerified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Star className="h-4 w-4 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold">{artist.displayName}</h1>
                      <div className="mt-2 text-sm text-gray-300 flex gap-4">
                        <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {Number(artist.followers).toLocaleString()} followers</span>
                        <span className="inline-flex items-center gap-1"><Music className="h-4 w-4" /> {tracks.length} tracks</span>
                      </div>
                      {artist.bio && <p className="mt-3 text-gray-300 max-w-2xl">{artist.bio}</p>}
                      <div className="flex gap-2 mt-4">
                        {!(principalId && String(principalId) === String(artist.owner)) && (
                          <Button className="bg-purple-600 hover:bg-purple-700" disabled={!!following[artist.owner]} onClick={() => onFollow(artist)}>
                            {following[artist.owner] ? 'Following' : 'Follow'}
                          </Button>
                        )}
                        <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent" onClick={() => onShare(artist)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!loading && !error && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Songs</h2>
                {tracks.length === 0 && <div className="text-gray-400">No songs yet.</div>}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tracks.map((t) => (
                    <Card key={String(t.id)} className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={t.coverImage || "/placeholder.svg"} className="w-16 h-16 rounded object-cover" alt={t.title} />
                          <div className="flex-1">
                            <div className="text-white font-semibold">{t.title}</div>
                            <div className="text-sm text-gray-400">{t.genre} • {t.duration}</div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 inline-flex items-center gap-1"
                            onClick={() => playTrackAudio(t)}
                            aria-label={playingId === String(t.id) ? 'Pause' : 'Play'}
                          >
                            {playingId === String(t.id) ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {playingId === String(t.id) ? 'Pause' : 'Play'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      {/* Hidden audio element bound to object URL for stable playback */}
      <audio ref={audioRef} src={audioUrl ?? undefined} />
    </div>
  )
}

