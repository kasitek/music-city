
"use client"



import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Music, Upload, DollarSign, Users, Play, Pause, Coins, TrendingUp, Eye, Settings, Shield, Award, Zap, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { createTrack, setTrackAssets, myTransactions, getMyUser, listTracks, updateTrack, deleteTrack } from "@/lib/ic/backend"
import { createAsset as createStorageAsset, uploadBlobToBucket } from "@/lib/ic/storage"
import { getAssetData, uploadAudioAsset } from "@/lib/ic/storage_client"
import { loginInternetIdentity, loginNFID } from "@/lib/ic/auth"
import { GENRES } from "@/lib/constants"

export default function ArtistDashboard() {
  // Edit modal state (must be inside component)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTrack, setEditTrack] = useState<any>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editGenre, setEditGenre] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editUploading, setEditUploading] = useState(false)
  const [editUploadMessage, setEditUploadMessage] = useState("")
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
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  // Auth prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [authInProgress, setAuthInProgress] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Backend data state
  const [transactions, setTransactions] = useState<any[]>([])
  const [tracks, setTracks] = useState<any[]>([])
  // Audio playback state
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [currentTrack, setCurrentTrack] = useState<any | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [volume, setVolume] = useState<number>(0.7)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch tracks for this artist
  const fetchTracks = async () => {
    try {
      const allTracks = await listTracks();
      // Show ONLY the current artist's tracks in the dashboard using principal match
      if (userProfile && userProfile.id) {
        setTracks(
          allTracks.filter((t: any) => principalEq(t.artist, userProfile.id))
        );
      } else {
        setTracks([]);
      }
    } catch (e) {
      setTracks([]);
    }
  };

  // Require authentication and artist role to access dashboard
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const icUser = await getMyUser()
        if (!mounted) return
        if (!icUser || icUser.length === 0) {
          router.push('/auth')
          return
        }
        const isArtist = icUser[0]?.userType && typeof icUser[0]?.userType === 'object' && 'artist' in icUser[0]?.userType
        if (!isArtist) {
          router.push('/')
          return
        }
        // Map minimal profile for local UI usage (use principal as id)
        setUserProfile({
          id: (icUser[0]?.owner && typeof icUser[0].owner === 'object' && 'toText' in icUser[0].owner)
            ? (icUser[0].owner as any).toText()
            : String(icUser[0]?.owner || ''),
          displayName: icUser[0]?.displayName,
          userType: 'artist',
          profileImage: icUser[0]?.profileImage || '',
        })
        // Tracks will be fetched when userProfile.id is available via effect below
      } catch (e) {
        router.push('/auth')
      }
    })()
    return () => { mounted = false }
  }, [router, walletAddress])

  // Fetch tracks when the artist principal (id) is known
  useEffect(() => {
    if (userProfile?.id) {
      fetchTracks();
    }
  }, [userProfile?.id])

  // Fetch transactions when the artist principal (id) is known
  useEffect(() => {
    const loadTx = async () => {
      try {
        if (!userProfile?.id) return
        const res = await myTransactions()
        setTransactions(Array.isArray(res) ? res : [])
      } catch {
        setTransactions([])
      }
    }
    loadTx()
  }, [userProfile?.id])

  // Helpers for principals
  const principalText = (p: any) => (p && typeof p === 'object' && 'toText' in p ? (p as any).toText() : String(p))
  const principalEq = (a: any, b: any) => principalText(a) === principalText(b)

  // Build last 30 days analytics series from transactions
  const { streamSeries, engagementSeries, revenueSeries, deltas } = useMemo(() => {
    const days = 30
    const toStartOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x }
    const now = new Date()
    const start = toStartOfDay(new Date(now.getTime() - (days - 1) * 24 * 3600 * 1000))
    const idxForTs = (tsNs: any) => {
      const tsMs = Number(tsNs || 0) / 1_000_000
      const d = toStartOfDay(new Date(tsMs))
      const diff = Math.floor((d.getTime() - start.getTime()) / (24 * 3600 * 1000))
      return diff >= 0 && diff < days ? diff : -1
    }
    const myTrackIds = new Set((tracks || []).map((t: any) => Number(t.id)))
    const streams = Array(days).fill(0)
    const engagement = Array(days).fill(0)
    const revenue = Array(days).fill(0)
    for (const t of (transactions || [])) {
      const dayIdx = idxForTs(t.timestamp)
      if (dayIdx < 0) continue
      // Revenue: incoming to me, kind: royalty or tip
      if (userProfile && principalEq(t.toUser, userProfile.id)) {
        if (t.kind && typeof t.kind === 'object' && (('royalty' in t.kind) || ('tip' in t.kind))) {
          revenue[dayIdx] += Number(t.amount || 0)
        }
        if (t.kind && typeof t.kind === 'object' && ('tip' in t.kind)) {
          engagement[dayIdx] += 1
        }
      }
      // Streams: kind stream on my tracks
      if (t.kind && typeof t.kind === 'object' && ('stream' in t.kind)) {
        const tid = Array.isArray(t.trackId) ? t.trackId[0] : t.trackId
        const n = tid !== undefined && tid !== null ? Number(tid) : NaN
        if (!Number.isNaN(n) && myTrackIds.has(n)) {
          streams[dayIdx] += 1
        }
      }
    }
    const pctDelta = (arr: number[]) => {
      const n = arr.length
      const half = Math.floor(n / 2)
      const prev = arr.slice(0, half).reduce((a, b) => a + b, 0)
      const curr = arr.slice(half).reduce((a, b) => a + b, 0)
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }
    return {
      streamSeries: streams,
      engagementSeries: engagement,
      revenueSeries: revenue,
      deltas: {
        streams: pctDelta(streams),
        engagement: pctDelta(engagement),
        revenue: pctDelta(revenue),
      }
    }
  }, [transactions, tracks, userProfile])

  // Audio helpers
  const stopAudio = () => {
    try { audioRef.current?.pause() } catch {}
    if (audioUrl) { try { URL.revokeObjectURL(audioUrl) } catch {}
    }
    setAudioUrl(null)
    audioRef.current = null
    setPlayingId(null)
    setCurrentTrack(null)
  }

  const playTrackAudio = async (track: any) => {
    // If clicking the same track, toggle pause
    if (playingId === Number(track.id)) {
      stopAudio()
      return
    }
    // Stop previous
    stopAudio()
    // Load from storage bucket if available
    if (!track.audioAssetId) {
      alert("No audio asset linked to this track.")
      return
    }
    try {
      const asset = await getAssetData(BigInt(track.audioAssetId))
      const u8 = asset?.bytes
      if (!u8 || u8.length === 0) {
        alert("Audio not found in storage bucket.")
        return
      }
      const blob = new Blob([u8], { type: asset?.contentType || "audio/mpeg" })
      // Revoke previous URL if any
      if (audioUrl) { try { URL.revokeObjectURL(audioUrl) } catch {} }
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setPlayingId(Number(track.id))
      setCurrentTrack(track)
      // Defer play until audio element binds src
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume
          audioRef.current.play().catch(() => {/* ignore */})
          audioRef.current.onended = () => {
            setPlayingId(null)
            try { URL.revokeObjectURL(url) } catch {}
            setAudioUrl(null)
            audioRef.current = null
            setCurrentTrack(null)
          }
        }
      }, 0)
    } catch (e) {
      console.error('Audio playback error:', e)
      alert('Failed to play audio')
    }
  }

  // Skip helpers within current filtered list
  const getTrackIndex = (id: number) => (tracks || []).findIndex((t: any) => Number(t.id) === Number(id))
  const playByIndex = (idx: number) => {
    const list = tracks || []
    if (idx < 0 || idx >= list.length) return
    playTrackAudio(list[idx])
  }
  const playNext = () => {
    if (playingId == null) return
    const idx = getTrackIndex(playingId)
    if (idx >= 0) playByIndex(idx + 1)
  }
  const playPrev = () => {
    if (playingId == null) return
    const idx = getTrackIndex(playingId)
    if (idx >= 0) playByIndex(idx - 1)
  }

  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0] || null;
    if (!f) { setFile(null); return; }
    // Acceptable extensions and MIME types
    const allowedExts = ["mp3", "wav", "flac", "mp4"];
    const allowedMimes = [
      "audio/mpeg", // mp3
      "audio/wav", "audio/x-wav", // wav
      "audio/flac", "audio/x-flac", // flac
      "audio/x-m4a", "audio/mp4", // m4a/mp4
      "audio/aac", "audio/ogg", "audio/webm", // other common audio
      "video/mp4" // allow mp4 as video too
    ];
    const ext = f.name.split('.').pop()?.toLowerCase() || "";
    if (
      !(f.type.startsWith("audio/") || allowedMimes.includes(f.type)) ||
      !allowedExts.includes(ext)
    ) {
      setUploadMessage("Invalid file type. Please upload an audio file (MP3, WAV, FLAC).")
      return;
    }
    setUploadMessage("");
    setFile(f);
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
      setUploadMessage("Starting publication process...");
      if (!file) {
        setUploadMessage("Please select an audio file to upload.");
        return;
      }
      if (!title.trim()) {
        setUploadMessage("Please enter a track title.");
        return;
      }
      setUploading(true)
      setUploadProgress(0)
      setUploadMessage("Uploading audio file... 0%")

      // 1. Upload via storage index/bucket helper (allocates, chunks, commits)
      let audioAssetId = null as null | bigint;
      try {
        const audioBuffer = await file.arrayBuffer();
        const audioBytes = new Uint8Array(audioBuffer);
        const ext = (file.name.split('.').pop() || '').toLowerCase() || 'mp3'
        setUploadMessage("Uploading audio file...")
        // Note: uploadAudioAsset internally chunks the file and commits in the bucket
        console.log('Starting uploadAudioAsset...')
        const newAssetId = await uploadAudioAsset(audioBytes, file.type || 'audio/mpeg', ext);
        console.log('Upload completed, assetId:', newAssetId)
        
        // Verify bytes are retrievable before proceeding (with retry for timing issues)
        setUploadMessage("Verifying upload...")
        let verify = await getAssetData(newAssetId)
        if (!verify || !verify.bytes || verify.bytes.length === 0) {
          console.log('First verification failed, retrying after delay...')
          await new Promise(r => setTimeout(r, 1000)) // Wait 1 second
          verify = await getAssetData(newAssetId)
          if (!verify || !verify.bytes || verify.bytes.length === 0) {
            console.error('Verification failed twice:', { assetId: newAssetId, verify })
            throw new Error(`Verification failed: asset ${newAssetId} bytes not retrievable after upload and retry`)
          }
        }
        console.log('Verification successful:', { assetId: newAssetId, bytesLength: verify.bytes.length, contentType: verify.contentType })
        audioAssetId = newAssetId
        setUploadProgress(100)
        setUploadMessage("Audio uploaded (100%). Creating track record...")
      } catch (uploadError: any) {
        console.warn('Audio upload failed or verification failed:', uploadError);
        setUploadMessage("Audio upload failed. Please try again.");
        setUploading(false)
        setUploadProgress(0)
        return
      }

      // 2. Create the track record in the backend
      const trackResult = await createTrack({
        title: title.trim(),
        duration: "3:30", // default duration
        genre: genre.trim() || "Music",
        coverImage: "", // no cover image for now
        audioUrl: "", // no direct audio URL
        price: 0, // free tracks
        releaseDate: new Date().toISOString(),
        description: description.trim() || ""
      });
      if ('err' in trackResult) {
        throw new Error(trackResult.err);
      }
      const track = trackResult.ok;
      setUploadMessage("Track created. Linking audio asset...");

      // 3. Link the audio asset to the track if upload was successful
      if (audioAssetId && track.id) {
        try {
          const setAssetsResult = await setTrackAssets({
            trackId: Number(track.id),
            audioAssetId: audioAssetId,
            imageAssetId: null // no image asset yet
          });
          if ('err' in setAssetsResult) {
            console.warn('Failed to link audio asset:', setAssetsResult.err);
          }
        } catch (linkError) {
          console.warn('Failed to link audio asset:', linkError);
        }
      }

  setUploadMessage("Track published successfully! 🎵");
  setUploadProgress(0)
  setUploading(false)
  // Reset form
  setFile(null);
  setTitle("");
  setArtistName("");
  setGenre("");
  setDescription("");
  // Refresh tracks list
  await fetchTracks();
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('certificate') || errorMsg.includes('signature')) {
        setUploadMessage("Connection issue with IC network. Please try again later.");
      } else {
        setUploadMessage(`Upload failed: ${errorMsg}`);
      }
      setUploading(false)
      setUploadProgress(0)
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

    // User profile loading is handled in the first useEffect
  }, [router])

