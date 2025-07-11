"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Music, Search, Users, DollarSign, TrendingUp, Star, Play, Heart, Share2 } from "lucide-react"
import Link from "next/link"

export default function ArtistsPage() {
  const topArtists = [
    {
      id: 1,
      name: "Kemi Adebayo",
      genre: "Afrobeat",
      followers: "125K",
      monthlyEarnings: "$2,847",
      totalStreams: "1.2M",
      image: "/placeholder.svg?height=100&width=100",
      verified: true,
      trending: true,
    },
    {
      id: 2,
      name: "Tunde Okafor",
      genre: "Afro-fusion",
      followers: "89K",
      monthlyEarnings: "$1,923",
      totalStreams: "856K",
      image: "/placeholder.svg?height=100&width=100",
      verified: true,
      trending: false,
    },
    {
      id: 3,
      name: "Amara Nwosu",
      genre: "R&B",
      followers: "156K",
      monthlyEarnings: "$3,421",
      totalStreams: "1.8M",
      image: "/placeholder.svg?height=100&width=100",
      verified: true,
      trending: true,
    },
    {
      id: 4,
      name: "Yusuf Musa",
      genre: "World Music",
      followers: "67K",
      monthlyEarnings: "$1,234",
      totalStreams: "543K",
      image: "/placeholder.svg?height=100&width=100",
      verified: false,
      trending: false,
    },
  ]

  const newArtists = [
    {
      id: 5,
      name: "Zara Okonkwo",
      genre: "Afro-pop",
      followers: "12K",
      monthlyEarnings: "$234",
      joinDate: "Jan 2024",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 6,
      name: "Kwame Asante",
      genre: "Highlife",
      followers: "8K",
      monthlyEarnings: "$156",
      joinDate: "Feb 2024",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 7,
      name: "Fatima Kone",
      genre: "Afrobeat",
      followers: "15K",
      monthlyEarnings: "$345",
      joinDate: "Jan 2024",
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

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
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/discover" className="text-gray-300 hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/stream" className="text-gray-300 hover:text-white transition-colors">
              Stream
            </Link>
            <Link href="/artists" className="text-purple-400 font-medium">
              Artists
            </Link>
            <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
              NFT Marketplace
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Link href="/dashboard">Join as Artist</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Artists on Music City</h1>
          <p className="text-gray-400 mb-6">
            Discover talented African artists earning fair royalties through blockchain technology
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search artists by name or genre..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Artist Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Why Artists Choose Music City</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-green-500 mb-4" />
                <CardTitle className="text-white">Fair Royalties</CardTitle>
                <CardDescription className="text-gray-400">
                  Earn up to 90% of streaming revenue with transparent blockchain payments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle className="text-white">Direct Fan Connection</CardTitle>
                <CardDescription className="text-gray-400">
                  Build relationships with fans through tips, NFTs, and exclusive content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-500 mb-4" />
                <CardTitle className="text-white">Global Reach</CardTitle>
                <CardDescription className="text-gray-400">
                  Reach audiences across Africa and beyond without geographical restrictions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Top Artists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Earning Artists</h2>
            <div className="flex space-x-2">
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">This Month</Badge>
            </div>
          </div>
          <div className="space-y-4">
            {topArtists.map((artist, index) => (
              <Card
                key={artist.id}
                className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    <div className="text-2xl font-bold text-gray-400 w-8">#{index + 1}</div>

                    <div className="relative">
                      <img
                        src={artist.image || "/placeholder.svg"}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {artist.verified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Star className="h-3 w-3 text-white fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{artist.name}</h3>
                        {artist.trending && (
                          <Badge className="bg-red-600/20 text-red-300 border-red-600/30">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">{artist.genre}</Badge>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{artist.followers} followers</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Play className="h-3 w-3" />
                          <span>{artist.totalStreams} streams</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">{artist.monthlyEarnings}</div>
                      <div className="text-sm text-gray-400">This month</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Follow
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* New Artists */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">New Artists to Watch</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {newArtists.map((artist) => (
              <Card
                key={artist.id}
                className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors"
              >
                <CardContent className="p-6 text-center">
                  <img
                    src={artist.image || "/placeholder.svg"}
                    alt={artist.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-white mb-1">{artist.name}</h3>
                  <Badge className="mb-3 bg-purple-600/20 text-purple-300 border-purple-600/30">{artist.genre}</Badge>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center justify-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{artist.followers} followers</span>
                    </div>
                    <div className="text-green-400 font-medium">{artist.monthlyEarnings}/month</div>
                    <div className="text-xs">Joined {artist.joinDate}</div>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Follow</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600/30">
            <CardContent className="p-8 text-center">
              <Music className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Join Music City?</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Start earning fair royalties from your music today. Upload your tracks, connect with fans, and get paid
                instantly through blockchain technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/dashboard">Start as Artist</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
