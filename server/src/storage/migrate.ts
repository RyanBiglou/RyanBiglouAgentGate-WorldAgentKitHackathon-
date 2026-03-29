import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://agentgate:agentgate@localhost:5432/agentgate'

async function migrate() {
  const sql = postgres(DATABASE_URL)

  console.log('Running AgentGate migrations...')

  await sql`
    CREATE TABLE IF NOT EXISTS endpoints (
      id              TEXT PRIMARY KEY,
      owner_id        TEXT NOT NULL,
      slug            TEXT UNIQUE NOT NULL,
      target_url      TEXT NOT NULL,
      free_trial_uses INTEGER NOT NULL DEFAULT 3,
      price_per_request TEXT NOT NULL DEFAULT '$0.01',
      accepted_chains TEXT[] NOT NULL DEFAULT '{"eip155:480","eip155:8453"}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS usage (
      endpoint_id     TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      human_id        TEXT NOT NULL,
      count           INTEGER NOT NULL DEFAULT 0,
      last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (endpoint_id, human_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS nonces (
      nonce           TEXT PRIMARY KEY,
      used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS request_logs (
      id              TEXT PRIMARY KEY,
      endpoint_id     TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      agent_address   TEXT,
      human_id        TEXT,
      verified        BOOLEAN NOT NULL DEFAULT FALSE,
      paid            BOOLEAN NOT NULL DEFAULT FALSE,
      blocked         BOOLEAN NOT NULL DEFAULT FALSE,
      status_code     INTEGER NOT NULL,
      timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_logs_endpoint ON request_logs (endpoint_id, timestamp DESC)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_endpoints_owner ON endpoints (owner_id)
  `

  console.log('Migrations complete.')
  await sql.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
