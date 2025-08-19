// Resolve canister ID for music_city_backend across environments
// Priority:
// 1) NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID
// 2) /canister_ids.json served by Next (copy from .dfx/deploy)

export async function getBackendCanisterId(): Promise<string> {
  const envId = process.env.NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID
  if (envId) return envId

  // Try fetch canister_ids.json from public path
  try {
    const res = await fetch('/canister_ids.json', { cache: 'no-store' })
    if (res.ok) {
      const ids = await res.json()
      const id = ids?.music_city_backend?.local || ids?.music_city_backend
      if (typeof id === 'string') return id
    }
  } catch {}

  throw new Error('music_city_backend canister id not found. Set NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID or serve /canister_ids.json')
}

async function getIdFromPublic(name: string): Promise<string | undefined> {
  try {
    const res = await fetch('/canister_ids.json', { cache: 'no-store' })
    if (res.ok) {
      const ids = await res.json()
      const id = ids?.[name]?.local || ids?.[name]
      if (typeof id === 'string') return id
    }
  } catch {}
  return undefined
}

export async function getStorageIndexCanisterId(): Promise<string> {
  const envId = process.env.NEXT_PUBLIC_STORAGE_INDEX_CANISTER_ID
  if (envId) return envId
  const id = await getIdFromPublic('storage_index')
  if (id) return id
  throw new Error('storage_index canister id not found. Set NEXT_PUBLIC_STORAGE_INDEX_CANISTER_ID or serve /canister_ids.json')
}

export async function getStorageBucketCanisterId(): Promise<string> {
  const envId = process.env.NEXT_PUBLIC_STORAGE_BUCKET_CANISTER_ID
  if (envId) return envId
  const id = await getIdFromPublic('storage_bucket')
  if (id) return id
  throw new Error('storage_bucket canister id not found. Set NEXT_PUBLIC_STORAGE_BUCKET_CANISTER_ID or serve /canister_ids.json')
}
