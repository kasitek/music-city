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
  const client = await getAuthClient()
  const ok = await client.isAuthenticated()
  currentIdentity = ok ? client.getIdentity() : null
  return ok
}

export async function loginInternetIdentity(): Promise<Identity> {
  const client = await getAuthClient()
  await client.login({
    identityProvider: undefined, // default II for local/mainnet
    onSuccess: () => {
      currentIdentity = client.getIdentity()
    },
  })
  // When login returns, we should be authenticated
  currentIdentity = client.getIdentity()
  return currentIdentity!
}

export async function loginNFID(): Promise<Identity> {
  const client = await getAuthClient()
  const provider = 'https://nfid.one/authenticate'
  await client.login({
    identityProvider: provider,
    onSuccess: () => {
      currentIdentity = client.getIdentity()
    },
  })
  currentIdentity = client.getIdentity()
  return currentIdentity!
}

export async function logout(): Promise<void> {
  const client = await getAuthClient()
  await client.logout()
  currentIdentity = null
}
