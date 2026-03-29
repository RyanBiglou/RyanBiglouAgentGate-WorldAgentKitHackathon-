import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { AgentGateStorage, CreateEndpointInput } from '../types/index.js'

export function createApiRoutes(store: AgentGateStorage) {
  const api = new Hono()

  api.get('/endpoints', async (c) => {
    const ownerId = c.req.header('x-owner-id') || 'demo-user'
    const endpoints = await store.listEndpoints(ownerId)
    return c.json(endpoints)
  })

  api.post('/endpoints', async (c) => {
    const ownerId = c.req.header('x-owner-id') || 'demo-user'
    const body = await c.req.json<CreateEndpointInput>()

    if (!body.slug || !body.targetUrl) {
      return c.json({ error: 'slug and targetUrl are required' }, 400)
    }

    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return c.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, 400)
    }

    const existing = await store.getEndpointBySlug(body.slug)
    if (existing) {
      return c.json({ error: `slug "${body.slug}" is already taken` }, 409)
    }

    const endpoint = await store.createEndpoint(ownerId, body)
    return c.json(endpoint, 201)
  })

  api.get('/endpoints/:id', async (c) => {
    const endpoint = await store.getEndpoint(c.req.param('id'))
    if (!endpoint) return c.json({ error: 'Not found' }, 404)
    return c.json(endpoint)
  })

  api.delete('/endpoints/:id', async (c) => {
    await store.deleteEndpoint(c.req.param('id'))
    return c.json({ ok: true })
  })

  api.get('/endpoints/:id/stats', async (c) => {
    const id = c.req.param('id')
    const endpoint = await store.getEndpoint(id)
    if (!endpoint) return c.json({ error: 'Not found' }, 404)

    const [usage, recentLogs] = await Promise.all([
      store.getUsageSummary(id),
      store.getRequestLogs(id, 50),
    ])

    return c.json({ endpoint, usage, recentLogs })
  })

  api.get('/endpoints/:id/logs', async (c) => {
    const id = c.req.param('id')
    const limit = parseInt(c.req.query('limit') || '50', 10)
    const logs = await store.getRequestLogs(id, limit)
    return c.json(logs)
  })

  // Simulation endpoint for the dashboard "Try It" panel.
  // Creates a real log entry and optionally fires a real proxy request.
  api.post('/endpoints/:id/simulate', async (c) => {
    const id = c.req.param('id')
    const endpoint = await store.getEndpoint(id)
    if (!endpoint) return c.json({ error: 'Not found' }, 404)

    const body = await c.req.json<{ type: 'verified' | 'paid' | 'bot' }>()
    const type = body.type || 'bot'

    const fakeAddr = (prefix: string) =>
      `0x${prefix}${'abcdef1234567890'.repeat(2)}`.slice(0, 42)

    const scenarios = {
      verified: {
        agentAddress: fakeAddr('A1'),
        humanId: 'human_verified_demo',
        verified: true,
        paid: false,
        blocked: false,
        statusCode: 200,
      },
      paid: {
        agentAddress: fakeAddr('B2'),
        humanId: 'human_paid_demo',
        verified: false,
        paid: true,
        blocked: false,
        statusCode: 200,
      },
      bot: {
        agentAddress: null,
        humanId: null,
        verified: false,
        paid: false,
        blocked: true,
        statusCode: 402,
      },
    } as const

    const scenario = scenarios[type] ?? scenarios.bot

    await store.logRequest({
      endpointId: id,
      ...scenario,
      timestamp: new Date(),
    })

    return c.json({
      status: scenario.statusCode,
      type,
      message:
        type === 'verified'
          ? 'Agent verified via AgentBook — free tier access granted'
          : type === 'paid'
            ? 'Payment verified via x402 — USDC settled on World Chain'
            : 'No agent credentials — blocked with 402 Payment Required',
    })
  })

  api.get('/endpoints/:id/logs/stream', async (c) => {
    const endpointId = c.req.param('id')
    let lastTimestamp = new Date().toISOString()

    return streamSSE(c, async (stream) => {
      while (true) {
        try {
          const logs = await store.getRequestLogs(endpointId, 100)
          const newLogs = logs.filter(
            (l) => l.timestamp.toISOString() > lastTimestamp
          )

          for (const log of newLogs.reverse()) {
            await stream.writeSSE({ data: JSON.stringify(log) })
          }

          if (newLogs.length > 0) {
            lastTimestamp = newLogs[0].timestamp.toISOString()
          }
        } catch {
          break
        }

        await stream.sleep(2000)
      }
    })
  })

  return api
}
