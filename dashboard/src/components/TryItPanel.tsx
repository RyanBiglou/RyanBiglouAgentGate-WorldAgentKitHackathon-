import { useState } from 'react'
import { Play, ChevronDown, ChevronUp } from 'lucide-react'
import type { RegisteredEndpoint } from '../api'

interface Props {
  endpoint: RegisteredEndpoint
}

interface TestResult {
  status: number
  body: string
  type: string
}

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function TryItPanel({ endpoint }: Props) {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)

  const fire = async (type: 'verified' | 'paid' | 'bot') => {
    setLoading(type)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/endpoints/${endpoint.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      setResult({
        status: data.status,
        body: data.message,
        type,
      })
    } catch (err) {
      setResult({
        status: 0,
        body: err instanceof Error ? err.message : 'Request failed',
        type,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-raised hover:bg-bg-surface/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-accent" />
          <span className="font-mono text-xs font-semibold">TRY IT</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-border">
          <p className="text-[11px] text-text-muted">
            Simulate requests to see how AgentGate handles different agent types. Each fires a real log entry.
          </p>
          <div className="flex gap-2">
            <ActionButton
              label="Verified Agent"
              color="accent"
              loading={loading === 'verified'}
              onClick={() => fire('verified')}
            />
            <ActionButton
              label="Unverified Bot"
              color="red"
              loading={loading === 'bot'}
              onClick={() => fire('bot')}
            />
            <ActionButton
              label="Paid Agent"
              color="blue"
              loading={loading === 'paid'}
              onClick={() => fire('paid')}
            />
          </div>

          {result && (
            <div className="animate-fade-in space-y-2">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm font-bold ${
                  result.status >= 400 || result.status === 0 ? 'text-red' :
                  result.status === 402 ? 'text-yellow' : 'text-accent'
                }`}>
                  {result.status || 'ERR'}
                </span>
                <span className="text-[10px] font-mono text-text-muted uppercase">
                  {result.type}
                </span>
              </div>
              <div className="text-[11px] font-mono bg-bg p-3 rounded-lg text-text-muted">
                {result.body}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label,
  color,
  loading,
  onClick,
}: {
  label: string
  color: string
  loading: boolean
  onClick: () => void
}) {
  const colorMap: Record<string, string> = {
    accent: 'bg-accent-dim text-accent hover:bg-accent/20',
    red: 'bg-red-dim text-red hover:bg-red/20',
    blue: 'bg-blue-dim text-blue hover:bg-blue/20',
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex-1 px-3 py-2 rounded-lg font-mono text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer ${colorMap[color]}`}
    >
      {loading ? 'Sending...' : `Send as ${label}`}
    </button>
  )
}
