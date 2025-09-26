import { HttpAgent, Actor, ActorSubclass } from '@dfinity/agent'
import { idlFactory } from './idl'

// Helper function to create a properly configured local agent
async function createLocalAgent(host: string, identity?: import('@dfinity/agent').Identity): Promise<HttpAgent> {
  console.log('[Agent] Creating local development agent...')
  
  const agent = new HttpAgent({
    host,
    identity,
    // Disable certificate verification for local development
    verifyQuerySignatures: false,
  })

  // CRITICAL: Fetch root key for local development to avoid signature verification errors
  try {
    await agent.fetchRootKey()
    console.log('[Agent] Root key fetched for local development')
  } catch (error) {
    console.error('[Agent] Failed to fetch root key:', error)
    // Continue anyway - sometimes the agent will work without root key for simple calls
  }
  
  return agent
}

export type Service = ReturnType<typeof idlFactory>

export type CreateActorOptions = {
  canisterId: string
  host?: string
  fetchRootKey?: boolean
  identity?: import('@dfinity/agent').Identity
  idlFactoryOverride?: any
}

export async function createActor<T = Service>({ canisterId, host, fetchRootKey, identity, idlFactoryOverride }: CreateActorOptions): Promise<ActorSubclass<T>> {
  console.log('[Agent] Creating actor with config:', { canisterId, host, hasIdentity: !!identity, fetchRootKey })
  
  const isLocal = fetchRootKey || host?.includes('127.0.0.1') || host?.includes('localhost')
  let agent: HttpAgent
  
  if (isLocal) {
    // Use the specialized local agent for development
    agent = await createLocalAgent(host!, identity)
  } else {
    // Production agent
    agent = new HttpAgent({
      host,
      identity,
    })
  }

  const factory = idlFactoryOverride ?? idlFactory
  const actor = Actor.createActor<T>(factory, {
    agent,
    canisterId,
  })
  
  console.log('[Agent] Actor created successfully for canister:', canisterId)
  return actor
}

export function getDefaultHost(): string {
  // Use a single env selector to choose environment; default to local
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT
  return env === 'ic' ? 'https://icp0.io' : 'http://127.0.0.1:4943'
}

// Decide whether to fetch the root key for certificate validation in dev.
// We enable it when connecting to a local replica even if NEXT_PUBLIC_DFX_NETWORK is not set.
export function shouldFetchRootKey(host?: string): boolean {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT
  if (env === 'ic') return false
  const h = host ?? getDefaultHost() ?? ''
  // Treat common local dev hosts as requiring root key fetch
  // Includes 127.0.0.1, localhost, 0.0.0.0, and typical LAN IPs
  const isLocal = (
    h.includes('127.0.0.1') ||
    h.includes('localhost') ||
    h.includes('0.0.0.0') ||
    /http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h)
  )
  return isLocal
}
