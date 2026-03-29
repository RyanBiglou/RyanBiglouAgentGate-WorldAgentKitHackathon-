import { useState, useEffect } from 'react'
import { Copy, Check, Trash2, ExternalLink, Globe, DollarSign, Zap, Link } from 'lucide-react'
import { api, useSSE, type RegisteredEndpoint, type UsageSummary } from '../api'
import StatsCards from './StatsCards'
import RequestLog from './RequestLog'
import TryItPanel from './TryItPanel'

interface Props {
  endpoint: RegisteredEndpoint
  onDelete: () => void
}

export default function EndpointDetail({ endpoint, onDelete }: Props) {
  const [stats, setStats] = useState<UsageSummary>({ total: 0, verified: 0, paid: 0, blocked: 0 })
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const sseLogs = useSSE(endpoint.id)

  useEffect(() => {
    api.getStats(endpoint.id).then((data) => setStats(data.usage)).catch(() => {})
  }, [endpoint.id])

  useEffect(() => {
    if (sseLogs.length > 0) {
      api.getStats(endpoint.id).then((data) => setStats(data.usage)).catch(() => {})
    }
  }, [sseLogs.length, endpoint.id])

  const proxyUrl = `${window.location.origin}/proxy/${endpoint.slug}/`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(proxyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this endpoint? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.deleteEndpoint(endpoint.id)
      onDelete()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold flex items-center gap-2">
            <span className="text-accent">/</span>proxy/{endpoint.slug}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Link className="w-3 h-3" />
              {endpoint.targetUrl}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg text-xs text-red hover:bg-red-dim transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs">
        <ConfigItem icon={Globe} label="Chains" value={endpoint.acceptedChains.join(', ')} />
        <ConfigItem icon={Zap} label="Free Tier" value={`${endpoint.freeTrialUses} uses/human`} />
        <ConfigItem icon={DollarSign} label="Price" value={`${endpoint.pricePerRequest}/req`} />
        <div className="bg-bg-raised rounded-lg p-3 border border-border-subtle flex items-center gap-2">
          <ExternalLink className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Proxy URL</div>
            <div className="font-mono text-[11px] truncate">{proxyUrl}</div>
          </div>
          <button
            onClick={copyUrl}
            className="ml-auto shrink-0 text-text-muted hover:text-accent transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div>
        <h3 className="font-mono text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Request Log
        </h3>
        <RequestLog logs={sseLogs} />
      </div>

      <TryItPanel endpoint={endpoint} />
    </div>
  )
}

function ConfigItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-bg-raised rounded-lg p-3 border border-border-subtle">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono text-[11px]">{value}</div>
    </div>
  )
}
