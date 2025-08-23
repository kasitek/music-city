import type { ActorSubclass } from '@dfinity/agent'
import { createActor, getDefaultHost, shouldFetchRootKey } from './agent'
import { getBackendCanisterId } from './canister'
import type { _SERVICE } from './idl'
import type { Identity } from '@dfinity/agent'

let actorPromise: Promise<ActorSubclass<_SERVICE>> | null = null
let currentIdentity: Identity | undefined
let loggedConfig = false

export function setIdentity(identity?: Identity) {
  currentIdentity = identity
  // reset so next call builds an actor with the new identity
  actorPromise = null
}

export function resetActor() {
  actorPromise = null
  loggedConfig = false
}

async function getActor(): Promise<ActorSubclass<_SERVICE>> {
  if (!actorPromise) {
    const canisterId = await getBackendCanisterId()
    const host = getDefaultHost()
    
    // Prefer using identity if available (even on local) so authenticated methods work.
    // We will still fallback to an anonymous actor if creation fails.
    const identity = currentIdentity
    
    actorPromise = createActor<_SERVICE>({
      canisterId,
      host,
      fetchRootKey: shouldFetchRootKey(host),
      identity,
    }).catch(async (error) => {
      console.warn('[Backend] Actor creation failed, retrying without identity:', error)
      // Reset and try again without identity
      return createActor<_SERVICE>({
        canisterId,
        host,
        fetchRootKey: shouldFetchRootKey(host),
        identity: undefined,
      })
    })
    
    if (!loggedConfig) {
      console.info('[IC backend] creating actor', { canisterId, host, fetchRootKey: shouldFetchRootKey(host), hasIdentity: !!identity })
      loggedConfig = true
    }
  }
  return actorPromise
}

// User APIs
export async function registerUser(params: {
  displayName: string
  userType: { artist?: null; fan?: null }
  bio: string
  location: string
  genres: string[]
  profileImage: string
  birthDate?: string | null
}) {
  const a = await getActor()
  const res = await a.registerUser(
    params.displayName,
    params.userType as any,
    params.bio,
    params.location,
    params.genres,
    params.profileImage,
    params.birthDate ? [params.birthDate] : []
  )
  return res
}

export async function getMyUser() {
  const a = await getActor()
  return a.getMyUser()
}

export async function getUser(principalText: string) {
  const a = await getActor()
  const principal = (await import('@dfinity/principal')).Principal.fromText(principalText)
  return a.getUser(principal)
}

export async function listArtists() {
  const a = await getActor()
  console.log('[Backend] Calling listArtists...')
  try {
    const result = await a.listArtists()
    console.log('[Backend] listArtists success:', result)
    return result
  } catch (error) {
    console.error('[Backend] listArtists error:', error)
    throw error
  }
}

export async function updateProfile(params: {
  displayName?: string
  bio?: string
  location?: string
  genres?: string[]
  profileImage?: string
}) {
  const a = await getActor()
  const opt = <T,>(v: T | undefined) => (v === undefined ? [] : [v])
  return a.updateProfile(
    opt(params.displayName),
    opt(params.bio),
    opt(params.location),
    opt(params.genres),
    opt(params.profileImage)
  )
}

export async function becomeArtist() {
  const a = await getActor()
  return a.becomeArtist()
}

// Tracks
export async function createTrack(params: {
  title: string
  duration: string
  genre: string
  coverImage: string
  audioUrl: string
  price: bigint | number
  releaseDate: string
  description: string
}) {
  const a = await getActor()
  return a.createTrack(
    params.title,
    params.duration,
    params.genre,
    params.coverImage,
    params.audioUrl,
    BigInt(params.price as any),
    params.releaseDate,
    params.description
  )
}

export async function listTracks() {
  const a = await getActor()
  return a.listTracks()
}

export async function getTrack(id: number | bigint) {
  const a = await getActor()
  return a.getTrack(BigInt(id as any))
}

export async function streamTrack(id: number | bigint) {
  const a = await getActor()
  return a.streamTrack(BigInt(id as any))
}

export async function setTrackAssets(params: { trackId: number | bigint; audioAssetId?: number | bigint | null; imageAssetId?: number | bigint | null }) {
  const a = await getActor()
  const opt = <T,>(v: T | undefined | null) => (v === undefined || v === null ? [] : [BigInt(v as any)])
  return a.setTrackAssets(BigInt(params.trackId as any), opt(params.audioAssetId), opt(params.imageAssetId))
}

// Tips
export async function tip(artistPrincipalText: string, amount: number | bigint) {
  const a = await getActor()
  const { Principal } = await import('@dfinity/principal')
  return a.tip(Principal.fromText(artistPrincipalText), BigInt(amount as any))
}

// Follow
export async function follow(artistPrincipalText: string) {
  const a = await getActor()
  const { Principal } = await import('@dfinity/principal')
  return a.follow(Principal.fromText(artistPrincipalText))
}

export async function unfollow(artistPrincipalText: string) {
  const a = await getActor()
  const { Principal } = await import('@dfinity/principal')
  return a.unfollow(Principal.fromText(artistPrincipalText))
}

// NFTs
export async function mintNFT(params: {
  title: string
  image: string
  price: number | bigint
  rarity: { common?: null; rare?: null; epic?: null; legendary?: null }
  description: string
}) {
  const a = await getActor()
  return a.mintNFT(
    params.title,
    params.image,
    BigInt(params.price as any),
    params.rarity as any,
    params.description
  )
}

export async function purchaseNFT(id: number | bigint) {
  const a = await getActor()
  return a.purchaseNFT(BigInt(id as any))
}

export async function listNFTs() {
  const a = await getActor()
  return a.listNFTs()
}

export async function getNFT(id: number | bigint) {
  const a = await getActor()
  return a.getNFT(BigInt(id as any))
}

// Transactions
export async function myTransactions() {
  const a = await getActor()
  return a.myTransactions()
}
