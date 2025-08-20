import type { ActorSubclass } from '@dfinity/agent'
import { createActor, getDefaultHost, shouldFetchRootKey } from './agent'
import { getStorageBucketCanisterId, getStorageIndexCanisterId } from './canister'
import type { Identity } from '@dfinity/agent'
import { indexIdlFactory, bucketIdlFactory } from './storage_idl'

export type IndexService = ReturnType<typeof indexIdlFactory>
export type BucketService = ReturnType<typeof bucketIdlFactory>

let indexActorPromise: Promise<ActorSubclass<IndexService>> | null = null
let bucketActorPromise: Promise<ActorSubclass<BucketService>> | null = null
const bucketActorCache = new Map<string, Promise<ActorSubclass<BucketService>>>()
let currentIdentity: Identity | undefined

export function setStorageIdentity(identity?: Identity) {
  currentIdentity = identity
  indexActorPromise = null
  bucketActorPromise = null
  bucketActorCache.clear()
}

async function getIndexActor(): Promise<ActorSubclass<IndexService>> {
  if (!indexActorPromise) {
    const canisterId = await getStorageIndexCanisterId()
    const host = getDefaultHost()
    indexActorPromise = createActor<IndexService>({
      canisterId,
      host,
      fetchRootKey: shouldFetchRootKey(host),
      identity: currentIdentity,
      idlFactoryOverride: indexIdlFactory,
    })
  }
  return indexActorPromise
}

async function getBucketActor(): Promise<ActorSubclass<BucketService>> {
  if (!bucketActorPromise) {
    const canisterId = await getStorageBucketCanisterId()
    const host = getDefaultHost()
    bucketActorPromise = createActor<BucketService>({
      canisterId,
      host,
      fetchRootKey: shouldFetchRootKey(host),
      identity: currentIdentity,
      idlFactoryOverride: bucketIdlFactory,
    })
  }
  return bucketActorPromise
}

async function getBucketActorFor(canisterId: string): Promise<ActorSubclass<BucketService>> {
  if (!bucketActorCache.has(canisterId)) {
    bucketActorCache.set(
      canisterId,
      createActor<BucketService>({
        canisterId,
        host: getDefaultHost(),
        fetchRootKey: shouldFetchRootKey(getDefaultHost()),
        identity: currentIdentity,
        idlFactoryOverride: bucketIdlFactory,
      })
    )
  }
  return bucketActorCache.get(canisterId) as Promise<ActorSubclass<BucketService>>
}

// High-level helpers
export async function createAsset(params: {
  mediaType: { audio?: null; image?: null; other?: null }
  ext: string
  size: number | bigint
  contentType: string
}) {
  const a = await getIndexActor()
  return a.createAsset(params.mediaType as any, params.ext, BigInt(params.size as any), params.contentType)
}

export async function uploadBlob(assetId: number | bigint, data: Uint8Array, contentType: string) {
  const b = await getBucketActor()
  // MVP as single-chunk upload
  const chunkNo = BigInt(0)
  const totalChunks = BigInt(1)
  const res1 = await b.put_chunk(BigInt(assetId as any), chunkNo, Array.from(data))
  if ('err' in res1) return res1
  const res2 = await b.commit_batch(BigInt(assetId as any), totalChunks, contentType, BigInt(data.byteLength))
  return res2
}

export async function setBucketPrincipal(bucketCanisterId?: string) {
  const idx = await getIndexActor()
  const id = bucketCanisterId ?? (await getStorageBucketCanisterId())
  // The candid expects Principal; @dfinity/principal is available in frontend runtime
  const { Principal } = await import('@dfinity/principal')
  return idx.setBucket(Principal.fromText(id))
}

export async function getData(assetId: number | bigint) {
  const b = await getBucketActor()
  return b.get_data(BigInt(assetId as any))
}

export async function uploadBlobToBucket(bucketCanisterId: string, assetId: number | bigint, data: Uint8Array, contentType: string) {
  const b = await getBucketActorFor(bucketCanisterId)
  const chunkNo = BigInt(0)
  const totalChunks = BigInt(1)
  const res1 = await b.put_chunk(BigInt(assetId as any), chunkNo, Array.from(data))
  if ('err' in res1) return res1
  const res2 = await b.commit_batch(BigInt(assetId as any), totalChunks, contentType, BigInt(data.byteLength))
  return res2
}
