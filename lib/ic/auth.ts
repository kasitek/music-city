import type { Identity } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'

let authClientPromise: Promise<AuthClient> | null = null
let currentIdentity: Identity | null = null

export async function getAuthClient(): Promise<AuthClient> {
  if (!authClientPromise) {
    authClientPromise = AuthClient.create()
  }
  return authClientPromise
}

export function getIdentity(): Identity | null {
  return currentIdentity
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const client = await getAuthClient()
    const ok = await client.isAuthenticated()
    currentIdentity = ok ? client.getIdentity() : null
    return ok
  } catch (e) {
    console.warn('Authentication check failed, clearing auth state:', e)
    // Clear any stale authentication state
    currentIdentity = null
    try {
      const client = await getAuthClient()
      await client.logout()
    } catch (logoutError) {
      console.warn('Failed to logout during auth check:', logoutError)
    }
    return false
  }
}

function getIIProvider(): string | undefined {
  // Always use explicit override if provided
  if (process.env.NEXT_PUBLIC_II_PROVIDER) return process.env.NEXT_PUBLIC_II_PROVIDER
  
  const net = process.env.NEXT_PUBLIC_DFX_NETWORK
  if (!net || net === 'local') {
    // For local development without local II, use production II
    // This allows us to use prod II with local backend for development
    return 'https://identity.ic0.app'
  }
  // For ic/mainnet, let auth-client default to identity.ic0.app by returning undefined
  return undefined
}

export async function loginInternetIdentity(): Promise<Identity> {
  const client = await getAuthClient()
  currentIdentity = null
  await client.login({
    identityProvider: getIIProvider(),
    onSuccess: () => {
      currentIdentity = client.getIdentity()
    },
    onError: (err) => {
      // Normalize cancel error; caller can decide to ignore
      const msg = (err as any)?.message || String(err)
      if (msg?.includes('User closed the modal')) return
      console.warn('II login error', err)
    },
  })
  const id = client.getIdentity()
  if (!id) throw new Error('Internet Identity login failed')
  currentIdentity = id
  return id
}

export async function loginNFID(): Promise<Identity> {
  const client = await getAuthClient()
  const provider = process.env.NEXT_PUBLIC_NFID_PROVIDER || 'https://nfid.one/authenticate'
  currentIdentity = null
  await client.login({
    identityProvider: provider,
    onSuccess: () => {
      currentIdentity = client.getIdentity()
    },
    onError: (err) => {
      const msg = (err as any)?.message || String(err)
      if (msg?.includes('User closed the modal')) return
      console.warn('NFID login error', err)
    },
  })
  const id = client.getIdentity()
  if (!id) throw new Error('NFID login failed')
  currentIdentity = id
  return id
}

export async function logout(): Promise<void> {
  const client = await getAuthClient()
  await client.logout()
  currentIdentity = null
}
