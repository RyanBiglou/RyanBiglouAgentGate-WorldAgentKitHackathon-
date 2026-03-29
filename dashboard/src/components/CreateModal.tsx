import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../api'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateModal({ onClose, onCreated }: Props) {
  const [slug, setSlug] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [freeTrialUses, setFreeTrialUses] = useState(3)
  const [pricePerRequest, setPricePerRequest] = useState('$0.01')
  const [worldChain, setWorldChain] = useState(true)
  const [base, setBase] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const acceptedChains: string[] = []
    if (worldChain) acceptedChains.push('eip155:480')
    if (base) acceptedChains.push('eip155:8453')

    if (acceptedChains.length === 0) {
      setError('Select at least one chain')
      setLoading(false)
      return
    }

    try {
      await api.createEndpoint({
        slug,
        targetUrl,
        freeTrialUses,
        pricePerRequest,
        acceptedChains,
      })
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create endpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-raised border border-border rounded-xl w-full max-w-md mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-mono font-semibold text-sm">Register Endpoint</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Field label="Slug" hint="Unique path segment: /proxy/<slug>/*">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-api"
              required
              className="input"
            />
          </Field>

          <Field label="Target URL" hint="Upstream API base URL">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com"
              required
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Free Tier Uses">
              <input
                type="number"
                value={freeTrialUses}
                onChange={(e) => setFreeTrialUses(parseInt(e.target.value, 10) || 0)}
                min={0}
                className="input"
              />
            </Field>
            <Field label="Price per Request">
              <input
                type="text"
                value={pricePerRequest}
                onChange={(e) => setPricePerRequest(e.target.value)}
                placeholder="$0.01"
                className="input"
              />
            </Field>
          </div>

          <Field label="Accepted Chains">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={worldChain}
                  onChange={(e) => setWorldChain(e.target.checked)}
                  className="accent-accent"
                />
                World Chain
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={base}
                  onChange={(e) => setBase(e.target.checked)}
                  className="accent-accent"
                />
                Base
              </label>
            </div>
          </Field>

          {error && (
            <div className="text-red text-xs font-mono bg-red-dim px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-bg-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-accent text-bg font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-muted mb-1 block">{label}</span>
      {hint && <span className="text-[10px] text-text-muted/60 block mb-1">{hint}</span>}
      {children}
    </label>
  )
}
