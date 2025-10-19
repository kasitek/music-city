"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Music, Search, Play, Users, CheckCircle, Clock, Globe, Share2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { GENRES } from "@/lib/constants"
import { fromCandidTrack, fromCandidUser } from "@/lib/mappers"
import type { TrackModel, UserModel } from "@/lib/types"
import { useAuth } from "@/hooks/ic/auth-context"
import { useRouter } from "next/navigation"

export default function DiscoverPage() {
  const [featuredArtists, setFeaturedArtists] = useState<UserModel[]>([])
  const [allTracks, setAllTracks] = useState<TrackModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discoverSearch, setDiscoverSearch] = useState<string>("")
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { listTracks, getUser } = await import("@/lib/ic/backend")
        const tracksRes = await listTracks()
        if (!mounted) return
        // Normalize tracks for UI using mappers
        const uiTracks: TrackModel[] = (tracksRes || []).map((t: any) => fromCandidTrack(t))
        setAllTracks(uiTracks)

        // Derive featured artists from unique principals in tracks
        const principals = Array.from(new Set(uiTracks.map((tr) => tr.artist)))
        const artistUsers: UserModel[] = []
        for (const p of principals) {
          try {
            const uOpt = await getUser(p)
            const u = (Array.isArray(uOpt) ? uOpt[0] : uOpt) as any | undefined
            if (u) {
              const mapped = fromCandidUser(u)
              if (mapped.userType === 'artist') {
                artistUsers.push(mapped)
              }
            }
          } catch {}
        }
        if (!mounted) return
        setFeaturedArtists(artistUsers)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || "Failed to load data")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function onFollow(artist: UserModel) {
    try {
      if (!isAuthenticated) { router.push('/auth'); return }
      const { follow } = await import('@/lib/ic/backend')
      const res = await follow(artist.owner)
      if ('ok' in res && res.ok) {
        setFollowing((prev) => ({ ...prev, [artist.owner]: true }))
        setFeaturedArtists((prev) => prev.map(a => a.owner === artist.owner ? { ...a, followers: (BigInt(a.followers || 0) + BigInt(1)) } : a))
      }
    } catch (e) {
      console.error('Follow failed:', e)
    }
  }

  async function onShareArtist(artist: UserModel) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/artists?owner=${artist.owner}`
    try {
      if (navigator.share) {
        await navigator.share({ title: artist.displayName, text: `Check out ${artist.displayName} on Music City`, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('Artist link copied to clipboard')
      }
    } catch {}
  }

  // Helpers to parse track duration like "3:45" or "04:10" or "1:02:03"
  const parseDurationToSeconds = (d?: string): number => {
    if (!d) return 210 // default 3.5 min
    const parts = d.split(":").map(n => Number(n))
    if (parts.some(isNaN)) return 210
    if (parts.length === 3) { // h:m:s
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) { // m:s
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 1) { // seconds
      return parts[0]
    }
    return 210
  }

  const formatDuration = (sec: number): string => {
    const s = Math.floor(sec % 60)
    const m = Math.floor((sec / 60) % 60)
    const h = Math.floor(sec / 3600)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return h > 0 ? `${h}h ${pad(m)}m` : `${m}m ${pad(s)}s`
  }

  // Build real playlists:
  const allTracksSeconds = allTracks.reduce((sum, t) => sum + parseDurationToSeconds(t.duration), 0)
  const popularTracks = allTracks.filter(t => Number(t.plays || 0) > 0)
  const popularSeconds = popularTracks.reduce((sum, t) => sum + parseDurationToSeconds(t.duration), 0)
  const featuredArtistSet = new Set(featuredArtists.map(a => a.owner))
  const newArtistTracks = allTracks.filter(t => featuredArtistSet.has(String(t.artist)))
  const newArtistSeconds = newArtistTracks.reduce((sum, t) => sum + parseDurationToSeconds(t.duration), 0)

  const trendingPlaylists = [
    {
      id: 1,
      title: "Recent Uploads",
      description: "Latest tracks from artists",
      tracks: allTracks.length,
      duration: formatDuration(allTracksSeconds),
      image: "/placeholder.svg?height=120&width=120",
    },
    {
      id: 2,
      title: "Popular Tracks",
      description: "Most played songs",
      tracks: popularTracks.length,
      duration: formatDuration(popularSeconds),
      image: "/placeholder.svg?height=120&width=120",
    },
    {
      id: 3,
      title: "New Artists",
      description: "Fresh talent on the platform",
      tracks: newArtistTracks.length,
      duration: formatDuration(newArtistSeconds),
      image: "/placeholder.svg?height=120&width=120",
    },
  ]

  // Calculate track counts by genre and show all predefined genres from constants
  const genreCounts = allTracks.reduce((acc, track) => {
    const g = (track.genre || 'Other') as string
    acc[g] = (acc[g] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const colors = ["bg-purple-600", "bg-blue-600", "bg-green-600", "bg-yellow-600", "bg-red-600", "bg-indigo-600"]
  const genres = GENRES.map((name, index) => {
    const count = genreCounts[name] || 0
    return {
      name,
      count: `${count} track${count !== 1 ? 's' : ''}`,
      color: colors[index % colors.length],
    }
  })

  // Per-artist track counts for Featured Artists cards
  const artistTrackCounts = (allTracks || []).reduce((acc: Record<string, number>, t) => {
    const key = String(t.artist)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation currentPage="discover" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Discover Music</h1>
          <p className="text-gray-400 mb-6">Explore the best World music and discover new artists</p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              placeholder="Search featured artists, playlists, or genres..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Featured Artists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Artists</h2>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 bg-transparent"
              onClick={() => router.push('/artists')}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {featuredArtists
              .filter(a => {
                const q = (discoverSearch || '').trim().toLowerCase()
                if (!q) return true
                const name = (a.displayName || '').toLowerCase()
                const loc = (a.location || '').toLowerCase()
                return name.includes(q) || loc.includes(q)
              })
              .map((artist) => (
              <Card
                key={artist.owner}
                className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/artists?owner=${artist.owner}`)}
              >
                <CardContent className="p-4 text-center">
                  <div className="relative mb-3">
                    <img
                      src={artist.profileImage || "/placeholder.svg"}
                      alt={artist.displayName}
                      className="w-16 h-16 rounded-full mx-auto object-cover"
                    />
                    {(artist.isVerified ?? true) && (
                      <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5">
                        <CheckCircle className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 truncate flex items-center gap-1">
                    <span className="truncate">{artist.displayName}</span>
                    <span className="text-[10px] text-blue-400 font-semibold shrink-0">Verified</span>
                  </h3>
                  <Badge className="mb-2 bg-purple-600/20 text-purple-300 border-purple-600/30 px-2 py-0.5 text-[10px]">
                    {artist.genres[0] || "Music"}
                  </Badge>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="flex items-center space-x-1.5">
                        <Users className="h-3 w-3"/>
                        <span className="leading-none">{Number(artist.followers).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Music className="h-3 w-3"/>
                        <span className="leading-none">{(artistTrackCounts[artist.owner] || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{artist.location}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      className="flex-1 h-8 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                      disabled={!!following[artist.owner]}
                      onClick={(e) => { e.stopPropagation(); onFollow(artist) }}
                    >
                      {following[artist.owner] ? 'Following' : 'Follow'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 border-gray-600 text-gray-300 bg-transparent"
                      onClick={(e) => { e.stopPropagation(); onShareArtist(artist) }}
                    >
                      <Share2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Playlists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Trending Playlists</h2>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 bg-transparent"
              onClick={() => router.push('/stream')}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {trendingPlaylists
              .filter((p) => {
                const q = (discoverSearch || '').trim().toLowerCase()
                if (!q) return true
                return (
                  (p.title || '').toLowerCase().includes(q) ||
                  (p.description || '').toLowerCase().includes(q)
                )
              })
              .map((playlist) => (
              <Card
                key={playlist.id}
                className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors group cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <img
                        src={playlist.image || "/placeholder.svg"}
                        alt={playlist.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {playlist.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">{playlist.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>{playlist.tracks} tracks</span>
                        <span>•</span>
                        <span>{playlist.duration}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Genres */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Genre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {genres
              .filter((g) => {
                const q = (discoverSearch || '').trim().toLowerCase()
                if (!q) return true
                return (g.name || '').toLowerCase().includes(q)
              })
              .map((genre) => (
              <Card
                key={genre.name}
                className={`${genre.color} border-0 hover:scale-105 transition-transform cursor-pointer`}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-white mb-1">{genre.name}</h3>
                  <p className="text-xs text-white/80">{genre.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section - Real Data */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Platform Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Artists</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{featuredArtists.length.toLocaleString()}</div>
                <p className="text-xs text-purple-500">Live from IC backend</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Tracks</CardTitle>
                <Music className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{allTracks.length.toLocaleString()}</div>
                <p className="text-xs text-blue-500">Live from IC backend</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Plays</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {allTracks.reduce((sum, track) => sum + (Number(track.plays) || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-green-500">Live from IC backend</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Genres</CardTitle>
                <Globe className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{Object.keys(genreCounts).length}</div>
                <p className="text-xs text-yellow-500">Different genres</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
