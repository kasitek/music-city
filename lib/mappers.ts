import { NFTModel, Rarity, TrackModel, TransactionModel, TxKind, TxStatus, UserModel, UserType } from './types'

export function variantToKey<T extends Record<string, unknown>>(v: T): keyof T {
  return Object.keys(v)[0] as keyof T
}

export function optToUndef<T>(o: [] | [T] | undefined | null): T | undefined {
  if (!o) return undefined
  return (Array.isArray(o) && (o as any).length > 0) ? (o as any)[0] : undefined
}

export function principalToText(p: any): string {
  return typeof p?.toText === 'function' ? p.toText() : String(p)
}

export function natToBigint(n: any): bigint {
  // Agent returns Nat/Nat64 as JS BigInt already
  try { return BigInt(n as any) } catch { return BigInt(0) }
}

// User
export function fromCandidUser(u: any): UserModel {
  return {
    owner: principalToText(u.owner),
    displayName: String(u.displayName),
    userType: variantToKey(u.userType) as UserType,
    bio: String(u.bio),
    location: String(u.location),
    genres: Array.isArray(u.genres) ? u.genres.map(String) : [],
    profileImage: String(u.profileImage),
    isVerified: Boolean(u.isVerified),
    followers: natToBigint(u.followers),
    following: natToBigint(u.following),
    balance: natToBigint(u.balance),
    joinedTimestamp: natToBigint(u.joinedTimestamp),
    birthDate: optToUndef<string>(u.birthDate as any),
  }
}

// Track
export function fromCandidTrack(t: any): TrackModel {
  return {
    id: natToBigint(t.id),
    title: String(t.title),
    artist: principalToText(t.artist),
    duration: String(t.duration),
    genre: String(t.genre),
    coverImage: String(t.coverImage),
    audioUrl: String(t.audioUrl),
    audioAssetId: optToUndef<any>(t.audioAssetId) !== undefined ? natToBigint(optToUndef(t.audioAssetId) as any) : undefined,
    imageAssetId: optToUndef<any>(t.imageAssetId) !== undefined ? natToBigint(optToUndef(t.imageAssetId) as any) : undefined,
    plays: natToBigint(t.plays),
    likes: natToBigint(t.likes),
    price: natToBigint(t.price),
    releaseDate: String(t.releaseDate),
    description: String(t.description),
  }
}

// NFT
export function fromCandidNFT(nft: any): NFTModel {
  return {
    id: natToBigint(nft.id),
    title: String(nft.title),
    artist: principalToText(nft.artist),
    image: String(nft.image),
    price: natToBigint(nft.price),
    rarity: variantToKey(nft.rarity) as Rarity,
    description: String(nft.description),
    owner: optToUndef<any>(nft.owner) ? principalToText(optToUndef(nft.owner)) : undefined,
    createdTimestamp: natToBigint(nft.createdTimestamp),
  }
}

// Transaction
export function fromCandidTx(tx: any): TransactionModel {
  return {
    id: natToBigint(tx.id),
    kind: variantToKey(tx.kind) as TxKind,
    amount: natToBigint(tx.amount),
    fromUser: optToUndef<any>(tx.fromUser) ? principalToText(optToUndef(tx.fromUser)) : undefined,
    toUser: principalToText(tx.toUser),
    trackId: optToUndef<any>(tx.trackId) !== undefined ? natToBigint(optToUndef(tx.trackId) as any) : undefined,
    nftId: optToUndef<any>(tx.nftId) !== undefined ? natToBigint(optToUndef(tx.nftId) as any) : undefined,
    timestamp: natToBigint(tx.timestamp),
    status: variantToKey(tx.status) as TxStatus,
  }
}
