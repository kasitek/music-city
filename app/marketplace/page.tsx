"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Music, Search, Coins, Crown, Zap, Eye, Heart, Filter, TrendingUp } from 'lucide-react'
import Link from "next/link"
import { listNFTs } from "@/lib/ic/backend"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"

export default function NFTMarketplace() {
  const [nfts, setNfts] = useState<any[]>([])

  useEffect(() => {
    // Load NFTs from IC backend
    const loadNFTs = async () => {
      try {
        const icNFTs = await listNFTs()
        setNfts(icNFTs || [])
      } catch (e) {
        console.error('Failed to load NFTs:', e)
        setNfts([])
      }
    }
    loadNFTs()
  }, [])

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary":
        return "bg-yellow-600/20 text-yellow-300 border-yellow-600/30"
      case "rare":
        return "bg-purple-600/20 text-purple-300 border-purple-600/30"
      case "epic":
        return "bg-blue-600/20 text-blue-300 border-blue-600/30"
      case "common":
        return "bg-gray-600/20 text-gray-300 border-gray-600/30"
      default:
        return "bg-gray-600/20 text-gray-300 border-gray-600/30"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <Navigation currentPage="marketplace" />

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

        {/* Stats Section - Real Data */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {nfts.reduce((sum, nft) => sum + Number(nft.price), 0).toLocaleString()} MCC
              </div>
              <p className="text-xs text-green-500">Live from IC backend</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Floor Price</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {nfts.length > 0 ? Math.min(...nfts.map(nft => Number(nft.price))) : 0} MCC
              </div>
              <p className="text-xs text-yellow-500">Lowest available</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active NFTs</CardTitle>
              <Crown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{nfts.filter(nft => !nft.owner).length}</div>
              <p className="text-xs text-purple-500">Currently listed</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Artists</CardTitle>
              <Music className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Set(nfts.map(nft => nft.artist)).size}
              </div>
              <p className="text-xs text-blue-500">Creating NFTs</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured NFT - Real Data */}
        {nfts.length > 0 && (() => {
          // Find the most expensive NFT to feature
          const featuredNFT = nfts.reduce((prev, current) => 
            (Number(prev.price) > Number(current.price)) ? prev : current
          )
          
          return (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Featured NFT</h2>
              <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600/30">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <Badge className={`mb-2 ${getRarityColor(featuredNFT.rarity?.legendary ? 'legendary' : featuredNFT.rarity?.epic ? 'epic' : featuredNFT.rarity?.rare ? 'rare' : 'common')}`}>
                        <Crown className="h-3 w-3 mr-1" />
                        {featuredNFT.rarity?.legendary ? 'Legendary' : featuredNFT.rarity?.epic ? 'Epic' : featuredNFT.rarity?.rare ? 'Rare' : 'Common'}
                      </Badge>
                      <h3 className="text-2xl font-bold text-white mb-2">{featuredNFT.title}</h3>
                      <p className="text-gray-300 mb-4">
                        {featuredNFT.description}
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="text-sm text-gray-400">
                          Live from IC blockchain
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-yellow-400">{featuredNFT.price} MCC</div>
                        <Button className="bg-purple-600 hover:bg-purple-700" disabled={featuredNFT.owner}>
                          <Zap className="h-4 w-4 mr-2" />
                          {featuredNFT.owner ? 'Sold' : 'Buy Now'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={featuredNFT.image || "/placeholder.svg?height=300&width=300"}
                        alt={featuredNFT.title}
                        className="w-64 h-64 rounded-lg object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

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
                    <Badge className={`absolute top-2 right-2 ${getRarityColor(nft.rarity)}`}>
                      {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {nft.title}
                    </h3>
                    <p className="text-sm text-gray-400">by {nft.artist}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{nft.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>1.2K</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>89</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-lg font-bold text-yellow-400">{nft.price} MCC</div>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={nft.owner}
                      >
                        {nft.owner ? "Sold" : "Buy"}
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
