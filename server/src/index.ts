import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { config } from './config.js'
import { createPostgresStorage } from './storage/postgres.js'
import { createApiRoutes } from './routes/api.js'
import { createProxyHandler } from './proxy/handler.js'

const store = createPostgresStorage(config.databaseUrl)
const app = new Hono()

app.use('/*', cors({ origin: '*' }))

app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
)

const apiRoutes = createApiRoutes(store)
app.route('/api', apiRoutes)

app.all('/proxy/:slug/*', async (c) => {
  const slug = c.req.param('slug')
  const endpoint = await store.getEndpointBySlug(slug)

  if (!endpoint) {
    return c.json({ error: `Endpoint "${slug}" not found` }, 404)
  }

  const handler = createProxyHandler(endpoint, store)

  const originalPath = c.req.path
  const prefix = `/proxy/${slug}`
  const subPath = originalPath.slice(prefix.length) || '/'
  const newUrl = new URL(c.req.url)
  newUrl.pathname = subPath

  const newRequest = new Request(newUrl.toString(), c.req.raw)
  return handler.fetch(newRequest)
})

const banner = `
┌─────────────────────────────────────────┐
│           ⚡  AgentGate  v0.1           │
│                                         │
│   Agent-gated API proxy with x402       │
│   micropayments + World ID verification │
│                                         │
│   Server:  http://${config.host}:${config.port}        │
│   Health:  http://${config.host}:${config.port}/health  │
└─────────────────────────────────────────┘
`

console.log(banner)

serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
})
