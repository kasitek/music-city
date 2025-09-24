"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Music, Search, Play, Pause, SkipForward, SkipBack, Volume2, Heart, Share2, Filter, Coins, DollarSign, Zap, Gift } from 'lucide-react'
import { useEffect, useRef, useState } from "react"
import { listTracks, streamTrack } from "@/lib/ic/backend"
import { getData } from "@/lib/ic/storage"

import { Navigation } from "@/components/navigation"
import { fromCandidTrack } from "@/lib/mappers"
import type { TrackModel } from "@/lib/types"

export default function StreamingPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<TrackModel | null>(null)
  const [tracks, setTracks] = useState<TrackModel[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Load tracks from backend canister
    listTracks()
      .then((res: any[]) => {
        const mapped = (res || []).map((t: any) => fromCandidTrack(t))
        setTracks(mapped)
      })
      .catch(() => {
        // leave empty gracefully if backend not available
      })
  }, [])

  const loadAndPlay = async (track: TrackModel) => {
    try {
      setCurrentTrack(track)
      setIsPlaying(false)
      // Expect optional audioAssetId on track
      const rawAssetId = track.audioAssetId
      if (rawAssetId === undefined || rawAssetId === null) {
        console.warn("No audio asset linked to this track")
        return
      }
      const bytesRes = await getData(undefined, BigInt(rawAssetId))
      const u8 = bytesRes instanceof Uint8Array ? bytesRes : new Uint8Array(bytesRes as any)
      if (!u8 || u8.length === 0) {
        console.warn("Audio bytes empty or unavailable")
        return
      }
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

        {/* Most Popular Track - Real Data */}
        {tracks.length > 0 && (() => {
          const mostPopular = tracks.reduce((prev, current) => 
            (Number(prev.plays) > Number(current.plays)) ? prev : current
          )
          
          return (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Most Popular Track</h2>
              <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600/30">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Music className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{mostPopular.title}</h3>
                      <p className="text-gray-300">{mostPopular.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-green-400">{Number(mostPopular.plays)} plays</span>
                        <span className="text-sm text-purple-400">{mostPopular.genre}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* Streaming Rewards Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Streaming Rewards</h3>
                    <p className="text-gray-300">Earn MCC tokens while listening & support artists</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">1,247 MCC</div>
                  <div className="text-sm text-gray-400">Your Balance</div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="h-4 w-4 text-blue-400" />
                    <div className="text-sm text-blue-400">Per Stream</div>
                  </div>
                  <div className="text-lg font-bold text-white">0.01 MCC</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <div className="text-sm text-green-400">To Artist</div>
                  </div>
                  <div className="text-lg font-bold text-white">90%</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="h-4 w-4 text-purple-400" />
                    <div className="text-sm text-purple-400">Platform Fee</div>
                  </div>
                  <div className="text-lg font-bold text-white">10%</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-orange-400" />
                    <div className="text-sm text-orange-400">Bonus Rewards</div>
                  </div>
                  <div className="text-lg font-bold text-white">Active</div>
                </div>
              </div>

              <div className="bg-gray-800/30 p-4 rounded-lg mb-4">
                <h4 className="text-lg font-semibold text-white mb-2">How Streaming Rewards Work</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <p className="mb-2">✓ <strong>Listen & Earn:</strong> Get 0.01 MCC per song streamed</p>
                    <p className="mb-2">✓ <strong>Support Artists:</strong> 90% goes directly to the artist instantly</p>
                  </div>
                  <div>
                    <p className="mb-2">✓ <strong>Bonus Multipliers:</strong> Premium users earn 2x rewards</p>
                    <p className="mb-2">✓ <strong>Instant Payouts:</strong> No waiting periods or minimums</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Coins className="h-4 w-4 mr-2" />
                  Buy MCC Tokens
                </Button>
                <Button variant="outline" className="border-green-600 text-green-400">
                  <Gift className="h-4 w-4 mr-2" />
                  Tip Artist
                </Button>
                <div className="text-sm text-gray-400 ml-auto">
                  Next reward in: <span className="text-white font-medium">2:47</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Track List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Trending Tracks</h2>
            <div className="text-sm text-gray-400">
              Every stream earns <span className="text-green-400 font-medium">0.01 MCC</span> for you and rewards the artist
            </div>
          </div>
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
                          {/* Hide principal id; do not show artist principal text */}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{track.duration || "3:45"}</div>
                          <div className="text-xs text-gray-500">{Number(track.plays || 0).toLocaleString()} plays</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <Badge className="bg-gray-700 text-gray-300">{track.genre || "Music"}</Badge>
                      <div className="flex items-center gap-1 text-xs">
                        <Coins className="h-3 w-3 text-green-400" />
                        <span className="text-green-400">+0.01 MCC</span>
                      </div>
                      <div className="text-xs text-gray-400">per stream</div>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1">
                        <Gift className="h-3 w-3 mr-1" />
                        Tip
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
