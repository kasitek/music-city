"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Music, Search, Coins, Crown, Zap, Eye, Heart, Filter, TrendingUp } from "lucide-react"
import Link from "next/link"
import { mockDB } from "@/lib/mock-database"
import { useState, useEffect } from "react"

export default function NFTMarketplace() {
  const [nfts, setNfts] = useState<any[]>([])

  useEffect(() => {
    mockDB.initializeDatabase()
    const allNFTs = mockDB.getNFTs()
    setNfts(allNFTs)
  }, [])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return "bg-yellow-600/20 text-yellow-300 border-yellow-600/30"
      case "Rare":
        return "bg-purple-600/20 text-purple-300 border-purple-600/30"
      case "Common":
        return "bg-gray-600/20 text-gray-300 border-gray-600/30"
      default:
        return "bg-gray-600/20 text-gray-300 border-gray-600/30"
    }
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
            <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-600/30">NFT Marketplace</Badge>
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
          <h1 className="text-3xl font-bold mb-4">NFT Marketplace</h1>
          <p className="text-gray-400 mb-6">
            Discover exclusive music experiences and collectibles from your favorite artists
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search NFTs, artists, or collections..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2">
            {["All", "Music", "Art", "Experiences", "Collectibles", "Rare", "New"].map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-purple-600 hover:border-purple-600 cursor-pointer"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45,231 MCC</div>
              <p className="text-xs text-green-500">+12.5% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Floor Price</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">50 MCC</div>
              <p className="text-xs text-yellow-500">Lowest available</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active NFTs</CardTitle>
              <Crown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,234</div>
              <p className="text-xs text-purple-500">Currently listed</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Artists</CardTitle>
              <Music className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">156</div>
              <p className="text-xs text-blue-500">Creating NFTs</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured NFT */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured NFT</h2>
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600/30">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <Badge className="mb-2 bg-yellow-600/20 text-yellow-300 border-yellow-600/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Legendary
                  </Badge>
                  <h3 className="text-2xl font-bold text-white mb-2">Exclusive Album Preview</h3>
                  <p className="text-gray-300 mb-4">
                    Be among the first 100 people to hear Burna Boy's upcoming album before its official release
                  </p>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Eye className="h-4 w-4" />
                      <span>5.2K views</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Heart className="h-4 w-4" />
                      <span>892 likes</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-yellow-400">2,500 MCC</div>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Zap className="h-4 w-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt="Featured NFT"
                    className="w-64 h-64 rounded-lg object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NFT Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Explore NFTs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <Card
                key={nft.id}
                className="bg-gray-800 border-gray-700 hover:border-purple-600/50 transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <img
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.title}
                      className="w-full h-48 rounded-lg object-cover"
                    />
                    <Badge className={`absolute top-2 right-2 ${getRarityColor(nft.rarity)}`}>{nft.rarity}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {nft.title}
                    </h3>
                    <p className="text-sm text-gray-400">by {nft.artistName}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{nft.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{nft.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{nft.likes}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-lg font-bold text-yellow-400">{nft.price} MCC</div>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={nft.status === "Sold Out"}
                      >
                        {nft.status === "Sold Out" ? "Sold Out" : "Buy"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Create NFT CTA */}
        <Card className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600">
          <CardContent className="p-8 text-center">
            <Crown className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Create Your Own NFT</h3>
            <p className="text-gray-400 mb-6">
              Turn your music into exclusive digital collectibles and connect with your fans in new ways
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Link href="/dashboard">Start Creating</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
