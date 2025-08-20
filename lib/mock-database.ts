export interface User {
  id: string
  walletAddress: string
  displayName: string
  userType: "artist" | "fan"
  bio: string
  location: string
  genres: string[]
  profileImage: string
  isVerified: boolean
  followers: number
  following: number
  mccBalance: number
  joinedDate: string
  birthDate?: string
}

export interface Track {
  id: string
  title: string
  artist: string
  artistId: string
  duration: string
  genre: string
  coverImage: string
  audioUrl: string
  plays: number
  likes: number
  price: number
  releaseDate: string
  description: string
}

export interface NFT {
  id: string
  title: string
  artist: string
  artistId: string
  image: string
  price: number
  rarity: "common" | "rare" | "epic" | "legendary"
  description: string
  owner?: string
  createdDate: string
}

export interface Transaction {
  id: string
  type: "stream" | "tip" | "nft_purchase" | "royalty"
  amount: number
  fromUser?: string
  toUser: string
  trackId?: string
  nftId?: string
  timestamp: string
  status: "completed" | "pending" | "failed"
}

export interface Playlist {
  id: string
  name: string
  description: string
  coverImage: string
  tracks: string[]
  createdBy: string
  isPublic: boolean
  createdDate: string
  plays: number
}

class MockDatabase {
  private users: User[] = []
  private tracks: Track[] = []
  private nfts: NFT[] = []
  private transactions: Transaction[] = []
  private playlists: Playlist[] = []
  private currentUser: User | null = null

