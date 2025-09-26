import type { ActorSubclass } from "@dfinity/agent";
import { createActor, shouldFetchRootKey } from "./agent";
import { host as configuredHost } from "@/hooks/constants/urls";
import { getCanisterId } from "@/hooks/constants/canisters-config";
import type { _SERVICE as STORAGE_INDEX_SERVICE } from "../../src/declarations/storage_index/storage_index.did";
import type { _SERVICE as STORAGE_BUCKET_SERVICE } from "../../src/declarations/storage_bucket/storage_bucket.did";
import { idlFactory as storageIndexIDL } from "../../src/declarations/storage_index";
import { idlFactory as storageBucketIDL } from "../../src/declarations/storage_bucket";

export type AssetData = {
  bytes: Uint8Array;
  contentType: string;
};

let storageIndexActorPromise: Promise<ActorSubclass<STORAGE_INDEX_SERVICE>> | null = null;
let storageBucketActorPromise: Promise<ActorSubclass<STORAGE_BUCKET_SERVICE>> | null = null;

async function getStorageIndexActor(): Promise<ActorSubclass<STORAGE_INDEX_SERVICE>> {
  if (!storageIndexActorPromise) {
    const canisterId = getCanisterId("storage_index");
    const host = configuredHost;
    const fetchRootKey = shouldFetchRootKey(host);
    storageIndexActorPromise = createActor<STORAGE_INDEX_SERVICE>({
      canisterId,
      host,
      fetchRootKey,
      idlFactoryOverride: storageIndexIDL,
    });
  }
  return storageIndexActorPromise;
}

export async function uploadAudioAsset(bytes: Uint8Array, contentType: string, ext: string, chunkSizeBytes: number = 1024 * 1024): Promise<bigint> {
  console.log('uploadAudioAsset: Starting upload', { bytesLength: bytes.length, contentType, ext });
  const index = await getStorageIndexActor();
  const bucket = await getStorageBucketActor();
  const size = BigInt(bytes.length);
  
  // 1) Allocate an asset ID via index (records metadata and bucket)
  console.log('uploadAudioAsset: Creating asset in index...');
  const mediaType: any = { audio: null };
  const created = await index.createAsset(mediaType, ext, size, contentType);
  if (!('ok' in created)) {
    const error = ('err' in created) ? (created as any).err : 'createAsset failed';
    console.error('uploadAudioAsset: createAsset failed:', error);
    throw new Error(error);
  }
  const tuple = (created as any).ok as [bigint, any];
  const assetId = tuple[0];
  console.log('uploadAudioAsset: Asset created with ID:', assetId);

  // 2) Upload chunks to bucket with the allocated assetId
  const chunkSz = Number(chunkSizeBytes);
  const totalChunksNum = Math.ceil(bytes.length / chunkSz);
  const totalChunks = BigInt(totalChunksNum);
  console.log('uploadAudioAsset: Uploading', totalChunksNum, 'chunks...');
  
  for (let i = 0; i < totalChunksNum; i++) {
    const start = i * chunkSz;
    const end = Math.min(start + chunkSz, bytes.length);
    const chunk = bytes.slice(start, end);
    console.log(`uploadAudioAsset: Uploading chunk ${i}/${totalChunksNum - 1}, size:`, chunk.length);
    const put = await bucket.put_chunk(assetId, BigInt(i), chunk as any);
    if (!('ok' in put)) {
      const error = ('err' in put) ? (put as any).err : 'put_chunk failed';
      console.error('uploadAudioAsset: put_chunk failed for chunk', i, ':', error);
      throw new Error(error);
    }
  }

  // 3) Commit the batch
  console.log('uploadAudioAsset: Committing batch...');
  const commit = await bucket.commit_batch(assetId, totalChunks, contentType, size);
  if (!('ok' in commit)) {
    const error = ('err' in commit) ? (commit as any).err : 'commit_batch failed';
    console.error('uploadAudioAsset: commit_batch failed:', error);
    throw new Error(error);
  }
  
  console.log('uploadAudioAsset: Upload completed successfully, assetId:', assetId);
  return assetId;
}

