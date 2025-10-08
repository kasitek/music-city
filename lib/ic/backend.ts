import type { ActorSubclass } from '@dfinity/agent'
import { createActor, shouldFetchRootKey } from './agent'
import type { _SERVICE } from '../../src/declarations/music_city_backend/music_city_backend.did'
import type { Identity } from '@dfinity/agent'
import { backendCanisterId } from '../../hooks/constants/canisters-config'
import { host as configuredHost } from '../../hooks/constants/urls'

export async function updateTrack(params: { trackId: number | bigint; title?: string; genre?: string; description?: string }) {
  const a = await getActor();
  const opt = <T,>(v: T | undefined): [] | [T] => (v === undefined ? [] : [v]);
  return a.updateTrack(
    BigInt(params.trackId as any),
    opt(params.title),
    opt(params.genre),
    opt(params.description)
  );
}

export async function deleteTrack(trackId: number | bigint) {
  const a = await getActor();
  return a.deleteTrack(BigInt(trackId as any));
}

let actorPromise: Promise<ActorSubclass<_SERVICE>> | null = null
let currentIdentity: Identity | undefined

export function setIdentity(identity?: Identity) {
  currentIdentity = identity
  actorPromise = null
}

export function resetActor() {
  actorPromise = null
}

async function getActor(): Promise<ActorSubclass<_SERVICE>> {
  if (!actorPromise) {
    const canisterId = backendCanisterId
    const host = configuredHost
    const identity = currentIdentity
    const shouldFetch = shouldFetchRootKey(host)
    
    actorPromise = createActor<_SERVICE>({
      canisterId,
      host,
      fetchRootKey: shouldFetch,
      identity,
    }).catch(async (error) => {
      return createActor<_SERVICE>({
        canisterId,
        host,
        fetchRootKey: shouldFetch,
        identity: undefined,
      })
    })
  }
  return actorPromise
}

export async function registerUser(params: {
  displayName: string
  userType: { artist?: null; fan?: null }
  bio: string
  location: string
  genres: string[]
  profileImage: string
  birthDate?: string | null
}) {
  try {
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
  } catch (error) {
    throw error
  }
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
  try {
    const result = await a.listArtists()
    return result
  } catch (error) {
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
  const opt = <T,>(v: T | undefined): [] | [T] => (v === undefined ? [] : [v])
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
  const opt = (v: number | bigint | undefined | null): [] | [bigint] => (v === undefined || v === null ? [] : [BigInt(v as any)])
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

export async function myTransactions() {
  const a = await getActor()
  return a.myTransactions()
}
