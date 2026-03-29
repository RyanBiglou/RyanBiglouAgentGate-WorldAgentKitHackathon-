import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export interface RegisteredEndpoint {
  id: string
  ownerId: string
  slug: string
  targetUrl: string
  freeTrialUses: number
  pricePerRequest: string
  acceptedChains: string[]
  createdAt: string
  updatedAt: string
}

export interface RequestLog {
  id: string
  endpointId: string
  agentAddress: string | null
  humanId: string | null
  verified: boolean
  paid: boolean
  blocked: boolean
  statusCode: number
  timestamp: string
}

export interface UsageSummary {
  total: number
  verified: number
  paid: number
  blocked: number
}

export interface EndpointStats {
  endpoint: RegisteredEndpoint
  usage: UsageSummary
  recentLogs: RequestLog[]
}

export interface CreateEndpointInput {
  slug: string
  targetUrl: string
  freeTrialUses?: number
  pricePerRequest?: string
  acceptedChains?: string[]
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-owner-id': 'demo-user',
      ...opts?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  listEndpoints: () => apiFetch<RegisteredEndpoint[]>('/api/endpoints'),

  createEndpoint: (input: CreateEndpointInput) =>
    apiFetch<RegisteredEndpoint>('/api/endpoints', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getEndpoint: (id: string) => apiFetch<RegisteredEndpoint>(`/api/endpoints/${id}`),

  deleteEndpoint: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/endpoints/${id}`, { method: 'DELETE' }),

  getStats: (id: string) => apiFetch<EndpointStats>(`/api/endpoints/${id}/stats`),

  getLogs: (id: string, limit = 50) =>
    apiFetch<RequestLog[]>(`/api/endpoints/${id}/logs?limit=${limit}`),
}

export function useSSE(endpointId: string | null) {
  const [logs, setLogs] = useState<RequestLog[]>([])
  const seenIds = useRef(new Set<string>())

  useEffect(() => {
    if (!endpointId) return

    setLogs([])
    seenIds.current.clear()

    const eventSource = new EventSource(
      `${API_BASE}/api/endpoints/${endpointId}/logs/stream`
    )

    eventSource.onmessage = (event) => {
      try {
        const log: RequestLog = JSON.parse(event.data)
        if (seenIds.current.has(log.id)) return
        seenIds.current.add(log.id)
        setLogs((prev) => [log, ...prev].slice(0, 200))
      } catch {}
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }, [endpointId])

  return logs
}

export function useEndpoints() {
  const [endpoints, setEndpoints] = useState<RegisteredEndpoint[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.listEndpoints()
      setEndpoints(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { endpoints, loading, refresh }
}
