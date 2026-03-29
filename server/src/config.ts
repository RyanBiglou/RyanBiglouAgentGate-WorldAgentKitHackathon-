function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required environment variable: ${key}`)
  return val
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback
}

export const config = {
  port: parseInt(optional('PORT', '4021'), 10),
  host: optional('HOST', '0.0.0.0'),
  databaseUrl: optional('DATABASE_URL', 'postgres://agentgate:agentgate@localhost:5432/agentgate'),
  payToAddress: required('PAY_TO_ADDRESS'),
  worldChainId: optional('WORLD_CHAIN_ID', 'eip155:480'),
  baseChainId: optional('BASE_CHAIN_ID', 'eip155:8453'),
  worldUsdcAddress: optional('WORLD_USDC_ADDRESS', '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1'),
  facilitatorUrl: optional('FACILITATOR_URL', 'https://x402-worldchain.vercel.app/facilitator'),
  agentbookNetwork: optional('AGENTBOOK_NETWORK', 'world'),
} as const
