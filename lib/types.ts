export type UserType = 'artist' | 'fan'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type TxKind = 'stream' | 'tip' | 'nft_purchase' | 'royalty'
export type TxStatus = 'completed' | 'pending' | 'failed'

export interface UserModel {
  owner: string // principal text
  displayName: string
  userType: UserType
  bio: string
  location: string
  genres: string[]
  profileImage: string
  isVerified: boolean
  followers: bigint
  following: bigint
  balance: bigint
  joinedTimestamp: bigint
  birthDate?: string
}

export interface TrackModel {
  id: bigint
  title: string
  artist: string // principal text
  duration: string
  genre: string
  coverImage: string
  audioUrl: string
  audioAssetId?: bigint
  imageAssetId?: bigint
  plays: bigint
  likes: bigint
  price: bigint
  releaseDate: string
  description: string
}

export interface NFTModel {
  id: bigint
  title: string
  artist: string // principal text
  image: string
  price: bigint
  rarity: Rarity
  description: string
  owner?: string // principal text
  createdTimestamp: bigint
}

export interface TransactionModel {
  id: bigint
  kind: TxKind
  amount: bigint
  fromUser?: string
  toUser: string
  trackId?: bigint
  nftId?: bigint
  timestamp: bigint
  status: TxStatus
}
