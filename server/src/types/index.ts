export interface RegisteredEndpoint {
  id: string
  ownerId: string
  slug: string
  targetUrl: string
  freeTrialUses: number
  pricePerRequest: string
  acceptedChains: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateEndpointInput {
  targetUrl: string
  slug: string
  freeTrialUses?: number
  pricePerRequest?: string
  acceptedChains?: string[]
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
  timestamp: Date
}

export interface UsageSummary {
  total: number
  verified: number
  paid: number
  blocked: number
}

export interface AgentGateStorage {
  createEndpoint(ownerId: string, input: CreateEndpointInput): Promise<RegisteredEndpoint>
  getEndpoint(id: string): Promise<RegisteredEndpoint | null>
  getEndpointBySlug(slug: string): Promise<RegisteredEndpoint | null>
  listEndpoints(ownerId: string): Promise<RegisteredEndpoint[]>
  deleteEndpoint(id: string): Promise<void>

  getUsageCount(endpointId: string, humanId: string): Promise<number>
  incrementUsage(endpointId: string, humanId: string): Promise<void>

  hasUsedNonce(nonce: string): Promise<boolean>
  recordNonce(nonce: string): Promise<void>

  logRequest(log: Omit<RequestLog, 'id'>): Promise<void>
  getRequestLogs(endpointId: string, limit?: number): Promise<RequestLog[]>
  getUsageSummary(endpointId: string): Promise<UsageSummary>
}
