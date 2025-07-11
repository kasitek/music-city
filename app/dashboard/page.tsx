"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Music, Upload, DollarSign, Users, Play, Coins } from "lucide-react"
import Link from "next/link"

export default function ArtistDashboard() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    // Check authentication and onboarding
    const walletConnected = localStorage.getItem("walletConnected")
    const onboardingComplete = localStorage.getItem("onboardingComplete")
    const profileData = localStorage.getItem("userProfile")

    if (!walletConnected) {
      router.push("/auth")
      return
    }

    if (!onboardingComplete) {
      router.push("/onboarding")
      return
    }

    if (profileData) {
      setUserProfile(JSON.parse(profileData))
    }

    const address = localStorage.getItem("walletAddress")
    if (address) {
      setWalletAddress(address)
    }
  }, [router])

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
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
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">Artist Dashboard</Badge>
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile.displayName}!</h1>
          <p className="text-gray-400">Manage your music, track earnings, and connect with fans</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$2,847.50</div>
              <p className="text-xs text-green-500">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Streams</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45,231</div>
              <p className="text-xs text-blue-500">+8.2% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Followers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,234</div>
              <p className="text-xs text-purple-500">+15 new this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">MCC Tokens</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">5,847</div>
              <p className="text-xs text-yellow-500">Available for withdrawal</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600">
              Upload Music
            </TabsTrigger>
            <TabsTrigger value="royalties" className="data-[state=active]:bg-purple-600">
              Royalties
            </TabsTrigger>
            <TabsTrigger value="nfts" className="data-[state=active]:bg-purple-600">
              NFTs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Tracks */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Your Recent Tracks</CardTitle>
                  <CardDescription className="text-gray-400">Latest uploads and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Afrobeat Dreams", streams: "12.5K", earnings: "$125.50" },
                    { title: "Lagos Nights", streams: "8.2K", earnings: "$82.00" },
                    { title: "Rhythm of the Heart", streams: "15.1K", earnings: "$151.00" },
                  ].map((track, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Music className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{track.title}</div>
                          <div className="text-sm text-gray-400">{track.streams} streams</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-400">{track.earnings}</div>
                        <div className="text-sm text-gray-400">This month</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Analytics</CardTitle>
                  <CardDescription className="text-gray-400">Your music's reach and engagement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Stream Growth</span>
                      <span className="text-green-400">+23%</span>
                    </div>
                    <Progress value={75} className="bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fan Engagement</span>
                      <span className="text-blue-400">+18%</span>
                    </div>
                    <Progress value={60} className="bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Revenue Growth</span>
                      <span className="text-purple-400">+31%</span>
                    </div>
                    <Progress value={85} className="bg-gray-700" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Upload New Track</CardTitle>
                <CardDescription className="text-gray-400">
                  Share your music with the world and start earning instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-gray-300">
                        Track Title
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter track title"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="artist" className="text-gray-300">
                        Artist Name
                      </Label>
                      <Input
                        id="artist"
                        placeholder="Your artist name"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="genre" className="text-gray-300">
                        Genre
                      </Label>
                      <Input
                        id="genre"
                        placeholder="e.g., Afrobeat, Hip-hop"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description" className="text-gray-300">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Tell fans about your track..."
                        className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-white mb-2">Drop your audio file here</div>
                  <div className="text-gray-400 mb-4">or click to browse (MP3, WAV, FLAC)</div>
                  <Button className="bg-purple-600 hover:bg-purple-700">Choose File</Button>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
                    Save as Draft
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700">Publish Track</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="royalties" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Royalty Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Track your earnings and manage payouts transparently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Earnings Summary */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">$2,847.50</div>
                      <div className="text-sm text-gray-400">Total Earned</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">$1,234.20</div>
                      <div className="text-sm text-gray-400">This Month</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">$847.30</div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                      {[
                        { date: "2024-01-15", track: "Afrobeat Dreams", amount: "$12.50", streams: "125" },
                        { date: "2024-01-14", track: "Lagos Nights", amount: "$8.20", streams: "82" },
                        { date: "2024-01-13", track: "Rhythm of the Heart", amount: "$15.10", streams: "151" },
                      ].map((transaction, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div>
                            <div className="font-medium text-white">{transaction.track}</div>
                            <div className="text-sm text-gray-400">
                              {transaction.date} • {transaction.streams} streams
                            </div>
                          </div>
                          <div className="text-green-400 font-medium">{transaction.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Withdraw Earnings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">NFT Collection</CardTitle>
                <CardDescription className="text-gray-400">
                  Create and manage exclusive music NFTs for your fans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Create New NFT</h3>
                    <div className="space-y-4">
                      <Input placeholder="NFT Title" className="bg-gray-700 border-gray-600 text-white" />
                      <Input placeholder="Price (MCC Tokens)" className="bg-gray-700 border-gray-600 text-white" />
                      <Textarea
                        placeholder="NFT Description and exclusive content details..."
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">Mint NFT</Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Your NFTs</h3>
                    <div className="space-y-3">
                      {[
                        { title: "Exclusive Studio Session", price: "500 MCC", status: "Active" },
                        { title: "Limited Edition Cover Art", price: "250 MCC", status: "Sold Out" },
                      ].map((nft, i) => (
                        <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-white">{nft.title}</div>
                              <div className="text-sm text-gray-400">{nft.price}</div>
                            </div>
                            <Badge
                              className={
                                nft.status === "Active"
                                  ? "bg-green-600/20 text-green-300"
                                  : "bg-red-600/20 text-red-300"
                              }
                            >
                              {nft.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