async function getStorageBucketActor(): Promise<ActorSubclass<STORAGE_BUCKET_SERVICE>> {
  if (!storageBucketActorPromise) {
    const canisterId = getCanisterId("storage_bucket");
    const host = configuredHost;
    const fetchRootKey = shouldFetchRootKey(host);
    storageBucketActorPromise = createActor<STORAGE_BUCKET_SERVICE>({
      canisterId,
      host,
      fetchRootKey,
      idlFactoryOverride: storageBucketIDL,
    });
  }
  return storageBucketActorPromise;
}

export async function getAssetData(assetId: bigint): Promise<AssetData | null> {
  try {
    console.log('getAssetData: Fetching asset', assetId);
    const bucket = await getStorageBucketActor();
    
    // Prefer chunked read to avoid 3MB reply limit
    let bytes: Uint8Array | null = null;
    try {
      console.log('getAssetData: Trying chunked read via get_len/get_chunk...');
      const lenOpt = await (bucket as any).get_len(assetId);
      const totalLen = Array.isArray(lenOpt) ? (lenOpt.length > 0 ? Number(lenOpt[0]) : null) : (typeof lenOpt === 'number' ? lenOpt : null);
      if (totalLen != null) {
        const chunkSize = 512 * 1024; // 512KB
        const out = new Uint8Array(totalLen);
        let offset = 0;
        while (offset < totalLen) {
          const size = Math.min(chunkSize, totalLen - offset);
          const partOpt = await (bucket as any).get_chunk(assetId, BigInt(offset), BigInt(size));
          const partRaw = Array.isArray(partOpt) ? (partOpt.length > 0 ? partOpt[0] : null) : partOpt;
          if (!partRaw) { throw new Error(`Missing chunk at offset ${offset}`); }
          const part = partRaw instanceof Uint8Array ? partRaw : new Uint8Array(partRaw as any);
          out.set(part, offset);
          offset += part.length;
        }
        bytes = out;
        console.log('getAssetData: Chunked read complete, length:', bytes.length);
      }
    } catch (e) {
      console.log('getAssetData: Chunked read failed or unavailable, falling back to get_data:', e);
    }

    // Fallback to single get_data for small assets
    if (!bytes) {
      console.log('getAssetData: Calling bucket.get_data (fallback)...');
      const bytesOpt = await bucket.get_data(assetId);
      const raw = Array.isArray(bytesOpt) ? (bytesOpt.length > 0 ? bytesOpt[0] : null) : bytesOpt;
      if (!raw) {
        console.log('getAssetData: No raw data found');
        return null;
      }
      bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw as any);
      console.log('getAssetData: Fallback read length:', bytes.length);
    }

    // Default content type
    let contentType = "audio/mpeg";
    try {
      console.log('getAssetData: Fetching metadata from index...');
      const index = await getStorageIndexActor();
      const metaOpt = await index.locateAsset(assetId);
      console.log('getAssetData: index.locateAsset result:', { isArray: Array.isArray(metaOpt), length: Array.isArray(metaOpt) ? metaOpt.length : 'not array' });
      if (metaOpt && (!Array.isArray(metaOpt) || metaOpt.length > 0)) {
        const meta: any = Array.isArray(metaOpt) ? (metaOpt.length > 0 ? metaOpt[0] : null) : metaOpt;
        if (meta?.contentType) {
          contentType = meta.contentType as string;
          console.log('getAssetData: Found contentType:', contentType);
        }
      }
    } catch (e) {
      console.log('getAssetData: Failed to get metadata from index:', e);
    }

    console.log('getAssetData: Returning asset data:', { bytesLength: bytes.length, contentType });
    return { bytes, contentType };
  } catch (e) {
    console.error('getAssetData: Error:', e);
    return null;
  }
}
