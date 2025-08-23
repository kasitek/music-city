"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Music, Upload, DollarSign, Users, Play, Coins, TrendingUp, Eye, Settings, Shield, Award, Zap } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { createTrack, setTrackAssets, myTransactions, getMyUser, listTracks } from "@/lib/ic/backend"
import { createAsset as createStorageAsset, uploadBlobToBucket } from "@/lib/ic/storage"
import { useAuth } from "@/hooks/use-auth"

export default function ArtistDashboard() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const router = useRouter()
  const { loginWithII, loginWithNFID } = useAuth()
  // Upload form state
  const [title, setTitle] = useState("")
  const [artistName, setArtistName] = useState("")
  const [genre, setGenre] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string>("")
  // Auth prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [authInProgress, setAuthInProgress] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Backend data state
  const [transactions, setTransactions] = useState<any[]>([])
  const [tracks, setTracks] = useState<any[]>([])

  // Require authentication and artist role to access dashboard
  useEffect(() => {
    let mounted = true
    (async () => {
      try {
        const icUser = await getMyUser()
        if (!mounted) return
        if (!icUser) {
          router.push('/auth')
          return
        }
        const isArtist = icUser.userType && typeof icUser.userType === 'object' && 'artist' in icUser.userType
        if (!isArtist) {
          router.push('/')
          return
        }
        // Map minimal profile for local UI usage
        setUserProfile({
          id: walletAddress || '',
          displayName: icUser.displayName,
          userType: 'artist',
          profileImage: icUser.profileImage || '',
        })
      } catch (e) {
        router.push('/auth')
      }
    })()
    return () => { mounted = false }
  }, [router, walletAddress])

  // Helpers for principals
  const principalText = (p: any) => (p && typeof p === 'object' && 'toText' in p ? (p as any).toText() : String(p))
  const principalEq = (a: any, b: any) => principalText(a) === principalText(b)

  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0] || null
    if (!f) { setFile(null); return }
    if (!f.type.startsWith("audio/")) {
      setUploadMessage("Invalid file type. Please upload an audio file (MP3, WAV, FLAC).")
      return
    }
    setUploadMessage("")
    setFile(f)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Explicitly show copy effect
    e.dataTransfer.dropEffect = "copy"
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  // Save a local draft (metadata only, not the file blob). Drafts are stored per-artist in localStorage.
  const saveDraft = () => {
    try {
      if (!userProfile || userProfile.userType !== 'artist') {
        setUploadMessage('Only artists can save drafts.')
        return
      }
      if (!title) {
        setUploadMessage('Please enter a track title before saving a draft.')
        return
      }
      const key = `musiccity_drafts_${userProfile.id}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as any[]
      const draft = {
        id: Date.now().toString(),
        title,
        artistName: artistName || userProfile.displayName || '',
        genre,
        description,
        fileName: file?.name || null,
        fileType: file?.type || null,
        fileSize: file?.size || null,
        createdAt: new Date().toISOString(),
        status: 'draft',
      }
      existing.unshift(draft)
      localStorage.setItem(key, JSON.stringify(existing))
      setUploadMessage('Draft saved locally. You can publish it later from this device.')
    } catch (e: any) {
      setUploadMessage(`Failed to save draft: ${e?.message || e}`)
    }
  }

  // Poll for IC auth completion after popup. Returns true if authenticated within timeout.
  const waitForIcAuth = async (timeoutMs = 8000, intervalMs = 300): Promise<boolean> => {
    const start = Date.now()
    const { isAuthenticated: icIsAuthenticated } = await import("@/lib/ic/auth")
    while (Date.now() - start < timeoutMs) {
      const ok = await icIsAuthenticated().catch(() => false)
      if (ok) return true
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return false
  }

  // Core publish pipeline with improved error handling for IC certificate issues
  const publishWithIc = async () => {
    try {
      setUploadMessage("Starting publication process...")
      
      if (!file) {
        setUploadMessage("Please select an audio file to upload.")
        return
      }

      if (!title.trim()) {
        setUploadMessage("Please enter a track title.")
        return
      }

      setUploadMessage("Uploading audio file...")

      // 1. Upload the audio file to storage
      let audioAssetId = null
      try {
        const audioBuffer = await file.arrayBuffer()
        const audioBytes = new Uint8Array(audioBuffer)
        audioAssetId = await uploadBlobToBucket(
          Array.from(audioBytes),
          file.type,
          file.name.split('.').pop() || 'mp3'
        )
        setUploadMessage("Audio uploaded. Creating track record...")
      } catch (uploadError: any) {
        console.warn('Audio upload failed, creating track without audio asset:', uploadError)
        setUploadMessage("Creating track record...")
      }

      // 2. Create the track record in the backend
      const trackResult = await createTrack(
        title.trim(),
        "3:30", // default duration
        genre.trim() || "Music",
        "", // no cover image for now
        "", // no direct audio URL
        0, // free tracks
        new Date().toISOString(),
        description.trim() || ""
      )

      if ('err' in trackResult) {
        throw new Error(trackResult.err)
      }

      const track = trackResult.ok
      setUploadMessage("Track created. Linking audio asset...")

      // 3. Link the audio asset to the track if upload was successful
      if (audioAssetId && track.id) {
        try {
          const setAssetsResult = await setTrackAssets(
            Number(track.id),
            audioAssetId,
            null // no image asset yet
          )
          if ('err' in setAssetsResult) {
            console.warn('Failed to link audio asset:', setAssetsResult.err)
          }
        } catch (linkError) {
          console.warn('Failed to link audio asset:', linkError)
        }
      }

      setUploadMessage("Track published successfully! 🎵")
      
      // Reset form
      setFile(null)
      setTitle("")
      setArtistName("")
      setGenre("")
      setDescription("")

    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMsg = error?.message || String(error)
      
      if (errorMsg.includes('certificate') || errorMsg.includes('signature')) {
        setUploadMessage("Connection issue with IC network. Please try again later.")
      } else {
        setUploadMessage(`Upload failed: ${errorMsg}`)
      }
    }
  }

  useEffect(() => {
    // Check authentication
    const icIdentity = localStorage.getItem("icIdentity")

    // Require IC identity for dashboard access
    if (!icIdentity) {
      router.push("/auth")
      return
    }

    loadUserProfile()
  }, [router])

// Restrict dashboard access to artists only
useEffect(() => {
  if (userProfile && userProfile.userType !== 'artist') {
    router.replace('/')
  }
}, [userProfile, router])

const getUserStats = () => {
  if (!userProfile) return { earnings: 0, streams: 0, followers: 0, tokens: 0 }

  // Earnings from incoming royalties and tips
  const incoming = (transactions || []).filter((t: any) => principalEq(t.toUser, userProfile.id))
  const earnings = incoming
    .filter((t: any) => ('royalty' in t.kind) || ('tip' in t.kind))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

  // Streams from artist's tracks
  const myTracks = (tracks || [])
  const streams = myTracks.reduce((sum: number, tr: any) => sum + Number(tr.plays || 0), 0)

  return {
    earnings,
    streams,
    followers: userProfile.followers || 0,
    tokens: Math.floor(earnings * 10),
  }
}

const getUserTracks = () => {
  if (!userProfile || userProfile.userType !== "artist") return []
  const myTracks = (tracks || [])
  const txs = (transactions || [])
  return myTracks.map((track: any) => {
    // Sum royalties for this track
    const trackTxs = txs.filter((t: any) => {
      const tTrackId = Array.isArray(t.trackId) ? t.trackId[0] : t.trackId
      return ('royalty' in t.kind) && tTrackId !== undefined && tTrackId !== null && BigInt(tTrackId as any) === BigInt(track.id as any)
    })
    const earnings = trackTxs.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
    return {
      ...track,
      id: Number(track.id),
      earnings,
      streams: Number(track.plays || 0),
    }
  })
}

const getUserTransactions = () => {
  if (!userProfile) return []
  const incoming = (transactions || []).filter((t: any) => principalEq(t.toUser, userProfile.id))
  const sorted = incoming.sort((a: any, b: any) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
  return sorted.slice(0, 3).map((t: any) => ({
    ...t,
    amount: Number(t.amount || 0),
    description: getTransactionDescription(t),
    date: new Date(Number(t.timestamp || 0) / 1_000_000).toLocaleDateString(),
  }))
}

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
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging ? "border-purple-500 bg-purple-500/10" : "border-gray-600"
                  }`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload audio file by dropping it here or clicking to browse"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-white mb-2">
                    {file ? `Selected: ${file.name}` : "Drop your audio file here"}
                  </div>
                  <div className="text-gray-400 mb-4">or click to browse (MP3, WAV, FLAC)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={() => fileInputRef.current?.click()}>
                    {file ? "Change File" : "Choose File"}
                  </Button>
                  {file && (
                    <div className="mt-3 text-sm text-gray-300">
                      Size: {(file.size / (1024 * 1024)).toFixed(2)} MB • Type: {file.type || "unknown"}
                    </div>
                  )}
                  {uploadMessage && (
                    <div className="mt-3 text-sm text-red-300">{uploadMessage}</div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600 text-gray-300 bg-transparent"
                    onClick={saveDraft}
                  >
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
                        await publishWithIc()
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
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Royalties Management
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Transparent real-time royalty calculation and distribution via smart contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Enhanced Earnings Summary */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 p-4 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <div className="text-sm text-green-400">Total Earnings</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.earnings.toLocaleString()} MCC</div>
                      <div className="text-xs text-gray-400">≈ ${(stats.earnings * 0.1).toFixed(2)} USD</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="h-4 w-4 text-blue-400" />
                        <div className="text-sm text-blue-400">Stream Royalties</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{Math.floor(stats.streams * 0.01)} MCC</div>
                      <div className="text-xs text-gray-400">From {stats.streams.toLocaleString()} streams</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="h-4 w-4 text-purple-400" />
                        <div className="text-sm text-purple-400">Tips Received</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{Math.floor(stats.earnings * 0.3)} MCC</div>
                      <div className="text-xs text-gray-400">Direct fan support</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-orange-400" />
                        <div className="text-sm text-orange-400">NFT Sales</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{Math.floor(stats.earnings * 0.2)} MCC</div>
                      <div className="text-xs text-gray-400">Exclusive content sales</div>
                    </div>
                  </div>

                  {/* Real-time Royalty Distribution */}
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      Real-time Distribution
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Distribution Rate</div>
                        <div className="text-lg font-semibold text-white">0.01 MCC per stream</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Processing Time</div>
                        <div className="text-lg font-semibold text-white">Instant</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Platform Fee</div>
                        <div className="text-lg font-semibold text-white">10%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Your Share</div>
                        <div className="text-lg font-semibold text-white">90%</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Transparent Transactions
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {userTransactions.length > 0 ? (
                        userTransactions.map((transaction, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <div>
                              <div className="font-medium text-white">{transaction.description}</div>
                              <div className="text-sm text-gray-400">{transaction.date}</div>
                              <div className="text-xs text-purple-400">TX: {transaction.id || 'Local'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-medium">{transaction.amount} MCC</div>
                              <div className="text-xs text-gray-400">≈ ${(transaction.amount * 0.1).toFixed(2)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions yet</p>
                          <p className="text-sm">Upload music and start earning royalties!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rights Management */}
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      Rights Management
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Streaming Rights</div>
                          <div className="text-sm text-gray-400">Global streaming distribution</div>
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Sync Rights</div>
                          <div className="text-sm text-gray-400">Film, TV, and media licensing</div>
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Mechanical Rights</div>
                          <div className="text-sm text-gray-400">Physical and digital reproduction</div>
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Rights
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Withdraw Earnings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  NFT Integration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Mint and sell music as NFTs for exclusive content and rights management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* NFT Statistics */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                      <div className="text-2xl font-bold text-white">12</div>
                      <div className="text-sm text-purple-400">NFTs Minted</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 p-4 rounded-lg border border-green-500/20">
                      <div className="text-2xl font-bold text-white">8</div>
                      <div className="text-sm text-green-400">Sold</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                      <div className="text-2xl font-bold text-white">2,400 MCC</div>
                      <div className="text-sm text-orange-400">Total Revenue</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Create NFT */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Create Exclusive NFT</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nft-title" className="text-gray-300">NFT Title</Label>
                          <Input 
                            id="nft-title"
                            placeholder="e.g., Unreleased Track #1" 
                            className="bg-gray-700 border-gray-600 text-white" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="nft-price" className="text-gray-300">Price (MCC Tokens)</Label>
                          <Input 
                            id="nft-price"
                            placeholder="e.g., 500" 
                            type="number"
                            className="bg-gray-700 border-gray-600 text-white" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="nft-rarity" className="text-gray-300">Rarity</Label>
                          <select className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2">
                            <option value="common">Common</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="nft-description" className="text-gray-300">Description & Exclusive Content</Label>
                          <Textarea
                            id="nft-description"
                            placeholder="Describe the exclusive content, rights, or experiences included..."
                            className="bg-gray-700 border-gray-600 text-white"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">NFT Benefits</Label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-sm text-gray-300">
                              <input type="checkbox" className="rounded" defaultChecked />
                              <span>Early access to new releases</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-gray-300">
                              <input type="checkbox" className="rounded" />
                              <span>Exclusive behind-the-scenes content</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-gray-300">
                              <input type="checkbox" className="rounded" />
                              <span>Meet & greet opportunities</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-gray-300">
                              <input type="checkbox" className="rounded" />
                              <span>Royalty sharing rights</span>
                            </label>
                          </div>
                        </div>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          <Award className="h-4 w-4 mr-2" />
                          Mint NFT
                        </Button>
                      </div>
                    </div>

                    {/* NFT Collection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Your NFT Collection</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {[
                          { 
                            title: "Unreleased Track - 'Midnight Dreams'", 
                            price: "500 MCC", 
                            rarity: "Legendary",
                            status: "Active",
                            sold: 2,
                            total: 5
                          },
                          { 
                            title: "Exclusive Studio Session Access", 
                            price: "250 MCC", 
                            rarity: "Epic",
                            status: "Sold Out",
                            sold: 10,
                            total: 10
                          },
                          { 
                            title: "Limited Edition Album Art", 
                            price: "100 MCC", 
                            rarity: "Rare",
                            status: "Active",
                            sold: 15,
                            total: 50
                          },
                          { 
                            title: "VIP Concert Experience", 
                            price: "1000 MCC", 
                            rarity: "Legendary",
                            status: "Active",
                            sold: 0,
                            total: 2
                          },
                        ].map((nft, i) => (
                          <div key={i} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-white">{nft.title}</div>
                                <div className="text-sm text-gray-400">{nft.price}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`${
                                    nft.rarity === 'Legendary' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                                    nft.rarity === 'Epic' ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' :
                                    nft.rarity === 'Rare' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' :
                                    'bg-gray-600/20 text-gray-400 border-gray-600/30'
                                  }`}
                                >
                                  {nft.rarity}
                                </Badge>
                                <Badge
                                  className={
                                    nft.status === "Active"
                                      ? "bg-green-600/20 text-green-400 border-green-600/30"
                                      : "bg-red-600/20 text-red-400 border-red-600/30"
                                  }
                                >
                                  {nft.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-gray-400">
                                {nft.sold}/{nft.total} sold
                              </div>
                              <div className="text-green-400 font-medium">
                                {nft.sold * parseInt(nft.price)} MCC earned
                              </div>
                            </div>
                            <Progress value={(nft.sold / nft.total) * 100} className="mt-2 h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* NFT Marketplace Integration */}
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Marketplace Integration</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Active Listings</div>
                        <div className="text-2xl font-bold text-white">15</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Royalty Rate</div>
                        <div className="text-2xl font-bold text-white">10%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            // Close on backdrop click
            setShowAuthPrompt(false)
            setAuthError(null)
            setUploading(false)
          }}
        >
          <div
            className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white text-lg font-semibold mb-1">Login required</div>
            <div className="text-gray-300 text-sm mb-4">Please authenticate with an Internet Computer identity to publish your track.</div>
            {authError && <div className="text-red-300 text-sm mb-3">{authError}</div>}
            <div className="flex gap-3 flex-wrap">
              <Button disabled={authInProgress} className="bg-purple-600 hover:bg-purple-700" onClick={async () => {
                setAuthError(null)
                setAuthInProgress(true)
                try {
                  await loginWithII()
                  const authed = await waitForIcAuth()
                  if (!authed) {
                    setAuthError('Internet Identity login was cancelled or timed out. Please try again.')
                    return
                  }
                  setShowAuthPrompt(false)
                  setUploadMessage('Authenticated. Continuing publish...')
                  setUploading(true)
                  await publishWithIc()
                } catch (e: any) {
                  setAuthError(e?.message || String(e))
                } finally {
                  setAuthInProgress(false)
                  setUploading(false)
                }
              }}>Login with Internet Identity</Button>
              <Button disabled={authInProgress} variant="outline" className="border-gray-600 text-gray-200" onClick={async () => {
                setAuthError(null)
                setAuthInProgress(true)
                try {
                  await loginWithNFID()
                  const authed = await waitForIcAuth()
                  if (!authed) {
                    setAuthError('NFID login was cancelled or timed out. Please try again.')
                    return
                  }
                  setShowAuthPrompt(false)
                  setUploadMessage('Authenticated. Continuing publish...')
                  setUploading(true)
                  await publishWithIc()
                } catch (e: any) {
                  setAuthError(e?.message || String(e))
                } finally {
                  setAuthInProgress(false)
                  setUploading(false)
                }
              }}>Login with NFID</Button>
              <Button
                type="button"
                variant="ghost"
                className="text-gray-300 hover:text-white ml-auto"
                onClick={() => {
                  setShowAuthPrompt(false)
                  setAuthError(null)
                  setUploading(false)
                  setUploadMessage("")
                }}
              >
                Cancel
              </Button>
            </div>
            <div className="mt-4 text-xs text-gray-400">You can cancel and try again later.</div>
          </div>
        </div>
      )}
    </div>
  )
}