  initializeDatabase() {
    // Check if data already exists
    const existingUsers = localStorage.getItem("musiccity_users")
    if (existingUsers) {
      this.users = JSON.parse(existingUsers)
      this.tracks = JSON.parse(localStorage.getItem("musiccity_tracks") || "[]")
      this.nfts = JSON.parse(localStorage.getItem("musiccity_nfts") || "[]")
      this.transactions = JSON.parse(localStorage.getItem("musiccity_transactions") || "[]")
      this.playlists = JSON.parse(localStorage.getItem("musiccity_playlists") || "[]")

      const currentUserId = localStorage.getItem("musiccity_current_user")
      if (currentUserId) {
        this.currentUser = this.users.find((u) => u.id === currentUserId) || null
      }
      return
    }

    // Initialize with sample data
    this.users = [
      {
        id: "1",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        displayName: "Alex Rivera",
        userType: "artist",
        bio: "Pop artist from Los Angeles creating music that connects hearts worldwide.",
        location: "Los Angeles, USA",
        genres: ["Pop", "Electronic"],
        profileImage: "/placeholder-user.jpg",
        isVerified: true,
        followers: 15420,
        following: 234,
        mccBalance: 2847,
        joinedDate: "2024-01-15",
        birthDate: "1995-03-22",
      },
      {
        id: "2",
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        displayName: "Maya Chen",
        userType: "artist",
        bio: "Electronic music producer and songwriter from Toronto, blending traditional and modern sounds.",
        location: "Toronto, Canada",
        genres: ["Electronic", "Dance"],
        profileImage: "/placeholder-user.jpg",
        isVerified: true,
        followers: 8932,
        following: 156,
        mccBalance: 1923,
        joinedDate: "2024-02-03",
        birthDate: "1992-07-18",
      },
      {
        id: "3",
        walletAddress: "0x9876543210fedcba9876543210fedcba98765432",
        displayName: "James Wilson",
        userType: "fan",
        bio: "Music enthusiast and supporter of independent artists from London.",
        location: "London, UK",
        genres: ["Hip-Hop", "R&B", "Jazz"],
        profileImage: "/placeholder-user.jpg",
        isVerified: false,
        followers: 234,
        following: 1247,
        mccBalance: 156,
        joinedDate: "2024-03-10",
        birthDate: "1988-11-05",
      },
    ]

    this.tracks = [
      {
        id: "1",
        title: "Electric Dreams",
        artist: "Alex Rivera",
        artistId: "1",
        duration: "3:24",
        genre: "Pop",
        coverImage: "/placeholder.jpg",
        audioUrl: "/audio/electric-dreams.mp3",
        plays: 45230,
        likes: 3421,
        price: 0.05,
        releaseDate: "2024-03-15",
        description: "An uplifting pop anthem about chasing dreams in the digital age.",
      },
      {
        id: "2",
        title: "City Nights",
        artist: "Maya Chen",
        artistId: "2",
        duration: "4:12",
        genre: "Electronic",
        coverImage: "/placeholder.jpg",
        audioUrl: "/audio/city-nights.mp3",
        plays: 32156,
        likes: 2847,
        price: 0.03,
        releaseDate: "2024-03-08",
        description: "Electronic beats inspired by the energy of urban nightlife.",
      },
      {
        id: "3",
        title: "Rhythm of the Heart",
        artist: "Alex Rivera",
        artistId: "1",
        duration: "3:45",
        genre: "R&B",
        coverImage: "/placeholder.jpg",
        audioUrl: "/audio/rhythm-heart.mp3",
        plays: 28934,
        likes: 2156,
        price: 0.04,
        releaseDate: "2024-02-28",
        description: "A soulful R&B track about love and connection.",
      },
    ]

    this.nfts = [
      {
        id: "1",
        title: "Electric Dreams - Limited Edition",
        artist: "Alex Rivera",
        artistId: "1",
        image: "/placeholder.jpg",
        price: 0.5,
        rarity: "rare",
        description: "Exclusive NFT artwork for the hit single Electric Dreams",
        createdDate: "2024-03-15",
      },
      {
        id: "2",
        title: "City Nights Visualizer",
        artist: "Maya Chen",
        artistId: "2",
        image: "/placeholder.jpg",
        price: 0.3,
        rarity: "common",
        description: "Animated visualizer NFT for City Nights track",
        createdDate: "2024-03-08",
      },
    ]

    this.transactions = [
      {
        id: "1",
        type: "stream",
        amount: 0.001,
        toUser: "1",
        trackId: "1",
        timestamp: "2024-03-20T10:30:00Z",
        status: "completed",
      },
      {
        id: "2",
        type: "tip",
        amount: 0.05,
        fromUser: "3",
        toUser: "2",
        timestamp: "2024-03-19T15:45:00Z",
        status: "completed",
      },
      {
        id: "3",
        type: "nft_purchase",
        amount: 0.3,
        fromUser: "3",
        toUser: "2",
        nftId: "2",
        timestamp: "2024-03-18T09:20:00Z",
        status: "completed",
      },
    ]

    this.playlists = [
      {
        id: "1",
        name: "Global Hits",
        description: "The best international music from around the world",
        coverImage: "/placeholder.jpg",
        tracks: ["1", "2", "3"],
        createdBy: "system",
        isPublic: true,
        createdDate: "2024-03-01",
        plays: 12450,
      },
      {
        id: "2",
        name: "Electronic Vibes",
        description: "Electronic music for every mood",
        coverImage: "/placeholder.jpg",
        tracks: ["2"],
        createdBy: "system",
        isPublic: true,
        createdDate: "2024-03-05",
        plays: 8932,
      },
    ]

    this.saveToStorage()
  }

  private saveToStorage() {
    localStorage.setItem("musiccity_users", JSON.stringify(this.users))
    localStorage.setItem("musiccity_tracks", JSON.stringify(this.tracks))
    localStorage.setItem("musiccity_nfts", JSON.stringify(this.nfts))
    localStorage.setItem("musiccity_transactions", JSON.stringify(this.transactions))
    localStorage.setItem("musiccity_playlists", JSON.stringify(this.playlists))
  }

  // User methods
  createUser(userData: Partial<User>): User {
    // Prevent duplicate accounts by wallet address
    if (userData.walletAddress) {
      const existing = this.getUserByWallet(userData.walletAddress)
      if (existing) {
        // Optionally merge provided fields into existing record
        const merged: User = { ...existing, ...userData, id: existing.id }
        const idx = this.users.findIndex((u) => u.id === existing.id)
        if (idx !== -1) {
          this.users[idx] = merged
          this.saveToStorage()
        }
        return merged
      }
    }

    const newUser: User = {
      id: Date.now().toString(),
      walletAddress: userData.walletAddress || "",
      displayName: userData.displayName || "",
      userType: userData.userType || "fan",
      bio: userData.bio || "",
      location: userData.location || "",
      genres: userData.genres || [],
      profileImage: userData.profileImage || "/placeholder-user.jpg",
      isVerified: false,
      followers: 0,
      following: 0,
      mccBalance: 100, // Starting balance
      joinedDate: new Date().toISOString().split("T")[0],
      birthDate: userData.birthDate,
    }

    this.users.push(newUser)
    this.saveToStorage()
    return newUser
  }

