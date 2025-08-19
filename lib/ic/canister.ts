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
