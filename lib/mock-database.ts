export interface User {
  id: string
  walletAddress: string
  userType: "artist" | "fan"
  displayName: string
  bio: string
  location: string
  genres: string[]
  birthDate: string
  profileImage: string
  joinDate: string
  isVerified: boolean
  followers: number
  following: number
  // Artist specific
  totalEarnings?: number
  totalStreams?: number
  monthlyListeners?: number
  tracks?: Track[]
  nfts?: NFT[]
  // Fan specific
  favoriteArtists?: string[]
  playlists?: Playlist[]
}

export interface Track {
  id: string
  title: string
  artistId: string
  artistName: string
  genre: string
  duration: string
  streams: number
  earnings: number
  uploadDate: string
  description: string
  coverImage: string
  audioFile: string
  price: number // in MCC tokens
}

export interface NFT {
  id: string
  title: string
  artistId: string
  artistName: string
  description: string
  price: number // in MCC tokens
  rarity: "Common" | "Rare" | "Legendary"
  image: string
  status: "Active" | "Sold Out"
  likes: number
  views: number
}

export interface Playlist {
  id: string
  title: string
  description: string
  tracks: string[]
  coverImage: string
  isPublic: boolean
  createdBy: string
}

export interface Transaction {
  id: string
  userId: string
  type: "stream" | "purchase" | "tip" | "nft_sale"
  amount: number
  trackId?: string
  nftId?: string
  date: string
  description: string
}

class MockDatabase {
  private readonly USERS_KEY = "music_city_users"
  private readonly TRACKS_KEY = "music_city_tracks"
  private readonly NFTS_KEY = "music_city_nfts"
  private readonly TRANSACTIONS_KEY = "music_city_transactions"
  private readonly CURRENT_USER_KEY = "music_city_current_user"

  // Initialize with sample data
  initializeDatabase() {
    if (!this.getUsers().length) {
      this.seedDatabase()
    }
  }

