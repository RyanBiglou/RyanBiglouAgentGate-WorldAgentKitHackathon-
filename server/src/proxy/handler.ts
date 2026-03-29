import { Hono } from 'hono'
import { HTTPFacilitatorClient } from '@x402/core/http'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import {
  x402ResourceServer,
  x402HTTPResourceServer,
} from '@x402/hono'
import { paymentMiddlewareFromHTTPServer } from '@x402/hono'
import {
  createAgentBookVerifier,
  createAgentkitHooks,
  declareAgentkitExtension,
  agentkitResourceServerExtension,
  parseAgentkitHeader,
} from '@worldcoin/agentkit'
import type { Network } from '@x402/hono'

import { config } from '../config.js'
import { createAgentKitStorageAdapter } from '../storage/agentkit-adapter.js'
import type { RegisteredEndpoint, AgentGateStorage } from '../types/index.js'

export function createProxyHandler(
  endpoint: RegisteredEndpoint,
  store: AgentGateStorage
): Hono {
  const app = new Hono()

  const facilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl })

  const evmScheme = new ExactEvmScheme()
  evmScheme.registerMoneyParser(async (amount: number, _network: Network) => ({
    asset: config.worldUsdcAddress,
    amount: String(amount),
  }))

  const resourceServer = new x402ResourceServer(facilitator)
  for (const chain of endpoint.acceptedChains) {
    resourceServer.register(chain as Network, evmScheme)
  }
  resourceServer.registerExtension(agentkitResourceServerExtension)

  const agentBook = createAgentBookVerifier()

  const agentKitStorage = createAgentKitStorageAdapter(
    store,
    endpoint.id,
    endpoint.freeTrialUses,
  )

  // Store verified agent info per request so the logger can access it
  const verifiedAgents = new Map<string, { address: string; humanId: string }>()

  const hooks = createAgentkitHooks({
    agentBook,
    storage: agentKitStorage,
    mode: { type: 'free-trial', uses: endpoint.freeTrialUses },
    onEvent: (event) => {
      if (event.type === 'agent_verified' && 'address' in event && 'humanId' in event) {
        verifiedAgents.set(event.address, {
          address: event.address,
          humanId: event.humanId as string,
        })
      }
      console.log(`[agentkit:${endpoint.slug}]`, event.type, 'address' in event ? event.address : '', 'error' in event ? event.error : '')
    },
  })

  const accepts = endpoint.acceptedChains.map((chain) => ({
    scheme: 'exact' as const,
    network: chain as Network,
    payTo: config.payToAddress,
    price: endpoint.pricePerRequest,
  }))

  const agentkitExtensions = declareAgentkitExtension({
    mode: { type: 'free-trial', uses: endpoint.freeTrialUses },
  })

  const routes = {
    '/**': {
      accepts,
      extensions: agentkitExtensions,
    },
  }

  const httpServer = new x402HTTPResourceServer(resourceServer, routes)
  httpServer.onProtectedRequest(hooks.requestHook)

  app.use('/*', async (c, next) => {
    // Extract agent address from the agentkit header before middleware runs
    let agentAddress: string | null = null
    const agentkitHeader = c.req.header('agentkit')
    if (agentkitHeader) {
      try {
        const payload = parseAgentkitHeader(agentkitHeader)
        agentAddress = payload.address
      } catch {}
    }

    await next()

    const statusCode = c.res.status
    const agentInfo = agentAddress ? verifiedAgents.get(agentAddress) : null
    if (agentAddress) verifiedAgents.delete(agentAddress)

    const paid = statusCode === 200 && c.res.headers.get('x-payment-response') !== null
    const verified = statusCode === 200 && !paid && agentInfo !== null
    const blocked = statusCode === 402 || statusCode === 403

    store.logRequest({
      endpointId: endpoint.id,
      agentAddress: agentInfo?.address ?? agentAddress,
      humanId: agentInfo?.humanId ?? null,
      verified,
      paid,
      blocked,
      statusCode,
      timestamp: new Date(),
    }).catch(() => {})
  })

  app.use('/*', paymentMiddlewareFromHTTPServer(httpServer))

  app.all('/*', async (c) => {
    const subPath = c.req.path
    const targetUrl = new URL(subPath, endpoint.targetUrl).toString()
    const url = new URL(targetUrl)
    url.search = new URL(c.req.url).search

    const headers = new Headers(c.req.raw.headers)
    headers.delete('host')
    headers.delete('accept-encoding')

    let upstreamStatus: number
    let upstreamBody: string
    let upstreamHeaders: Record<string, string> = {}
    try {
      const upstreamResponse = await fetch(url.toString(), {
        method: c.req.method,
        headers,
        body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : c.req.raw.body,
      })
      upstreamStatus = upstreamResponse.status
      upstreamBody = await upstreamResponse.text()
      upstreamResponse.headers.forEach((v, k) => {
        if (k.toLowerCase() !== 'content-encoding' && k.toLowerCase() !== 'transfer-encoding') {
          upstreamHeaders[k] = v
        }
      })
    } catch {
      upstreamStatus = 502
      upstreamBody = 'Upstream unavailable'
    }

    return c.body(upstreamBody, upstreamStatus as any, upstreamHeaders)
  })

  return app
}
