"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Music, Search, Play, Pause, SkipForward, SkipBack, Volume2, Heart, Share2, Filter, Coins, DollarSign, Zap, Gift, Shuffle, Repeat, Users, CheckCircle } from 'lucide-react'
import { useEffect, useRef, useState } from "react"
import { listTracks, streamTrack } from "@/lib/ic/backend"
import { getAssetData } from "@/lib/ic/storage_client"
import { toast } from "sonner"

import { Navigation } from "@/components/navigation"
import { GENRES } from "@/lib/constants"
import { useAuth } from "@/hooks/ic/auth-context"
import { useRouter } from "next/navigation"
import { fromCandidTrack } from "@/lib/mappers"
import type { TrackModel } from "@/lib/types"

export default function StreamingPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<TrackModel | null>(null)
  const [tracks, setTracks] = useState<TrackModel[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentDuration, setCurrentDuration] = useState<string | null>(null)
  const [progress, setProgress] = useState(0) // seconds
  const [duration, setDuration] = useState(0) // seconds
  const [volume, setVolume] = useState(0.8)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [queue, setQueue] = useState<TrackModel[]>([])
  const [queueIndex, setQueueIndex] = useState<number>(-1)
  const [recentlyPlayed, setRecentlyPlayed] = useState<TrackModel[]>([])
  const [currentArtistName, setCurrentArtistName] = useState<string>('')
  const [currentArtistFollowers, setCurrentArtistFollowers] = useState<number>(0)
  const [selectedGenre, setSelectedGenre] = useState<string>('All')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState<string>('')
  const [artistNames, setArtistNames] = useState<Record<string, string>>({})
  const [artistImages, setArtistImages] = useState<Record<string, string>>({})
  const [artistVerified, setArtistVerified] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load tracks from backend canister
    listTracks()
      .then((res: any[]) => {
        const mapped = (res || []).map((t: any) => fromCandidTrack(t))
        // Sort by plays desc for trending
        const sorted = [...mapped].sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0))
        setTracks(sorted)
        // Preload artist names and images for search and artwork fallback
        const unique = Array.from(new Set(sorted.map(t => String(t.artist))))
        ;(async () => {
          try {
            const { getUser } = await import("@/lib/ic/backend")
            const entries = await Promise.all(unique.map(async (p) => {
              try {
                const uOpt: any = await getUser(p as any)
                const u: any = Array.isArray(uOpt) ? (uOpt[0] || null) : uOpt
                return [p, { name: u?.displayName || '', image: u?.profileImage || '', verified: !!u?.isVerified }] as const
              } catch { return [p, { name: '', image: '' }] as const }
            }))
            const nameMap: Record<string, string> = {}
            const imageMap: Record<string, string> = {}
            const verMap: Record<string, boolean> = {}
            for (const [k, v] of entries) { nameMap[k] = v.name || ''; imageMap[k] = v.image || ''; verMap[k] = !!(v as any).verified }
            setArtistNames(nameMap)
            setArtistImages(imageMap)
            setArtistVerified(verMap)
          } catch {}
        })()
      })
      .catch(() => {
        // leave empty gracefully if backend not available
      })
    // Load recently played from localStorage (kept for future, but not shown now)
    try {
      const raw = localStorage.getItem('mc_recently_played')
      if (raw) {
        const arr = JSON.parse(raw) as TrackModel[]
        setRecentlyPlayed(arr)
      }
    } catch {}
  }, [])

  // Bind audio events for progress/duration updates and auto-next
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setProgress(a.currentTime || 0)
    const onLoaded = () => {
      const d = a.duration || 0
      setDuration(d)
      if (d && isFinite(d)) setCurrentDuration(formatDuration(d))
    }
    const onEnded = () => {
      handleNext()
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('ended', onEnded)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('ended', onEnded)
    }
  }, [audioRef.current])

  // Keep audio element volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const loadAndPlay = async (track: TrackModel, opts?: { setAsQueueFrom?: 'trending' | 'recent' | 'single' }) => {
    try {
      if (!isAuthenticated) { router.push('/auth'); return }
      setCurrentTrack(track)
      // Resolve artist display name for Now Playing
      try {
        const { getUser } = await import("@/lib/ic/backend")
        const uOpt: any = await getUser(track.artist as any)
        const u: any = Array.isArray(uOpt) ? (uOpt[0] || null) : uOpt
        if (u) {
          setCurrentArtistName(String(u.displayName || ''))
          setCurrentArtistFollowers(Number(u.followers || 0))
        } else {
          setCurrentArtistName('')
          setCurrentArtistFollowers(0)
        }
      } catch {
        setCurrentArtistName('')
        setCurrentArtistFollowers(0)
      }
      setIsPlaying(false)
      setCurrentDuration(null)
      setProgress(0)
      setDuration(0)
      // Setup queue if requested
      if (opts?.setAsQueueFrom === 'trending') {
        const list = tracks
        const startIdx = list.findIndex(t => String(t.id) === String(track.id))
        setQueue(list)
        setQueueIndex(startIdx >= 0 ? startIdx : 0)
      } else if (opts?.setAsQueueFrom === 'recent') {
        const list = recentlyPlayed
        const startIdx = list.findIndex(t => String(t.id) === String(track.id))
        setQueue(list)
        setQueueIndex(startIdx >= 0 ? startIdx : 0)
      } else if (opts?.setAsQueueFrom === 'single') {
        setQueue([track])
        setQueueIndex(0)
      }
      // Expect optional audioAssetId on track
      const rawAssetId = track.audioAssetId
      if (rawAssetId === undefined || rawAssetId === null) {
        toast.error("No audio asset linked to this track")
        return
      }
      const asset = await getAssetData(BigInt(rawAssetId))
      const u8 = asset?.bytes
      if (!u8 || u8.length === 0) {
        toast.error("Audio bytes empty or unavailable")
        return
      }
      const blob = new Blob([u8], { type: asset?.contentType || "audio/mpeg" })
      const url = URL.createObjectURL(blob)
      // Revoke old URL
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(url)
      // Persist now-playing metadata for cross-page mini player
      try {
        const meta = {
          title: track.title || 'Unknown Track',
          artist: (artistNames[String(track.artist)] || currentArtistName || ''),
          cover: track.coverImage || artistImages[String(track.artist)] || '/placeholder.svg?height=48&width=48',
        }
        localStorage.setItem('mc_now_playing_meta', JSON.stringify(meta))
      } catch {}
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {/* ignore */})
        }
      }, 0)
      setIsPlaying(true)
      // Record stream
      await streamTrack(track.id)
      // Update Recently Played
      try {
        const updated = [track, ...recentlyPlayed.filter(t => String(t.id) !== String(track.id))].slice(0, 20)
        setRecentlyPlayed(updated)
        localStorage.setItem('mc_recently_played', JSON.stringify(updated))
      } catch {}
    } catch (e) {
      toast.error("Playback failed")
    }
  }

  const handlePrev = () => {
    if (!queue || queue.length === 0) return
    if (shuffle) {
      const idx = Math.floor(Math.random() * queue.length)
      loadAndPlay(queue[idx], { setAsQueueFrom: 'single' })
      setQueueIndex(idx)
      return
    }
    let nextIdx = queueIndex - 1
    if (nextIdx < 0) nextIdx = repeat ? (queue.length - 1) : 0
    if (nextIdx !== queueIndex) {
      setQueueIndex(nextIdx)
      loadAndPlay(queue[nextIdx], { setAsQueueFrom: 'single' })
    }
  }

  const handleNext = () => {
    if (!queue || queue.length === 0) return
    if (shuffle) {
      const idx = Math.floor(Math.random() * queue.length)
      loadAndPlay(queue[idx], { setAsQueueFrom: 'single' })
      setQueueIndex(idx)
      return
    }
    let nextIdx = queueIndex + 1
    if (nextIdx >= queue.length) nextIdx = repeat ? 0 : queueIndex
    if (nextIdx !== queueIndex) {
      setQueueIndex(nextIdx)
      loadAndPlay(queue[nextIdx], { setAsQueueFrom: 'single' })
    }
  }

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = v
      setProgress(v)
    }
  }

  const formatDuration = (sec: number) => {
    const s = Math.floor(sec % 60)
    const m = Math.floor((sec / 60) % 60)
    const h = Math.floor(sec / 3600)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation currentPage="stream" />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Stream Music</h1>

          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for artists, tracks, or genres..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-2 overflow-x-auto sm:overflow-visible no-scrollbar py-1 -mx-1 sm:mx-0 w-full">
            {["All", ...GENRES].map((genre) => (
              <Badge
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                variant="outline"
                aria-pressed={selectedGenre === genre}
                className={`rounded-full px-3 py-1 text-xs md:text-sm transition-colors whitespace-nowrap ${selectedGenre === genre ? 'bg-purple-600/30 border-purple-500 text-white' : 'border-gray-600 text-gray-300 hover:bg-purple-600/40 hover:border-purple-600'}`}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>
        {/* Only display songs with functional filters */}

        {/* Track List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Songs</h2>
          </div>
          <div className="space-y-1">
            {(selectedGenre === 'All' ? tracks : tracks.filter(t => (t.genre || '').toLowerCase() === selectedGenre.toLowerCase()))
              .filter(t => {
                const q = query.trim().toLowerCase()
                if (!q) return true
                const title = (t.title || '').toLowerCase()
                const genre = (t.genre || '').toLowerCase()
                const artistName = (artistNames[String(t.artist)] || '').toLowerCase()
                return title.includes(q) || artistName.includes(q) || genre.includes(q)
              })
              .map((track, idx) => {
                const active = currentTrack && String(currentTrack.id) === String(track.id)
                return (
                  <div
                    key={String(track.id)}
                    className={`grid grid-cols-12 items-center px-3 py-2 rounded-md ${active ? 'bg-gray-700/60' : 'hover:bg-gray-800'} transition-colors`}
                  >
                    {/* Index / Play */}
                    <div className="col-span-1 flex items-center gap-2 text-sm text-gray-400">
                      <span className={`${active ? 'hidden' : 'block'}`}>{idx + 1}</span>
                      <button
                        className={`p-1 rounded ${active ? 'bg-gray-600' : 'bg-transparent hover:bg-gray-700'}`}
                        onClick={() => {
                          if (currentTrack && String(currentTrack.id) === String(track.id)) {
                            if (!audioRef.current) return
                            if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
                            else { audioRef.current.play().catch(()=>{}); setIsPlaying(true) }
                          } else {
                            loadAndPlay(track, { setAsQueueFrom: 'trending' })
                          }
                        }}
                        aria-label="Play/Pause"
                      >
                        {active && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Artwork + Title */}
                    <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                      <img src={track.coverImage || artistImages[String(track.artist)] || '/placeholder.svg?height=40&width=40'} alt={track.title} className="w-10 h-10 rounded object-cover flex-none" />
                      <div className="truncate">
                        <div className={`truncate ${active ? 'text-green-400' : 'text-white'} font-medium`}>{track.title || 'Unknown Track'}</div>
                        <div className="text-xs text-gray-400 truncate">{artistNames[String(track.artist)] || track.genre || 'Music'}</div>
                      </div>
                    </div>

                    {/* Plays */}
                    <div className="col-span-3 text-gray-300 text-sm">
                      {Number(track.plays || 0).toLocaleString()}
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 text-gray-400 text-sm text-right">
                      {track.duration || '3:45'}
                    </div>
                  </div>
                )
            })}
          </div>
        </div>

        {/* Now Playing Bar */}
        {currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-40">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={currentTrack.coverImage || artistImages[String(currentTrack.artist)] || "/placeholder.svg?height=48&width=48"}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <div className="font-semibold text-white">{currentTrack.title || "Unknown Track"}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <span>{currentArtistName || "Unknown Artist"}</span>
                    <span title="Verified Artist" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-600">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 w-[40%]">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShuffle(s => !s)} aria-label="Shuffle">
                    <Shuffle className={`h-4 w-4 ${shuffle ? 'text-purple-400' : ''}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handlePrev} aria-label="Previous">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    if (!audioRef.current) return
                    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
                    else { audioRef.current.play().catch(() => {/* ignore */}); setIsPlaying(true) }
                  }}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                  <Button size="sm" variant="ghost" onClick={handleNext} aria-label="Next">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRepeat(r => !r)} aria-label="Repeat">
                    <Repeat className={`h-4 w-4 ${repeat ? 'text-purple-400' : ''}`} />
                  </Button>
                </div>
                {/* Seek bar */}
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-gray-400 w-10 text-right">{formatDuration(progress)}</span>
                  <input type="range" min={0} max={Math.max(1, duration)} step={1} value={Math.min(progress, duration)} onChange={onSeek} className="w-full" />
                  <span className="text-xs text-gray-400 w-10">{formatDuration(Math.max(0, (duration || 0) - (progress || 0)))}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-[20%] justify-end">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-28" />
                {currentDuration && (<div className="text-xs text-gray-400">{currentDuration}</div>)}
              </div>
            </div>
            {/* Hidden audio element */}
            <audio ref={audioRef} src={audioUrl ?? undefined} />
          </div>
        )}
      </div>
    </div>
  )
}