  private seedDatabase() {
    const sampleUsers: User[] = [
      {
        id: "user_1",
        walletAddress: "0x1234567890123456789012345678901234567890",
        userType: "artist",
        displayName: "Thabo Mthembu",
        bio: "Amapiano and Afrobeat artist from Johannesburg. Bringing South African sounds to the world.",
        location: "Johannesburg, South Africa",
        genres: ["Amapiano", "Afrobeat", "Kwaito"],
        birthDate: "1995-03-15",
        profileImage: "/placeholder.svg?height=150&width=150",
        joinDate: "2023-01-15",
        isVerified: true,
        followers: 12500,
        following: 234,
        totalEarnings: 2847.5,
        totalStreams: 125000,
        monthlyListeners: 45000,
        tracks: [],
        nfts: [],
      },
      {
        id: "user_2",
        walletAddress: "0x2345678901234567890123456789012345678901",
        userType: "artist",
        displayName: "Nomsa Dlamini",
        bio: "Amapiano producer and songwriter from Cape Town, creating the future sounds of Mzansi.",
        location: "Cape Town, South Africa",
        genres: ["Amapiano", "Deep House", "Afro-tech"],
        birthDate: "1992-07-22",
        profileImage: "/placeholder.svg?height=150&width=150",
        joinDate: "2023-02-10",
        isVerified: true,
        followers: 8200,
        following: 156,
        totalEarnings: 1923.0,
        totalStreams: 85600,
        monthlyListeners: 32000,
        tracks: [],
        nfts: [],
      },
      {
        id: "user_3",
        walletAddress: "0x3456789012345678901234567890123456789012",
        userType: "fan",
        displayName: "Sipho Ndlovu",
        bio: "Music lover and supporter of South African artists. Amapiano enthusiast.",
        location: "Durban, South Africa",
        genres: ["Amapiano", "Afrobeat", "Maskandi"],
        birthDate: "1988-11-05",
        profileImage: "/placeholder.svg?height=150&width=150",
        joinDate: "2023-03-20",
        isVerified: false,
        followers: 45,
        following: 123,
        favoriteArtists: ["user_1", "user_2"],
        playlists: [],
      },
    ]

    const sampleTracks: Track[] = [
      {
        id: "track_1",
        title: "Amapiano Dreams",
        artistId: "user_1",
        artistName: "Thabo Mthembu",
        genre: "Amapiano",
        duration: "3:45",
        streams: 12500,
        earnings: 125.5,
        uploadDate: "2024-01-10",
        description: "A vibrant celebration of South African amapiano rhythms and modern sounds.",
        coverImage: "/placeholder.svg?height=300&width=300",
        audioFile: "/placeholder-audio.mp3",
        price: 0.1,
      },
      {
        id: "track_2",
        title: "Joburg Nights",
        artistId: "user_2",
        artistName: "Nomsa Dlamini",
        genre: "Amapiano",
        duration: "4:12",
        streams: 8200,
        earnings: 82.0,
        uploadDate: "2024-01-05",
        description: "Smooth amapiano vibes inspired by the energy of Johannesburg nightlife.",
        coverImage: "/placeholder.svg?height=300&width=300",
        audioFile: "/placeholder-audio.mp3",
        price: 0.08,
      },
      {
        id: "track_3",
        title: "Mzansi Rhythm",
        artistId: "user_1",
        artistName: "Thabo Mthembu",
        genre: "Afrobeat",
        duration: "3:28",
        streams: 15100,
        earnings: 151.0,
        uploadDate: "2023-12-20",
        description: "Soulful Afrobeat with authentic South African influences.",
        coverImage: "/placeholder.svg?height=300&width=300",
        audioFile: "/placeholder-audio.mp3",
        price: 0.12,
      },
    ]

    const sampleNFTs: NFT[] = [
      {
        id: "nft_1",
        title: "Exclusive Studio Session",
        artistId: "user_1",
        artistName: "Thabo Mthembu",
        description: "Join me for a private studio session in Joburg and get early access to my next album",
        price: 500,
        rarity: "Legendary",
        image: "/placeholder.svg?height=200&width=200",
        status: "Active",
        likes: 234,
        views: 1200,
      },
      {
        id: "nft_2",
        title: "Limited Edition Cover Art",
        artistId: "user_2",
        artistName: "Nomsa Dlamini",
        description: "Original digital artwork from my latest single Joburg Nights",
        price: 250,
        rarity: "Rare",
        image: "/placeholder.svg?height=200&width=200",
        status: "Sold Out",
        likes: 156,
        views: 890,
      },
    ]

    const sampleTransactions: Transaction[] = [
      {
        id: "tx_1",
        userId: "user_1",
        type: "stream",
        amount: 12.5,
        trackId: "track_1",
        date: "2024-01-15",
        description: "Stream earnings for Amapiano Dreams",
      },
      {
        id: "tx_2",
        userId: "user_2",
        type: "stream",
        amount: 8.2,
        trackId: "track_2",
        date: "2024-01-14",
        description: "Stream earnings for Joburg Nights",
      },
      {
        id: "tx_3",
        userId: "user_1",
        type: "nft_sale",
        amount: 500,
        nftId: "nft_1",
        date: "2024-01-12",
        description: "NFT sale: Exclusive Studio Session",
      },
    ]

    this.saveUsers(sampleUsers)
    this.saveTracks(sampleTracks)
    this.saveNFTs(sampleNFTs)
    this.saveTransactions(sampleTransactions)
  }

