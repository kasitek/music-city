"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, CheckCircle, Share2, Music, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2 } from 'lucide-react'

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { listArtists, resetActor } from "@/lib/ic/backend"
import { GENRES } from "@/lib/constants"
import { fromCandidUser, fromCandidTrack } from "@/lib/mappers"
import type { UserModel, TrackModel } from "@/lib/types"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/ic/auth-context"
import { getAssetData } from "@/lib/ic/storage_client"
import { updateProfile } from "@/lib/ic/backend"
import { toast } from "sonner"

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
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [shuffle, setShuffle] = useState<boolean>(false)
  const [repeat, setRepeat] = useState<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const searchParams = useSearchParams()
  const owner = searchParams.get('owner') || ''
  const router = useRouter()
  const { isAuthenticated, principalId } = useAuth()
  const [artistStats, setArtistStats] = useState<Record<string, { likes: number; streams: number; tracks: number }>>({})
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [editBio, setEditBio] = useState<string>('')
  const [editLocation, setEditLocation] = useState<string>('')
  const [editGenres, setEditGenres] = useState<string>('')
  const [editImage, setEditImage] = useState<string>('')
  const [artistSearch, setArtistSearch] = useState<string>('')
  const [selectedGenre, setSelectedGenre] = useState<string>('All')

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
          // Index view: list all artists + aggregate likes/streams from tracks
          const res = await listArtists()
          if (!mounted) return
          const all: UserModel[] = (res || []).map((u: any) => fromCandidUser(u))
          const uniqueArtists = Array.from(new Map(all.map((a: UserModel) => [String(a.owner).toLowerCase(), a])).values())
          setArtists(uniqueArtists)

          // Build per-artist stats from tracks
          try {
            const tr = await (await import('@/lib/ic/backend')).listTracks()
            if (!mounted) return
            const mappedTracks: TrackModel[] = (tr || []).map((t: any) => fromCandidTrack(t))
            const agg: Record<string, { likes: number; streams: number; tracks: number }> = {}
            for (const t of mappedTracks) {
              const key = String(t.artist)
              if (!agg[key]) agg[key] = { likes: 0, streams: 0, tracks: 0 }
              agg[key].likes += Number(t.likes || 0)
              agg[key].streams += Number(t.plays || 0)
              agg[key].tracks += 1
            }
            setArtistStats(agg)
          } catch {}
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

  // Initialize follow state from localStorage for the signed-in user
  useEffect(() => {
    try {
      const pid = principalId ? String(principalId) : null
      if (!pid) return
      const followKey = `mc_following_${pid}`
      const savedFollows = JSON.parse(localStorage.getItem(followKey) || '[]') as string[]
      if (Array.isArray(savedFollows) && savedFollows.length) {
        const map: Record<string, boolean> = {}
        for (const owner of savedFollows) map[owner] = true
        setFollowing(prev => ({ ...prev, ...map }))
      }
    } catch {}
  }, [principalId, artists.length])

  // Listen for follow changes from other pages/tabs and refresh the index
  useEffect(() => {
    if (owner) return // only care on index grid
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mc_follow_changed') {
        // Trigger a lightweight refresh of the artist list and per-artist stats
        (async () => {
          try {
            const res = await listArtists()
            const all: UserModel[] = (res || []).map((u: any) => fromCandidUser(u))
            const uniqueArtists = Array.from(new Map(all.map((a: UserModel) => [String(a.owner).toLowerCase(), a])).values())
            setArtists(uniqueArtists)
          } catch {}
        })()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [owner])

  // Bind audio element events
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setProgress(el.currentTime || 0)
    const onLoaded = () => setDuration(el.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [audioRef.current])

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])

  // Time formatter for player bar
  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec % 60))
    const m = Math.max(0, Math.floor((sec / 60) % 60))
    const h = Math.max(0, Math.floor(sec / 3600))
    const pad = (n: number) => n.toString().padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
  }

  // Audio helpers
  const stopAudio = () => {
    try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; audioRef.current.onloadedmetadata = null; } } catch {}
    if (audioUrl) { try { URL.revokeObjectURL(audioUrl) } catch {} }
    setAudioUrl(null)
    setPlayingId(null)
  }

  const playTrackAudio = async (t: TrackModel) => {
    if (!isAuthenticated) { router.push('/auth'); return }
    const id = String(t.id)
    if (playingId === id) {
      stopAudio()
      return
    }
    stopAudio()
    if (t.audioAssetId === undefined || t.audioAssetId === null) {
      console.warn('No audio asset linked to this track.')
      return
    }
    try {
      const assetIdBig = typeof t.audioAssetId === 'bigint' ? t.audioAssetId : BigInt(t.audioAssetId as any)
      const asset = await getAssetData(assetIdBig)
      const u8 = asset?.bytes
      if (!u8 || u8.length === 0) {
        console.warn('Audio not found in storage bucket.')
        return
      }
      const blob = new Blob([u8], { type: asset?.contentType || 'audio/mpeg' })
      // Revoke previous URL if any
      if (audioUrl) { try { URL.revokeObjectURL(audioUrl) } catch {} }
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setPlayingId(id)
      // Start playback: set src directly to avoid race with React attribute update
      setTimeout(() => {
        const el = audioRef.current
        if (!el) return
        try { el.src = url } catch {}
        el.volume = volume
        el.onended = () => {
          setPlayingId(null)
          try { URL.revokeObjectURL(url) } catch {}
          setAudioUrl(null)
        }
        // Try immediate load+play
        try { el.load() } catch {}
        el.play().then(() => setIsPlaying(true)).catch(() => {
          // Fallback: wait until it can play
          el.onloadedmetadata = () => { el.play().then(() => setIsPlaying(true)).catch(() => {/* ignore */}) }
          el.oncanplay = () => { el.play().then(() => setIsPlaying(true)).catch(() => {/* ignore */}) }
        })
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
      const { follow, getUser, unfollow } = await import('@/lib/ic/backend')
      // Toggle: if already following, unfollow
      const already = !!following[a.owner]
      const res = already ? await unfollow(a.owner) : await follow(a.owner)
      const hasErr = (res && (('err' in res) || ('Err' in res)))
      const okVal = (res && (('ok' in res) ? (res as any).ok : (('Ok' in res) ? (res as any).Ok : undefined)))
      if (okVal === true && !hasErr) {
        // Update toggle state
        setFollowing(prev => ({ ...prev, [a.owner]: !already }))
        // Optimistically update followers count in UI
        const delta = already ? -1 : 1
        setArtists(prev => prev.map(it => {
          if (String(it.owner) !== String(a.owner)) return it
          const curr = Number(it.followers || 0)
          const next = Math.max(0, curr + delta)
          return { ...it, followers: BigInt(next) } as UserModel
        }))
        if (artist && a.owner === artist.owner) {
          const curr = Number(artist.followers || 0)
          const next = Math.max(0, curr + delta)
          setArtist({ ...artist, followers: BigInt(next) })
        }
        // Persist per-user follow list locally to avoid duplicate follow on reload
        try {
          const pid = principalId ? String(principalId) : null
          if (pid) {
            const key = `mc_following_${pid}`
            const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[]
            const set = new Set(arr)
            if (already) { set.delete(a.owner) } else { set.add(a.owner) }
            localStorage.setItem(key, JSON.stringify(Array.from(set)))
          }
        } catch {}
        // Refresh canonical followers count from backend to avoid drift
        try {
          const uOpt = await getUser(a.owner)
          const u = (Array.isArray(uOpt) ? uOpt[0] : uOpt) as any | undefined
          if (u) {
            const fresh = fromCandidUser(u)
            if (artist && a.owner === artist.owner) {
              setArtist({ ...artist, followers: fresh.followers })
            }
            setArtists(prev => prev.map(it => String(it.owner) === String(a.owner) ? { ...it, followers: fresh.followers } as UserModel : it))
          }
        } catch {}
        // Broadcast to other tabs/pages so they can refresh
        try { localStorage.setItem('mc_follow_changed', `${a.owner}:${Date.now()}`) } catch {}
      } else {
        toast.error('Follow action failed. Please make sure you are signed in and have completed onboarding.')
      }
    } catch (e) {
      console.error('Follow failed:', e)
      toast.error('Follow action failed. Please try again.')
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
              <h1 className="text-3xl font-bold">Featured Artists</h1>
              <div className="mt-4 flex items-center gap-3">
                <Input
                  placeholder="Search artists by name or location..."
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>
              {/* Genre Filter Chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {["All", ...GENRES].map((g) => (
                  <Badge
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    variant="outline"
                    className={`border cursor-pointer ${selectedGenre === g ? 'bg-purple-600/30 border-purple-500 text-white' : 'border-gray-600 text-gray-300 hover:bg-purple-600 hover:border-purple-600'}`}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <section>
              {loading && <div className="text-gray-400">Loading artists…</div>}
              {error && <div className="text-red-400">{error}</div>}
              {!loading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {artists
                    .filter((a) => {
                      // Search filter
                      const q = (artistSearch || "").trim().toLowerCase()
                      const matchSearch = !q || (a.displayName || "").toLowerCase().includes(q) || (a.location || "").toLowerCase().includes(q)
                      // Genre filter
                      const matchGenre = selectedGenre === 'All' || (Array.isArray(a.genres) && a.genres.some(g => (g || '').toLowerCase() === selectedGenre.toLowerCase()))
                      return matchSearch && matchGenre
                    })
                    .map((a) => (
                    <Card
                      key={a.owner}
                      className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/artists?owner=${a.owner}`)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="relative mb-3">
                          <img
                            src={a.profileImage || "/placeholder.svg"}
                            alt={a.displayName}
                            className="w-14 h-14 rounded-full mx-auto object-cover"
                          />
                          <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xs font-semibold text-white mb-1 truncate flex items-center gap-1">
                          <span className="truncate">{a.displayName}</span>
                          <span className="text-[10px] text-blue-400 font-semibold shrink-0">Verified</span>
                        </h3>
                        <Badge className="mb-2 bg-purple-600/20 text-purple-300 border-purple-600/30 px-2 py-0.5 text-[10px]">
                          {(a.genres && a.genres[0]) || "Music"}
                        </Badge>
                        <div className="space-y-1 text-[10px] text-gray-400">
                          <div className="flex items-center justify-center space-x-3">
                            <div className="flex items-center space-x-1.5">
                              <Users className="h-3 w-3"/>
                              <span className="leading-none">{Number(a.followers || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Music className="h-3 w-3"/>
                              <span className="leading-none">{(artistStats[a.owner]?.tracks || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          {a.location && (
                            <p className="text-[9px] text-gray-500 truncate">{a.location}</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 justify-center">
                          {!(principalId && String(principalId) === String(a.owner)) && (
                            <Button
                              className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                              onClick={(e) => { e.stopPropagation(); onFollow(a) }}
                            >
                              {following[a.owner] ? 'Unfollow' : 'Follow'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="h-7 w-7 p-0 border-gray-600 text-gray-300 bg-transparent"
                            onClick={(e) => { e.stopPropagation(); onShare(a) }}
                            aria-label="Share Artist"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {artists.filter((a) => {
                    const q = (artistSearch || "").trim().toLowerCase()
                    const matchSearch = !q || (a.displayName || "").toLowerCase().includes(q) || (a.location || "").toLowerCase().includes(q)
                    const matchGenre = selectedGenre === 'All' || (Array.isArray(a.genres) && a.genres.some(g => (g || '').toLowerCase() === selectedGenre.toLowerCase()))
                    return matchSearch && matchGenre
                  }).length === 0 && (
                    <div className="text-gray-400 col-span-full">No artists found.</div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {owner && (
          <>
            {/* Hero banner */}
            {!loading && !error && artist && (
              <div className="mb-6 rounded-md overflow-hidden border border-gray-800">
                <div
                  className="relative h-48 md:h-64 w-full"
                  style={{
                    backgroundImage: `url(${artist.profileImage || "/placeholder.svg"})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                    <img src={artist.profileImage || "/placeholder.svg"} alt={artist.displayName} className="w-20 h-20 md:w-24 md:h-24 rounded-md object-cover border border-white/10" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {(artist.isVerified ?? true) && (
                          <span className="inline-flex items-center gap-1 text-blue-400">
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600"><CheckCircle className="h-3 w-3 text-white" /></span>
                            Verified
                          </span>
                        )}
                      </div>
                      <h1 className="text-3xl md:text-5xl font-extrabold mt-1 flex items-center gap-2">
                        <span>{artist.displayName}</span>
                        {(artist.isVerified ?? true) && (
                          <>
                            <span title="Verified" className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </span>
                            <span className="text-xs md:text-sm text-blue-400 font-semibold">Verified</span>
                          </>
                        )}
                      </h1>
                      <div className="text-gray-300 text-sm mt-1">
                        {tracks.reduce((s, t) => s + Number(t.plays || 0), 0).toLocaleString()} total streams
                        <span className="mx-2 text-gray-500">•</span>
                        {Number(artist.followers || 0).toLocaleString()} followers
                      </div>
                    </div>
                  </div>
                </div>
                {/* Controls row */}
                <div className="bg-gradient-to-b from-gray-800/60 to-transparent px-4 py-3 flex items-center gap-3">
                  <Button size="icon" className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700" onClick={() => { if (tracks.length) playTrackAudio(tracks[0]) }} aria-label="Play">
                    <Play className="h-5 w-5 text-white" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-300" aria-label="Shuffle">
                    <Music className="h-5 w-5" />
                  </Button>
                  {(principalId && String(principalId) === String(artist.owner)) && (
                    <Button variant="outline" className="border-white/10 text-white" onClick={() => {
                      setEditName(artist.displayName || '')
                      setEditBio(artist.bio || '')
                      setEditLocation(artist.location || '')
                      setEditGenres((artist.genres || []).join(', '))
                      setEditImage(artist.profileImage || '')
                      setEditOpen(true)
                    }}>Edit Profile</Button>
                  )}
                  {!(principalId && String(principalId) === String(artist.owner)) && (
                    <Button className="bg-gray-200/20 hover:bg-gray-200/30 border border-white/10" onClick={() => onFollow(artist)}>
                      {following[artist.owner] ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="ml-1 text-gray-300" aria-label="More">•••</Button>
                </div>
              </div>
            )}

            {/* Popular list */}
            {!loading && !error && (
              <section className="rounded-md border border-gray-800 bg-black/20">
                <h2 className="text-2xl font-bold px-4 pt-4 pb-2">Popular</h2>
                {tracks.length === 0 && <div className="text-gray-400 px-4 pb-4">No songs yet.</div>}
                <div className="px-2 pb-3 space-y-1">
                  {tracks.map((t, idx) => {
                    const active = playingId === String(t.id)
                    return (
                      <div key={String(t.id)} className={`grid grid-cols-12 items-center px-2 py-2 rounded ${active ? 'bg-gray-800/50' : 'hover:bg-gray-900/50'}`}>
                        {/* index / play */}
                        <div className="col-span-1 flex items-center gap-2 text-sm text-gray-400">
                          <span className={`${active ? 'hidden' : 'block'}`}>{idx + 1}</span>
                          <button
                            className={`p-1 rounded ${active ? 'bg-gray-700' : 'bg-transparent hover:bg-gray-800'}`}
                            onClick={() => playTrackAudio(t)}
                            aria-label="Play/Pause"
                          >
                            {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* artwork + title */}
                        <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                          <img src={t.coverImage || artist?.profileImage || '/placeholder.svg?height=40&width=40'} alt={t.title} className="w-10 h-10 rounded object-cover" />
                          <div className={`truncate ${active ? 'text-green-400' : 'text-white'} font-medium`}>{t.title || 'Unknown Track'}</div>
                        </div>
                        {/* plays */}
                        <div className="col-span-3 text-gray-300 text-sm">{Number(t.plays || 0).toLocaleString()}</div>
                        {/* duration */}
                        <div className="col-span-2 text-gray-400 text-sm text-right pr-2">{t.duration || '3:45'}</div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      {/* Hidden audio element bound to object URL for stable playback */}
      <audio ref={audioRef} src={audioUrl ?? undefined} />

      {/* Player Bar (matches Stream page minimal transport) */}
      {playingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 p-3 z-40">
          <div className="container mx-auto flex items-center justify-between">
            {/* Left: artwork + track title + artist */}
            <div className="flex items-center gap-3 w-[25%] overflow-hidden">
              <img
                src={(tracks.find(t => String(t.id)===playingId)?.coverImage) || (artist?.profileImage || '/placeholder.svg?height=40&width=40')}
                className="w-10 h-10 rounded object-cover"
                alt={tracks.find(t => String(t.id)===playingId)?.title || 'Playing artwork'}
              />
              <div className="truncate">
                <div className="text-white font-medium truncate">{tracks.find(t => String(t.id)===playingId)?.title || 'Playing'}</div>
                <div className="text-xs text-gray-400 truncate">{artist?.displayName || 'Artist'}</div>
              </div>
            </div>

            {/* Center: controls + seek */}
            <div className="flex flex-col items-center gap-2 w-[50%]">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" onClick={() => setShuffle(s => !s)} aria-label="Shuffle">
                  <Shuffle className={`h-4 w-4 ${shuffle ? 'text-purple-400' : ''}`} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { try { const el = audioRef.current; if (el) el.currentTime = Math.max(0, (el.currentTime || 0) - 5) } catch {} }} aria-label="Back">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => { if (!audioRef.current) return; if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) } else { audioRef.current.play().then(()=>setIsPlaying(true)).catch(()=>{}) } }} aria-label="Play/Pause">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { try { const el = audioRef.current; if (el) el.currentTime = Math.min(duration, (el.currentTime || 0) + 10) } catch {} }} aria-label="Next">
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRepeat(r => !r)} aria-label="Repeat">
                  <Repeat className={`h-4 w-4 ${repeat ? 'text-purple-400' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-gray-400 w-10 text-right">{formatTime(progress)}</span>
                <input type="range" min={0} max={Math.max(1, duration)} step={1} value={Math.min(progress, duration)} onChange={(e)=>{ const v=Number(e.target.value); if (audioRef.current) audioRef.current.currentTime=v; setProgress(v) }} className="w-full" />
                <span className="text-xs text-gray-400 w-10">{formatTime(Math.max(0, duration - progress))}</span>
              </div>
            </div>

            {/* Right: volume */}
            <div className="flex items-center gap-2 w-[25%] justify-end">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e)=>setVolume(Number(e.target.value))} className="w-28" />
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Edit Profile</h3>
              <Button variant="ghost" onClick={() => setEditOpen(false)}>✕</Button>
            </div>
            <div className="flex items-center gap-4">
              <img src={editImage || '/placeholder.svg'} className="w-16 h-16 rounded-full object-cover ring-1 ring-gray-700" />
              <div>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setEditImage(String(reader.result || ''))
                  reader.readAsDataURL(f)
                }} />
                <div className="text-xs text-gray-400 mt-1">PNG/JPG recommended, small size.</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-300">Display Name</label>
                <input className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2" value={editName} onChange={(e)=>setEditName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-300">Bio</label>
                <textarea className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2" rows={3} value={editBio} onChange={(e)=>setEditBio(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300">Location</label>
                  <input className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2" value={editLocation} onChange={(e)=>setEditLocation(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Genres (comma separated)</label>
                  <input className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2" value={editGenres} onChange={(e)=>setEditGenres(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={()=>setEditOpen(false)}>Cancel</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={async ()=>{
                try {
                  await updateProfile({
                    displayName: editName || undefined,
                    bio: editBio || undefined,
                    location: editLocation || undefined,
                    genres: (editGenres || '').split(',').map(s=>s.trim()).filter(Boolean),
                    profileImage: editImage || undefined,
                  })
                  // refresh local artist state
                  if (owner) {
                    const uOpt = await (await import('@/lib/ic/backend')).getUser(owner)
                    const u = (Array.isArray(uOpt) ? uOpt[0] : uOpt) as any | undefined
                    if (u) setArtist(fromCandidUser(u))
                  }
                  setEditOpen(false)
                } catch (e) {
                  console.error('Update profile failed', e)
                }
              }}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

