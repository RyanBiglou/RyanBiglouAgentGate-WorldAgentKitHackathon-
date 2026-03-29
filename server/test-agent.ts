import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { worldchain } from 'viem/chains'
import { formatSIWEMessage } from '@worldcoin/agentkit'

const AGENT_PRIVATE_KEY = '0x840ed6c4ae08aaa7116c8b0f5445548c25af82b06d8bae67ee1c91174d13c548'
const PROXY_BASE = 'http://localhost:4021/proxy/test-api'
const CHAIN_ID = 'eip155:480'

const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`)
console.log(`Agent address: ${account.address}\n`)

const walletClient = createWalletClient({
  account,
  chain: worldchain,
  transport: http(),
})

async function buildAgentkitHeader(resourceUrl: string) {
  const url = new URL(resourceUrl)
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const issuedAt = new Date().toISOString()

  const info = {
    domain: url.hostname,
    uri: resourceUrl,
    version: '1',
    chainId: CHAIN_ID,
    type: 'eip191' as const,
    nonce,
    issuedAt,
  }

  const message = formatSIWEMessage(info, account.address)
  console.log('SIWE message:\n', message, '\n')

  const signature = await walletClient.signMessage({ message })

  const payload = {
    domain: url.hostname,
    address: account.address,
    uri: resourceUrl,
    version: '1',
    chainId: CHAIN_ID,
    type: 'eip191',
    nonce,
    issuedAt,
    signature,
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

async function sendRequest(label: string) {
  console.log(`--- ${label} ---`)

  const resourceUrl = `${PROXY_BASE}/get`
  const header = await buildAgentkitHeader(resourceUrl)

  try {
    const res = await fetch(resourceUrl, {
      headers: { agentkit: header },
    })

    console.log(`Status: ${res.status}`)
    const body = await res.text()
    console.log(`Body: ${body.slice(0, 500)}`)

    if (res.status === 402) {
      console.log('→ Payment required (free tier exhausted or not verified)')
    } else if (res.status === 200) {
      console.log('→ Access granted!')
    }
  } catch (err) {
    console.error('Request failed:', err)
  }
  console.log()
}

async function main() {
  for (let i = 1; i <= 5; i++) {
    await sendRequest(`Request ${i} of 5`)
  }
}

main()
