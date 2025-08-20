"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Music, Search, Play, Pause, SkipForward, SkipBack, Volume2, Heart, Share2, Filter } from 'lucide-react'
import { useEffect, useRef, useState } from "react"
import { listTracks, streamTrack } from "@/lib/ic/backend"
import { getData } from "@/lib/ic/storage"
import { Navigation } from "@/components/navigation"

export default function StreamingPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [tracks, setTracks] = useState<any[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Load tracks from backend canister
    listTracks()
      .then((res: any) => {
        setTracks(res as any[])
      })
      .catch(() => {
        // leave empty gracefully if backend not available
      })
  }, [])

  const loadAndPlay = async (track: any) => {
    try {
      setCurrentTrack(track)
      setIsPlaying(false)
      // Expect optional audioAssetId on track
      const assetId = (track as any).audioAssetId?.[0]
      if (!assetId) {
        console.warn("No audio asset linked to this track")
        return
      }
      const bytesRes = await getData(assetId)
      if (bytesRes && Array.isArray((bytesRes as any))) {
        const u8 = new Uint8Array(bytesRes as any)
        const blob = new Blob([u8], { type: "audio/mpeg" })
        const url = URL.createObjectURL(blob)
        // Revoke old URL
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(url)
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {/* ignore */})
          }
        }, 0)
        setIsPlaying(true)
        // Record stream
        await streamTrack(track.id)
      }
    } catch (e) {
      console.warn("Playback failed", e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation currentPage="stream" />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Stream Music</h1>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for artists, tracks, or genres..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-2">
            {["All", "Afrobeat", "Hip-hop", "R&B", "Afro-fusion", "Gospel", "Highlife", "Pop", "Jazz", "Electronic"].map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-purple-600 hover:border-purple-600 cursor-pointer"
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured This Week</h2>
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Music className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Global Hits Playlist</h3>
                  <p className="text-gray-300">Discover the latest sounds from around the world</p>
                  <Button className="mt-2 bg-purple-600 hover:bg-purple-700">Explore Playlist</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Track List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Trending Tracks</h2>
          <div className="space-y-3">
            {tracks.map((track) => (
              <Card key={track.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={track.coverImage || "/placeholder.svg?height=48&width=48"}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <Button
                        size="sm"
                        className="absolute inset-0 bg-black/50 hover:bg-black/70 w-full h-full rounded-lg"
                        onClick={() => loadAndPlay(track)}
                      >
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{track.title || "Unknown Track"}</h3>
                          <p className="text-sm text-gray-400">{track.artist || "Unknown Artist"}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{track.duration || "3:45"}</div>
                          <div className="text-xs text-gray-500">{(track.plays || 0).toLocaleString()} plays</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-700 text-gray-300">{track.genre || "Music"}</Badge>
                      <div className="text-sm text-yellow-400">{track.price || 0} MCC</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => loadAndPlay(track)}
                      >
                        Stream
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Now Playing Bar */}
        {currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-40">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={currentTrack.coverImage || "/placeholder.svg?height=48&width=48"}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <div className="font-semibold text-white">{currentTrack.title || "Unknown Track"}</div>
                  <div className="text-sm text-gray-400">{currentTrack.artist || "Unknown Artist"}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button size="sm" variant="ghost">
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
                <Button size="sm" variant="ghost">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <div className="w-20 h-1 bg-gray-600 rounded-full">
                  <div className="w-1/2 h-full bg-purple-500 rounded-full"></div>
                </div>
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