// Restrict dashboard access to artists only
useEffect(() => {
  if (userProfile && userProfile.userType !== 'artist') {
    router.replace('/')
  }
}, [userProfile, router])

const getUserStats = () => {
  if (!userProfile) return { earnings: 0, streams: 0, followers: 0, tokens: 0 }

  // Earnings from backend transactions
  const incoming = (transactions || []).filter((t: any) => principalEq(t.toUser, userProfile.id))
  const earnings = incoming
    .filter((t: any) => ('royalty' in t.kind) || ('tip' in t.kind))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

  // Streams from backend tracks
  const myTracks = (tracks || [])
  const streams = myTracks.reduce((sum: number, tr: any) => sum + Number(tr.plays || 0), 0)

  // Followers from backend userProfile if available
  const followers = userProfile.followers || 0

  // MCC tokens (mock: 10x earnings)
  const tokens = Math.floor(earnings * 10)

  return {
    earnings,
    streams,
    followers,
    tokens,
  }
}

const getUserTracks = () => {
  if (!userProfile || userProfile.userType !== "artist") return []
  const myTracks = (tracks || [])
  const txs = (transactions || [])
  const isRoyalty = (k: any) => {
    if (!k) return false
    return typeof k === 'string' ? k === 'royalty' : (typeof k === 'object' && 'royalty' in k)
  }
  return myTracks.map((track: any) => {
    // Sum royalties for this track
    const trackTxs = txs.filter((t: any) => {
      const tTrackId = Array.isArray(t?.trackId) ? t.trackId[0] : t?.trackId
      return (
        isRoyalty(t?.kind) &&
        tTrackId !== undefined && tTrackId !== null &&
        BigInt(tTrackId as any) === BigInt(track.id as any)
      )
    })
    const earnings = trackTxs.reduce((sum: number, t: any) => sum + Number(t?.amount || 0), 0)
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

const getTransactionDescription = (transaction: any): string => {
  if (transaction.kind && typeof transaction.kind === 'object') {
    if ('royalty' in transaction.kind) {
      return `Royalty from track ${transaction.trackId}`;
    } else if ('tip' in transaction.kind) {
      return `Tip from user ${transaction.fromUser}`;
    } else {
      return 'Unknown transaction';
    }
  }
  return 'Unknown transaction';
};

  // Mini chart components for professional-looking analytics
  const MiniLineChart: React.FC<{ values: number[]; stroke: string }> = ({ values, stroke }) => {
    const width = 260;
    const height = 64;
    const padding = 6;
    const max = Math.max(1, ...values);
    const points = values
      .map((v, i) => {
        const x = padding + (i * (width - padding * 2)) / (values.length - 1 || 1);
        const y = height - padding - (v / max) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="fillGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
        <polygon
          fill="url(#fillGradient)"
          points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`}
        />
      </svg>
    );
  };

  const ChartCard: React.FC<{
    title: string;
    subtitle: string;
    deltaText: string;
    lineColor: string;
    bgFrom: string;
    bgTo: string;
    data: number[];
  }> = ({ title, subtitle, deltaText, lineColor, bgFrom, bgTo, data }) => (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-400">{subtitle}</div>
          <div className="text-white font-semibold mt-1">{title}</div>
        </div>
        <div className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200">{deltaText}</div>
      </div>
      <div className={`mt-3 rounded-md p-2 bg-gradient-to-b ${bgFrom} ${bgTo}`}>
        <MiniLineChart values={data} stroke={lineColor} />
      </div>
    </div>
  );

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const stats = getUserStats()
  const userTracks = getUserTracks()

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

        {/* Stats Cards (2 per row on mobile, 4 per row on md+) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
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
                  <CardTitle className="text-white">Your Tracks</CardTitle>
                  <CardDescription className="text-gray-400">Latest uploads and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userTracks.length > 0 ? (
                    userTracks.map((track) => (
                      <div key={track.id ?? track.title} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Music className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{track.title}</div>
                            <div className="text-sm text-gray-400">{track.streams.toLocaleString()} streams</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm inline-flex items-center gap-1"
                            onClick={() => playTrackAudio(track)}
                            aria-label={playingId === Number(track.id) ? 'Pause' : 'Play'}
                          >
                            {playingId === Number(track.id) ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {playingId === Number(track.id) ? 'Pause' : 'Play'}
                          </button>
                          <button
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                            onClick={() => {
                              setEditTrack(track)
                              setEditTitle(track.title)
                              setEditGenre(track.genre)
                              setEditDescription(track.description)
                              setEditFile(null)
                              setEditUploadMessage("")
                              setEditModalOpen(true)
                            }}
                          >
                            ✎ Edit
                          </button>
      {/* Edit Track Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
          <div className="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-lg p-8 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setEditModalOpen(false)}>&times;</button>
            <div className="text-white text-xl font-semibold mb-2">Edit Track</div>
            <div className="text-gray-400 mb-6">Update your track details and audio file if needed.</div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-gray-300">Track Title</Label>
                  <Input id="edit-title" className="bg-gray-700 border-gray-600 text-white" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-genre" className="text-gray-300">Genre</Label>
                  <select
                    id="edit-genre"
                    className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    value={editGenre}
                    onChange={e => setEditGenre(e.target.value)}
                  >
                    <option value="">Select a genre</option>
                    {GENRES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
                  <Textarea id="edit-description" className="bg-gray-700 border-gray-600 text-white min-h-[120px]" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                </div>
              </div>
            </div>
            {/* File Upload for Edit */}
            <div className={`border-2 border-dashed rounded-lg p-8 text-center mt-6 transition-colors ${editFile ? "border-purple-500 bg-purple-500/10" : "border-gray-600"}`}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setEditFile(e.dataTransfer.files[0]) }}
              onDragOver={e => e.preventDefault()}
              role="button"
              tabIndex={0}
              aria-label="Upload new audio file by dropping or clicking"
              onClick={() => document.getElementById('edit-audio-input')?.click()}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") document.getElementById('edit-audio-input')?.click() }}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-white mb-2">{editFile ? `Selected: ${editFile.name}` : "Drop new audio file here (optional)"}</div>
              <div className="text-gray-400 mb-4">or click to browse (MP3, WAV, FLAC)</div>
              <input id="edit-audio-input" type="file" accept="audio/*" className="hidden" onChange={e => setEditFile(e.target.files?.[0] || null)} />
              <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={() => document.getElementById('edit-audio-input')?.click()}>{editFile ? "Change File" : "Choose File"}</Button>
              {editFile && (<div className="mt-3 text-sm text-gray-300">Size: {(editFile.size / (1024 * 1024)).toFixed(2)} MB • Type: {editFile.type || "unknown"}</div>)}
              {editUploadMessage && (<div className="mt-3 text-sm text-red-300">{editUploadMessage}</div>)}
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <Button type="button" variant="outline" className="border-gray-600 text-gray-300 bg-transparent" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button className="bg-yellow-600 hover:bg-yellow-700" disabled={editUploading} onClick={async () => {
                setEditUploadMessage("")
                if (!editTitle) { setEditUploadMessage("Please enter a track title."); return }
                setEditUploading(true)
                try {
                  // If a new file is selected, upload it and update assetId (not implemented here, but can be added)
                  // For now, only update metadata
                  const res = await updateTrack({ trackId: editTrack.id, title: editTitle, genre: editGenre, description: editDescription })
                  if (res && typeof res === 'object' && 'ok' in res) {
                    setEditModalOpen(false)
                    await fetchTracks()
                  } else if (res && typeof res === 'object' && 'err' in res) {
                    setEditUploadMessage(res.err || "Failed to update track")
                  } else {
                    setEditUploadMessage("Failed to update track")
                  }
                } catch (e) {
                  setEditUploadMessage("Error updating track: " + (e as any)?.message)
                } finally {
                  setEditUploading(false)
                }
              }}>{editUploading ? "Saving…" : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      )}
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${track.title}"?`)) {
                                try {
                                  const res = await deleteTrack(track.id);
                                  if (res && 'ok' in res && res.ok) {
                                    alert("Track deleted!");
                                    await fetchTracks();
                                  } else if (res && 'err' in res) {
                                    alert(res.err || "Failed to delete track");
                                  } else {
                                    alert("Failed to delete track");
                                  }
                                } catch (e) {
                                  alert("Error deleting track: " + (e as any)?.message);
                                }
                              }
                            }}
                          >
                            🗑 Delete
                          </button>
                          <div className="text-right">
                            <div className="font-medium text-green-400">${track.earnings.toFixed(2)}</div>
                            <div className="text-sm text-gray-400">Total earned</div>
                          </div>
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
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ChartCard
                      title="Stream Growth"
                      subtitle="Last 30 days"
                      deltaText={`${deltas.streams >= 0 ? '+' : ''}${deltas.streams}%`}
                      lineColor="#22c55e"
                      bgFrom="from-green-500/10"
                      bgTo="to-green-500/0"
                      data={streamSeries}
                    />
                    <ChartCard
                      title="Fan Engagement"
                      subtitle="Last 30 days"
                      deltaText={`${deltas.engagement >= 0 ? '+' : ''}${deltas.engagement}%`}
                      lineColor="#3b82f6"
                      bgFrom="from-blue-500/10"
                      bgTo="to-blue-500/0"
                      data={engagementSeries}
                    />
                    <ChartCard
                      title="Revenue Growth"
                      subtitle="Last 30 days"
                      deltaText={`${deltas.revenue >= 0 ? '+' : ''}${deltas.revenue}%`}
                      lineColor="#a855f7"
                      bgFrom="from-purple-500/10"
                      bgTo="to-purple-500/0"
                      data={revenueSeries}
                    />
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
                      <select
                        id="genre"
                        className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                      >
                        <option value="">Select a genre</option>
                        {GENRES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
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
                      {getUserTransactions().length > 0 ? (
                        getUserTransactions().map((transaction, i) => (
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

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-40">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={currentTrack.coverImage || userProfile?.profileImage || "/placeholder.svg?height=48&width=48"}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <div className="font-semibold text-white">{currentTrack.title}</div>
                <div className="text-sm text-gray-400">{currentTrack.genre} • {currentTrack.duration || "--:--"}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button size="sm" variant="ghost" onClick={playPrev}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  if (!audioRef.current) return
                  if (!audioRef.current.paused) { audioRef.current.pause(); }
                  else { audioRef.current.play().catch(() => {/* ignore */}); }
                }}
              >
                {audioRef.current && !audioRef.current.paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={playNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          {/* Hidden audio element bound to the object URL */}
          <audio ref={audioRef} src={audioUrl ?? undefined} />
        </div>
      )}

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
                  await loginInternetIdentity()
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
                  await loginNFID()
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
