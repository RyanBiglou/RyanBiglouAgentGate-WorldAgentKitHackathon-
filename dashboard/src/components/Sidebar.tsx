import { Plus, Radio } from 'lucide-react'
import type { RegisteredEndpoint } from '../api'
import { cn } from '../lib/utils'

interface Props {
  endpoints: RegisteredEndpoint[]
  loading: boolean
  selected: RegisteredEndpoint | null
  onSelect: (ep: RegisteredEndpoint) => void
  onCreateClick: () => void
}

export default function Sidebar({ endpoints, loading, selected, onSelect, onCreateClick }: Props) {
  return (
    <aside className="w-[280px] shrink-0 border-r border-border bg-bg-raised flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-5 h-5 text-accent" />
          <h1 className="font-mono font-bold text-sm tracking-wide">AGENTGATE</h1>
        </div>
        <button
          onClick={onCreateClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register Endpoint
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {loading ? (
          <div className="p-4 text-text-muted text-xs text-center">Loading...</div>
        ) : endpoints.length === 0 ? (
          <div className="p-4 text-text-muted text-xs text-center">
            No endpoints registered yet
          </div>
        ) : (
          <ul className="space-y-1">
            {endpoints.map((ep) => {
              const active = selected?.id === ep.id
              return (
                <li key={ep.id}>
                  <button
                    onClick={() => onSelect(ep)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer',
                      'border-l-2',
                      active
                        ? 'bg-bg-surface border-accent text-text'
                        : 'border-transparent text-text-muted hover:bg-bg-surface/50 hover:text-text'
                    )}
                  >
                    <div className="font-mono text-xs font-medium truncate">
                      /proxy/{ep.slug}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5 truncate">
                      {ep.targetUrl}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-[10px] text-text-muted font-mono text-center">
          AgentGate — AgentKit Hackathon
        </div>
      </div>
    </aside>
  )
}
