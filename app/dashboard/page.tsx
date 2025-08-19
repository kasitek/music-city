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
import { mockDB } from "@/lib/mock-database"
import { Navigation } from "@/components/navigation"
import { createTrack, setTrackAssets } from "@/lib/ic/backend"
import { createAsset as createStorageAsset, uploadBlobToBucket } from "@/lib/ic/storage"

export default function ArtistDashboard() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const router = useRouter()
  // Upload form state
  const [title, setTitle] = useState("")
  const [artistName, setArtistName] = useState("")
  const [genre, setGenre] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string>("")

  useEffect(() => {
    // Check authentication and onboarding
    const walletConnected = localStorage.getItem("walletConnected")
    const onboardingComplete = localStorage.getItem("onboardingComplete")

    if (!walletConnected) {
      router.push("/auth")
      return
    }

    if (!onboardingComplete) {
      router.push("/onboarding")
      return
    }

    // Initialize database
    mockDB.initializeDatabase()

    // Get current user from database
    const currentUser = mockDB.getCurrentUser()
    if (currentUser) {
      setUserProfile(currentUser)
      setWalletAddress(currentUser.walletAddress)
    } else {
      // Fallback to localStorage if database user not found
      const profileData = localStorage.getItem("userProfile")
      if (profileData) {
        setUserProfile(JSON.parse(profileData))
      }

      const address = localStorage.getItem("walletAddress")
      if (address) {
        setWalletAddress(address)
      }
    }
  }, [router])

  const getUserStats = () => {
    if (!userProfile) return { earnings: 0, streams: 0, followers: 0, tokens: 0 }

    if (userProfile.userType === "artist") {
      // Calculate earnings from transactions
      const userTransactions = mockDB.getUserTransactions(userProfile.id)
      const earnings = userTransactions
        .filter(t => t.toUser === userProfile.id && (t.type === "royalty" || t.type === "tip"))
        .reduce((sum, t) => sum + t.amount, 0)

      // Calculate total streams from tracks
      const userTracks = mockDB.getTracksByArtist(userProfile.id)
      const streams = userTracks.reduce((sum, track) => sum + track.plays, 0)

      return {
        earnings: earnings,
        streams: streams,
        followers: userProfile.followers || 0,
        tokens: Math.floor(earnings * 10), // Mock MCC tokens conversion
      }
    }

    return {
      earnings: 0,
      streams: 0,
      followers: userProfile.followers || 0,
      tokens: 1247, // Mock tokens for fans
    }
  }

  const getUserTracks = () => {
    if (!userProfile || userProfile.userType !== "artist") return []
    const tracks = mockDB.getTracksByArtist(userProfile.id)
    
    // Add earnings calculation for each track
    return tracks.map(track => {
      const trackTransactions = mockDB.getUserTransactions(userProfile.id)
        .filter(t => t.trackId === track.id && t.type === "royalty")
      const earnings = trackTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      return {
        ...track,
        earnings: earnings,
        streams: track.plays // Use plays as streams
      }
    })
  }

  const getUserTransactions = () => {
    if (!userProfile) return []
    const transactions = mockDB.getUserTransactions(userProfile.id)
    
    // Format transactions for display
    return transactions
      .filter(t => t.toUser === userProfile.id) // Only incoming transactions for earnings
      .slice(0, 3) // Get latest 3
      .map(t => ({
        ...t,
        description: getTransactionDescription(t),
        date: new Date(t.timestamp).toLocaleDateString()
      }))
  }

  const getTransactionDescription = (transaction: any) => {
    switch (transaction.type) {
      case "royalty":
        return "Stream royalty payment"
      case "tip":
        return "Fan tip received"
      case "nft_purchase":
        return "NFT sale"
      default:
        return "Payment received"
    }
  }

  const stats = getUserStats()
  const userTracks = getUserTracks()
  const userTransactions = getUserTransactions()

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
      <Navigation currentPage="dashboard" />

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
              <div className="text-2xl font-bold text-white">${stats.earnings.toFixed(2)}</div>
              <p className="text-xs text-green-500">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Streams</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.streams.toLocaleString()}</div>
              <p className="text-xs text-blue-500">+8.2% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Followers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.followers.toLocaleString()}</div>
              <p className="text-xs text-purple-500">+15 new this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">MCC Tokens</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.tokens.toLocaleString()}</div>
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
                  {userTracks.length > 0 ? (
                    userTracks.map((track, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Music className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{track.title}</div>
                            <div className="text-sm text-gray-400">{track.streams.toLocaleString()} streams</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-400">${track.earnings.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">Total earned</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tracks uploaded yet</p>
                      <p className="text-sm">Upload your first track to get started!</p>
                    </div>
                  )}
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
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
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
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
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
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
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
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-white mb-2">Drop your audio file here</div>
                  <div className="text-gray-400 mb-4">or click to browse (MP3, WAV, FLAC)</div>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setFile(f || null)
                      }}
                    />
                    <Button type="button" className="bg-purple-600 hover:bg-purple-700">
                      {file ? `Selected: ${file.name}` : "Choose File"}
                    </Button>
                  </label>
                  {uploadMessage && (
                    <div className="mt-3 text-sm text-gray-300">{uploadMessage}</div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
                    Save as Draft
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={uploading}
                    onClick={async () => {
                      setUploadMessage("")
                      if (!file) { setUploadMessage("Please select an audio file."); return }
                      if (!title) { setUploadMessage("Please enter a track title."); return }
                      try {
                        setUploading(true)
                        // 1) Create track in backend (placeholder fields for now)
                        const resultTrack = await createTrack({
                          title,
                          duration: "0:00",
                          genre: genre || "",
                          coverImage: "",
                          audioUrl: "",
                          price: 0,
                          releaseDate: new Date().toISOString().slice(0, 10),
                          description: description || "",
                        })
                        if ('err' in resultTrack) { throw new Error(resultTrack.err) }
                        const createdTrack = (resultTrack as any).ok
                        const trackId: bigint = createdTrack.id

                        // 2) Create storage asset for audio
                        const ext = file.name.includes('.') ? file.name.split('.').pop() || '' : ''
                        const resCreate = await createStorageAsset({
                          mediaType: { audio: null },
                          ext,
                          size: file.size,
                          contentType: file.type || 'application/octet-stream',
                        })
                        if ('err' in resCreate) { throw new Error(resCreate.err) }
                        const tuple = (resCreate as any).ok as [bigint, any]
                        const assetId = tuple[0]
                        const bucketPrincipal = tuple[1]
                        let bucketIdStr: string
                        try {
                          bucketIdStr = typeof bucketPrincipal === 'string' ? bucketPrincipal : bucketPrincipal.toText()
                        } catch {
                          bucketIdStr = String(bucketPrincipal)
                        }

                        // 3) Upload blob to bucket
                        const arrayBuf = await file.arrayBuffer()
                        const data = new Uint8Array(arrayBuf)
                        const resUpload = await uploadBlobToBucket(bucketIdStr, assetId as any, data, file.type || 'application/octet-stream')
                        if ('err' in resUpload) { throw new Error(resUpload.err) }

                        // 4) Link asset to track
                        const resSet = await setTrackAssets({ trackId: trackId as any, audioAssetId: assetId as any })
                        if ('err' in resSet) { throw new Error(resSet.err) }

                        setUploadMessage("Track published and audio uploaded successfully.")
                        // Reset minimal fields
                        setFile(null)
                        setTitle("")
                        setArtistName("")
                        setGenre("")
                        setDescription("")
                      } catch (e: any) {
                        setUploadMessage(`Upload failed: ${e?.message || e}`)
                      } finally {
                        setUploading(false)
                      }
                    }}
                  >
                    {uploading ? 'Publishing…' : 'Publish Track'}
                  </Button>
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
                      {userTransactions.length > 0 ? (
                        userTransactions.map((transaction, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                            <div>
                              <div className="font-medium text-white">{transaction.description}</div>
                              <div className="text-sm text-gray-400">{transaction.date}</div>
                            </div>
                            <div className="text-green-400 font-medium">${transaction.amount.toFixed(2)}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions yet</p>
                        </div>
                      )}
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
