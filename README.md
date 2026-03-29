# AgentGate

**Agent-gated API proxy with World ID verification and x402 micropayments.**

Register any API endpoint and instantly get AgentKit-powered access control. The proxy verifies that AI agents are backed by real humans (via World ID + AgentBook), gives verified agents a configurable free tier, and falls back to USDC micropayments via the x402 protocol when the free tier runs out. Unregistered bots get blocked.

```
Client Agent ──► AgentGate Proxy ──► Upstream API
                     │
                AgentKit verification
                AgentBook lookup (wallet → humanId)
                x402 payment gate (USDC on World Chain / Base)
                     │
                Developer Dashboard
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL

### 1. Database Setup

```bash
createdb agentgate
```

### 2. Server

```bash
cd server
cp .env.example .env
# Edit .env with your PAY_TO_ADDRESS and DATABASE_URL
npm install
npm run db:migrate
npm run dev
```

Server starts at `http://localhost:4021`.

### 3. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard starts at `http://localhost:5173` and proxies API calls to the server.

## Architecture

### Server (`server/`)

- **Hono v4** — lightweight HTTP framework
- **AgentKit** — World ID agent verification via AgentBook
- **x402 Protocol** — HTTP 402-based USDC micropayments
- **PostgreSQL** — endpoint registry, usage tracking, request logs

### Dashboard (`dashboard/`)

- **React 18 + Vite** — fast dev experience
- **Tailwind CSS v4** — dark terminal-inspired UI
- **SSE** — real-time request log updates

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/endpoints` | List all registered endpoints |
| POST | `/api/endpoints` | Register a new endpoint |
| GET | `/api/endpoints/:id` | Get endpoint details |
| DELETE | `/api/endpoints/:id` | Remove an endpoint |
| GET | `/api/endpoints/:id/stats` | Usage summary + recent logs |
| GET | `/api/endpoints/:id/logs` | Request log history |
| GET | `/api/endpoints/:id/logs/stream` | SSE live log stream |
| ALL | `/proxy/:slug/*` | Proxy requests to upstream |
| GET | `/health` | Health check |

## How It Works

1. **Developer registers an API** via the dashboard, specifying a slug, target URL, free tier limit, and price
2. **An agent sends a request** to `/proxy/<slug>/<path>`
3. **AgentGate checks** if the agent is verified via AgentKit + AgentBook
4. **If verified** and within the free tier → proxy to upstream
5. **If free tier exhausted** → return HTTP 402 with x402 payment requirements
6. **If agent pays** via x402 USDC → proxy to upstream
7. **If unverified** → block with 403

## Environment Variables

See `server/.env.example` for the full list.

## License

MIT
