import postgres from 'postgres'
import { nanoid } from 'nanoid'
import type {
  AgentGateStorage,
  RegisteredEndpoint,
  CreateEndpointInput,
  RequestLog,
  UsageSummary,
} from '../types/index.js'

export function createPostgresStorage(databaseUrl: string): AgentGateStorage {
  const sql = postgres(databaseUrl)

  return {
    async createEndpoint(ownerId, input) {
      const id = nanoid(12)
      const chains = input.acceptedChains ?? ['eip155:480', 'eip155:8453']
      const [row] = await sql`
        INSERT INTO endpoints (id, owner_id, slug, target_url, free_trial_uses, price_per_request, accepted_chains)
        VALUES (
          ${id},
          ${ownerId},
          ${input.slug},
          ${input.targetUrl},
          ${input.freeTrialUses ?? 3},
          ${input.pricePerRequest ?? '$0.01'},
          ${sql.array(chains)}
        )
        RETURNING *
      `
      return mapEndpoint(row)
    },

    async getEndpoint(id) {
      const [row] = await sql`SELECT * FROM endpoints WHERE id = ${id}`
      return row ? mapEndpoint(row) : null
    },

    async getEndpointBySlug(slug) {
      const [row] = await sql`SELECT * FROM endpoints WHERE slug = ${slug}`
      return row ? mapEndpoint(row) : null
    },

    async listEndpoints(ownerId) {
      const rows = await sql`
        SELECT * FROM endpoints WHERE owner_id = ${ownerId} ORDER BY created_at DESC
      `
      return rows.map(mapEndpoint)
    },

    async deleteEndpoint(id) {
      await sql`DELETE FROM endpoints WHERE id = ${id}`
    },

    async getUsageCount(endpointId, humanId) {
      const [row] = await sql`
        SELECT count FROM usage WHERE endpoint_id = ${endpointId} AND human_id = ${humanId}
      `
      return row ? Number(row.count) : 0
    },

    async incrementUsage(endpointId, humanId) {
      await sql`
        INSERT INTO usage (endpoint_id, human_id, count, last_request_at)
        VALUES (${endpointId}, ${humanId}, 1, NOW())
        ON CONFLICT (endpoint_id, human_id)
        DO UPDATE SET count = usage.count + 1, last_request_at = NOW()
      `
    },

    async hasUsedNonce(nonce) {
      const [row] = await sql`SELECT nonce FROM nonces WHERE nonce = ${nonce}`
      return !!row
    },

    async recordNonce(nonce) {
      await sql`INSERT INTO nonces (nonce) VALUES (${nonce}) ON CONFLICT DO NOTHING`
    },

    async logRequest(log) {
      const id = nanoid(16)
      await sql`
        INSERT INTO request_logs (id, endpoint_id, agent_address, human_id, verified, paid, blocked, status_code, timestamp)
        VALUES (
          ${id},
          ${log.endpointId},
          ${log.agentAddress},
          ${log.humanId},
          ${log.verified},
          ${log.paid},
          ${log.blocked},
          ${log.statusCode},
          ${log.timestamp}
        )
      `
    },

    async getRequestLogs(endpointId, limit = 50) {
      const rows = await sql`
        SELECT * FROM request_logs
        WHERE endpoint_id = ${endpointId}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `
      return rows.map(mapLog)
    },

    async getUsageSummary(endpointId) {
      const [row] = await sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE verified)::int AS verified,
          COUNT(*) FILTER (WHERE paid)::int AS paid,
          COUNT(*) FILTER (WHERE blocked)::int AS blocked
        FROM request_logs
        WHERE endpoint_id = ${endpointId}
      `
      return {
        total: row?.total ?? 0,
        verified: row?.verified ?? 0,
        paid: row?.paid ?? 0,
        blocked: row?.blocked ?? 0,
      }
    },
  }
}

function mapEndpoint(row: Record<string, unknown>): RegisteredEndpoint {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    slug: row.slug as string,
    targetUrl: row.target_url as string,
    freeTrialUses: Number(row.free_trial_uses),
    pricePerRequest: row.price_per_request as string,
    acceptedChains: row.accepted_chains as string[],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapLog(row: Record<string, unknown>): RequestLog {
  return {
    id: row.id as string,
    endpointId: row.endpoint_id as string,
    agentAddress: (row.agent_address as string) || null,
    humanId: (row.human_id as string) || null,
    verified: row.verified as boolean,
    paid: row.paid as boolean,
    blocked: row.blocked as boolean,
    statusCode: Number(row.status_code),
    timestamp: new Date(row.timestamp as string),
  }
}
