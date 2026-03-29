import type { AgentKitStorage } from '@worldcoin/agentkit'
import type { AgentGateStorage } from '../types/index.js'

/**
 * Wraps our AgentGateStorage into the AgentKitStorage interface,
 * scoped to a specific endpoint. AgentKit's storage uses
 * `tryIncrementUsage(endpoint, humanId, limit)` where `endpoint`
 * is the resource URL — we ignore that and use our endpointId instead.
 */
export function createAgentKitStorageAdapter(
  store: AgentGateStorage,
  endpointId: string,
  freeTrialUses: number,
): AgentKitStorage {
  return {
    async tryIncrementUsage(_endpoint: string, humanId: string, limit: number): Promise<boolean> {
      const current = await store.getUsageCount(endpointId, humanId)
      const effectiveLimit = limit > 0 ? limit : freeTrialUses
      if (current >= effectiveLimit) return false
      await store.incrementUsage(endpointId, humanId)
      return true
    },

    async hasUsedNonce(nonce: string): Promise<boolean> {
      return store.hasUsedNonce(nonce)
    },

    async recordNonce(nonce: string): Promise<void> {
      return store.recordNonce(nonce)
    },
  }
}
