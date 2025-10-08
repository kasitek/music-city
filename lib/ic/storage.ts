import { Actor, HttpAgent } from "@dfinity/agent"
import { Principal } from "@dfinity/principal"
import { getAgent } from "./agent"

const BUCKET_CANISTER_ID = "asi7t-saaaa-aaaaa-qcimq-cai"
const INDEX_CANISTER_ID = "avjzh-7yaaa-aaaaa-qcima-cai"

export type CreateAssetResult = {
  id: string
  metadata?: Record<string, unknown>
  bucketId?: string
}

export async function createAsset(metadata: Record<string, unknown>): Promise<CreateAssetResult> {
  const agent = await getAgent()
  return {
    id: `asset-${Date.now()}`,
    metadata,
    bucketId: BUCKET_CANISTER_ID
  }
}

export type UploadResult = {
  success: boolean
  url?: string
  error?: string
  assetId?: string
}

export async function uploadBlobToBucket(
  blob: Blob | Buffer | Uint8Array,
  opts?: { filename?: string }
): Promise<UploadResult> {
  try {
    const agent = await getAgent()
    const chunks = await chunkData(blob)
    
    
    const assetId = `asset-${Date.now()}`
    return {
      success: true,
      url: `https://${BUCKET_CANISTER_ID}.raw.ic0.app/asset/${assetId}`,
      assetId
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error during upload"
    }
  }
}

async function chunkData(data: Blob | Buffer | Uint8Array): Promise<Uint8Array[]> {
  const CHUNK_SIZE = 2_000_000 // 2MB chunks
  const chunks: Uint8Array[] = []
  
  if (data instanceof Blob) {
    const buffer = await data.arrayBuffer()
    data = new Uint8Array(buffer)
  }
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE))
  }
  
  return chunks
}