  getUserByWallet(walletAddress: string): User | null {
    return this.users.find((user) => user.walletAddress === walletAddress) || null
  }

  getUserById(id: string): User | null {
    return this.users.find((user) => user.id === id) || null
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const userIndex = this.users.findIndex((user) => user.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = { ...this.users[userIndex], ...updates }
    this.saveToStorage()
    return this.users[userIndex]
  }

  getUsers(): User[] {
    return this.users
  }

  // Current user methods
  setCurrentUser(user: User) {
    this.currentUser = user
    localStorage.setItem("musiccity_current_user", user.id)
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  clearCurrentUser() {
    this.currentUser = null
    localStorage.removeItem("musiccity_current_user")
  }

  // Track methods
  getAllTracks(): Track[] {
    return this.tracks
  }

  getTracks(): Track[] {
    return this.tracks
  }

  getTrackById(id: string): Track | null {
    return this.tracks.find((track) => track.id === id) || null
  }

  getTracksByArtist(artistId: string): Track[] {
    return this.tracks.filter((track) => track.artistId === artistId)
  }

  // NFT methods
  getAllNFTs(): NFT[] {
    return this.nfts
  }

  getNFTById(id: string): NFT | null {
    return this.nfts.find((nft) => nft.id === id) || null
  }

  getNFTs(): NFT[] {
    return this.nfts
  }

  // Transaction methods
  addTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }

    this.transactions.push(newTransaction)
    this.saveToStorage()
    return newTransaction
  }

  getUserTransactions(userId: string): Transaction[] {
    return this.transactions.filter((transaction) => transaction.fromUser === userId || transaction.toUser === userId)
  }

  // Playlist methods
  getAllPlaylists(): Playlist[] {
    return this.playlists.filter((playlist) => playlist.isPublic)
  }

  getPlaylistById(id: string): Playlist | null {
    return this.playlists.find((playlist) => playlist.id === id) || null
  }

  // Simulation methods
  simulateStream(trackId: string, userId: string): boolean {
    const track = this.getTrackById(trackId)
    const user = this.getUserById(userId)

    if (!track || !user) return false

    // Update play count
    track.plays += 1

    // Add royalty transaction
    const royaltyAmount = 0.001 // Small amount per stream
    this.addTransaction({
      type: "royalty",
      amount: royaltyAmount,
      toUser: track.artistId,
      trackId: trackId,
      status: "completed",
    })

    // Update artist balance
    const artist = this.getUserById(track.artistId)
    if (artist) {
      artist.mccBalance += royaltyAmount
    }

    this.saveToStorage()
    return true
  }

  simulateFollow(followerId: string, followedId: string): boolean {
    const follower = this.getUserById(followerId)
    const followed = this.getUserById(followedId)

    if (!follower || !followed) return false

    follower.following += 1
    followed.followers += 1

    this.saveToStorage()
    return true
  }

  simulateNFTPurchase(nftId: string, buyerId: string): boolean {
    const nft = this.getNFTById(nftId)
    const buyer = this.getUserById(buyerId)

    if (!nft || !buyer || buyer.mccBalance < nft.price) return false

    // Update buyer balance
    buyer.mccBalance -= nft.price

    // Add transaction
    this.addTransaction({
      type: "nft_purchase",
      amount: nft.price,
      fromUser: buyerId,
      toUser: nft.artistId,
      nftId: nftId,
      status: "completed",
    })

    // Update artist balance
    const artist = this.getUserById(nft.artistId)
    if (artist) {
      artist.mccBalance += nft.price * 0.9 // 90% to artist, 10% platform fee
    }

    // Update NFT owner
    nft.owner = buyerId

    this.saveToStorage()
    return true
  }
}

export const mockDB = new MockDatabase()