  // User operations
  getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY)
    return users ? JSON.parse(users) : []
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
  }

  getUserById(id: string): User | null {
    const users = this.getUsers()
    return users.find((user) => user.id === id) || null
  }

  getUserByWallet(walletAddress: string): User | null {
    const users = this.getUsers()
    return users.find((user) => user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) || null
  }

  createUser(userData: Omit<User, "id" | "joinDate" | "followers" | "following">): User {
    const users = this.getUsers()
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      joinDate: new Date().toISOString().split("T")[0],
      followers: 0,
      following: 0,
      ...(userData.userType === "artist" && {
        totalEarnings: 0,
        totalStreams: 0,
        monthlyListeners: 0,
        tracks: [],
        nfts: [],
      }),
      ...(userData.userType === "fan" && {
        favoriteArtists: [],
        playlists: [],
      }),
    }

    users.push(newUser)
    this.saveUsers(users)
    return newUser
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return null

    users[userIndex] = { ...users[userIndex], ...updates }
    this.saveUsers(users)
    return users[userIndex]
  }

  // Current user session
  setCurrentUser(user: User): void {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user))
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }

  // Track operations
  getTracks(): Track[] {
    const tracks = localStorage.getItem(this.TRACKS_KEY)
    return tracks ? JSON.parse(tracks) : []
  }

  saveTracks(tracks: Track[]): void {
    localStorage.setItem(this.TRACKS_KEY, JSON.stringify(tracks))
  }

  getTracksByArtist(artistId: string): Track[] {
    const tracks = this.getTracks()
    return tracks.filter((track) => track.artistId === artistId)
  }

  createTrack(trackData: Omit<Track, "id" | "streams" | "earnings" | "uploadDate">): Track {
    const tracks = this.getTracks()
    const newTrack: Track = {
      ...trackData,
      id: `track_${Date.now()}`,
      streams: 0,
      earnings: 0,
      uploadDate: new Date().toISOString().split("T")[0],
    }

    tracks.push(newTrack)
    this.saveTracks(tracks)
    return newTrack
  }

  // NFT operations
  getNFTs(): NFT[] {
    const nfts = localStorage.getItem(this.NFTS_KEY)
    return nfts ? JSON.parse(nfts) : []
  }

  saveNFTs(nfts: NFT[]): void {
    localStorage.setItem(this.NFTS_KEY, JSON.stringify(nfts))
  }

  getNFTsByArtist(artistId: string): NFT[] {
    const nfts = this.getNFTs()
    return nfts.filter((nft) => nft.artistId === artistId)
  }

  createNFT(nftData: Omit<NFT, "id" | "likes" | "views">): NFT {
    const nfts = this.getNFTs()
    const newNFT: NFT = {
      ...nftData,
      id: `nft_${Date.now()}`,
      likes: 0,
      views: 0,
    }

    nfts.push(newNFT)
    this.saveNFTs(nfts)
    return newNFT
  }

  // Transaction operations
  getTransactions(): Transaction[] {
    const transactions = localStorage.getItem(this.TRANSACTIONS_KEY)
    return transactions ? JSON.parse(transactions) : []
  }

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions))
  }

  getTransactionsByUser(userId: string): Transaction[] {
    const transactions = this.getTransactions()
    return transactions.filter((tx) => tx.userId === userId)
  }

  createTransaction(transactionData: Omit<Transaction, "id" | "date">): Transaction {
    const transactions = this.getTransactions()
    const newTransaction: Transaction = {
      ...transactionData,
      id: `tx_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    }

    transactions.push(newTransaction)
    this.saveTransactions(transactions)
    return newTransaction
  }

  // Utility methods
  simulateStreamEarning(trackId: string, streams = 1): void {
    const tracks = this.getTracks()
    const trackIndex = tracks.findIndex((track) => track.id === trackId)

    if (trackIndex !== -1) {
      const track = tracks[trackIndex]
      const earningPerStream = track.price

      tracks[trackIndex] = {
        ...track,
        streams: track.streams + streams,
        earnings: track.earnings + earningPerStream * streams,
      }

      this.saveTracks(tracks)

      // Update artist earnings
      const users = this.getUsers()
      const artistIndex = users.findIndex((user) => user.id === track.artistId)

      if (artistIndex !== -1 && users[artistIndex].userType === "artist") {
        users[artistIndex] = {
          ...users[artistIndex],
          totalStreams: (users[artistIndex].totalStreams || 0) + streams,
          totalEarnings: (users[artistIndex].totalEarnings || 0) + earningPerStream * streams,
        }

        this.saveUsers(users)
      }

      // Create transaction record
      this.createTransaction({
        userId: track.artistId,
        type: "stream",
        amount: earningPerStream * streams,
        trackId: trackId,
        description: `Stream earnings for ${track.title}`,
      })
    }
  }

  followArtist(fanId: string, artistId: string): void {
    const users = this.getUsers()
    const fanIndex = users.findIndex((user) => user.id === fanId)
    const artistIndex = users.findIndex((user) => user.id === artistId)

    if (fanIndex !== -1 && artistIndex !== -1) {
      // Add to fan's following list
      if (users[fanIndex].userType === "fan") {
        const favoriteArtists = users[fanIndex].favoriteArtists || []
        if (!favoriteArtists.includes(artistId)) {
          users[fanIndex].favoriteArtists = [...favoriteArtists, artistId]
          users[fanIndex].following += 1
        }
      }

      // Increase artist's followers
      users[artistIndex].followers += 1

      this.saveUsers(users)
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY)
    localStorage.removeItem(this.TRACKS_KEY)
    localStorage.removeItem(this.NFTS_KEY)
    localStorage.removeItem(this.TRANSACTIONS_KEY)
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }
}

export const mockDB = new MockDatabase()
