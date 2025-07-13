"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Music, Search, Play, Pause, SkipForward, SkipBack, Volume2, Heart, Share2, Coins, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { mockDB } from "@/lib/mock-database"

export default function StreamingPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [tracks, setTracks] = useState<any[]>([])

  useEffect(() => {
    mockDB.initializeDatabase()
    const allTracks = mockDB.getTracks()
    setTracks(allTracks)
  }, [])

  const handleStream = (trackId: string) => {
    // Simulate streaming and earning
    mockDB.simulateStreamEarning(trackId, 1)

    // Update tracks to reflect new stream count
    const updatedTracks = mockDB.getTracks()
    setTracks(updatedTracks)

    // Show some feedback
    console.log("Track streamed! Artist earned tokens.")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Music City
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">Streaming</Badge>
            <div className="flex items-center space-x-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-400">1,247 MCC</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Discover Music</h1>

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
            {["All", "Afrobeat", "Hip-hop", "R&B", "Afro-fusion", "Gospel", "Highlife"].map((genre) => (
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
                  <h3 className="text-xl font-bold text-white">New Afrobeat Hits</h3>
                  <p className="text-gray-300">Discover the latest sounds from across Africa</p>
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
                        src={track.cover || "/placeholder.svg"}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <Button
                        size="sm"
                        className="absolute inset-0 bg-black/50 hover:bg-black/70 w-full h-full rounded-lg"
                        onClick={() => {
                          setCurrentTrack(track)
                          setIsPlaying(!isPlaying)
                        }}
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
                          <h3 className="font-semibold text-white">{track.title}</h3>
                          <p className="text-sm text-gray-400">{track.artist}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{track.duration}</div>
                          <div className="text-xs text-gray-500">{track.streams.toLocaleString()} streams</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-700 text-gray-300">{track.genre}</Badge>
                      <div className="text-sm text-yellow-400">{track.price} MCC</div>
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
                        onClick={() => handleStream(track.id)}
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
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={currentTrack.cover || "/placeholder.svg"}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <div className="font-semibold text-white">{currentTrack.title}</div>
                  <div className="text-sm text-gray-400">{currentTrack.artist}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button size="sm" variant="ghost">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsPlaying(!isPlaying)}
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
          </div>
        )}
      </div>
    </div>
  )
}
