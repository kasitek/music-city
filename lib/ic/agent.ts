import { HttpAgent, Actor, ActorSubclass } from '@dfinity/agent'
import { idlFactory } from './idl'

export type Service = ReturnType<typeof idlFactory>

export type CreateActorOptions = {
  canisterId: string
  host?: string
  fetchRootKey?: boolean
}

export async function createActor<T = Service>({ canisterId, host, fetchRootKey }: CreateActorOptions): Promise<ActorSubclass<T>> {
  const agent = new HttpAgent({ host })

  // Only in local dev: fetch the root key so agent can validate certificates
  if (fetchRootKey) {
    try { await agent.fetchRootKey() } catch (e) { console.warn('fetchRootKey failed', e) }
  }

  return Actor.createActor<T>(idlFactory, {
    agent,
    canisterId,
  })
}

export function getDefaultHost(): string | undefined {
  // Use NEXT_PUBLIC_DFX_NETWORK to decide local vs ic
  const net = process.env.NEXT_PUBLIC_DFX_NETWORK
  if (!net || net === 'local') return 'http://127.0.0.1:4943'
  // Mainnet boundary node
  return 'https://icp0.io'
}
