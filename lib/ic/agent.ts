import { HttpAgent, Actor, ActorSubclass } from '@dfinity/agent'
import { idlFactory } from './idl'

export type Service = ReturnType<typeof idlFactory>

export type CreateActorOptions = {
  canisterId: string
  host?: string
  fetchRootKey?: boolean
  identity?: import('@dfinity/agent').Identity
  idlFactoryOverride?: any
}

export async function createActor<T = Service>({ canisterId, host, fetchRootKey, identity, idlFactoryOverride }: CreateActorOptions): Promise<ActorSubclass<T>> {
  const agent = new HttpAgent({ host, identity })

  // Only in local dev: fetch the root key so agent can validate certificates
  if (fetchRootKey) {
    try { await agent.fetchRootKey() } catch (e) { console.warn('fetchRootKey failed', e) }
  }

  const factory = idlFactoryOverride ?? idlFactory
  return Actor.createActor<T>(factory, {
    agent,
    canisterId,
  })
}

export function getDefaultHost(): string | undefined {
  // If explicit host is provided, use it (helps across Windows/WSL boundary)
  const explicit = process.env.NEXT_PUBLIC_IC_HOST
  if (explicit) return explicit

  // Use NEXT_PUBLIC_DFX_NETWORK to decide local vs ic
  const net = process.env.NEXT_PUBLIC_DFX_NETWORK
  if (!net || net === 'local') return 'http://127.0.0.1:4943'
  // Mainnet boundary node
  return 'https://icp0.io'
}
