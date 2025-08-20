"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Music, Search, Play, Users, Star, Clock, Globe } from "lucide-react"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"

export default function DiscoverPage() {
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([])
  const [allTracks, setAllTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { listTracks, getUser } = await import("@/lib/ic/backend")
        const tracksRes = await listTracks()
        if (!mounted) return
        // Normalize tracks for UI
        const uiTracks = (tracksRes || []).map((t: any) => ({
          id: Number(t.id),
          title: t.title,
          artist: t.artist, // Principal
          duration: t.duration,
          genre: t.genre,
          coverImage: t.coverImage,
          audioUrl: t.audioUrl,
          plays: Number(t.plays ?? 0),
          likes: Number(t.likes ?? 0),
          price: Number(t.price ?? 0),
          releaseDate: t.releaseDate,
          description: t.description,
          audioAssetId: t.audioAssetId?.[0],
          imageAssetId: t.imageAssetId?.[0],
        }))
        setAllTracks(uiTracks)

        // Derive featured artists from unique principals in tracks
        const principals = Array.from(new Set(uiTracks.map((tr) => tr.artist?.toText?.() ?? String(tr.artist))))
        const artistUsers: any[] = []
        for (const p of principals) {
          try {
            const uOpt = await getUser(p)
            const u = uOpt?.[0] ?? uOpt // handle candid optional variants
            if (u && ("artist" in u.userType)) {
              artistUsers.push({
                id: u.owner?.toText?.() ?? p,
                displayName: u.displayName,
                userType: "artist",
                bio: u.bio,
                location: u.location,
                genres: u.genres,
                profileImage: u.profileImage,
                isVerified: Boolean(u.isVerified),
                followers: Number(u.followers ?? 0),
                following: Number(u.following ?? 0),
                mccBalance: Number(u.balance ?? 0),
                joinedDate: Number(u.joinedTimestamp ?? 0),
              })
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

  const trendingPlaylists = [
    {
      id: 1,
      title: "Afrobeat Essentials",
      description: "The best of modern Afrobeat",
      tracks: 45,
      duration: "2h 34m",
      image: "/placeholder.svg?height=120&width=120",
    },
    {
      id: 2,
      title: "Rising Stars",
      description: "Discover new African talent",
      tracks: 32,
      duration: "1h 58m",
      image: "/placeholder.svg?height=120&width=120",
    },
    {
      id: 3,
      title: "Chill Vibes",
      description: "Relaxing African rhythms",
      tracks: 28,
      duration: "1h 42m",
      image: "/placeholder.svg?height=120&width=120",
    },
  ]

  const genres = [
    { name: "Afrobeat", count: "2.3K tracks", color: "bg-purple-600" },
    { name: "Afro-fusion", count: "1.8K tracks", color: "bg-blue-600" },
    { name: "Highlife", count: "1.2K tracks", color: "bg-green-600" },
    { name: "Amapiano", count: "956 tracks", color: "bg-yellow-600" },
    { name: "Gospel", count: "743 tracks", color: "bg-red-600" },
    { name: "Hip-hop", count: "1.5K tracks", color: "bg-indigo-600" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation currentPage="discover" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Discover Music</h1>
          <p className="text-gray-400 mb-6">Explore the best African music and discover new artists</p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search artists, genres, or playlists..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Featured Artists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Artists</h2>
            <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredArtists.map((artist) => (
              <Card
                key={artist.id}
                className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors"
              >
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    <img
                      src={artist.profileImage || "/placeholder.svg"}
                      alt={artist.displayName}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                    {artist.isVerified && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                        <Star className="h-3 w-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{artist.displayName}</h3>
                  <Badge className="mb-3 bg-purple-600/20 text-purple-300 border-purple-600/30">
                    {artist.genres[0] || "Music"}
                  </Badge>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{artist.followers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Play className="h-3 w-3" />
                        <span>{(artist.monthlyListeners || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs">{artist.location}</p>
                  </div>
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Follow</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Playlists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Trending Playlists</h2>
            <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {trendingPlaylists.map((playlist) => (
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {genres.map((genre) => (
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

        {/* Stats Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Platform Stats</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Artists</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">2,847</div>
                <p className="text-xs text-purple-500">+12% this month</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Tracks</CardTitle>
                <Music className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">45,231</div>
                <p className="text-xs text-blue-500">+8% this week</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Hours Streamed</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">1.2M</div>
                <p className="text-xs text-green-500">+15% this month</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Countries</CardTitle>
                <Globe className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">54</div>
                <p className="text-xs text-yellow-500">Across Africa</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
