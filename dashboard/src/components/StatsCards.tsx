import { Activity, ShieldCheck, Coins, ShieldOff } from 'lucide-react'
import type { UsageSummary } from '../api'

interface Props {
  stats: UsageSummary
}

const cards = [
  {
    key: 'total' as const,
    label: 'Total Requests',
    icon: Activity,
    color: 'text-text',
    bg: 'bg-bg-surface',
  },
  {
    key: 'verified' as const,
    label: 'Verified',
    icon: ShieldCheck,
    color: 'text-accent',
    bg: 'bg-accent-dim',
  },
  {
    key: 'paid' as const,
    label: 'Paid',
    icon: Coins,
    color: 'text-blue',
    bg: 'bg-blue-dim',
  },
  {
    key: 'blocked' as const,
    label: 'Blocked',
    icon: ShieldOff,
    color: 'text-red',
    bg: 'bg-red-dim',
  },
]

export default function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className={`${bg} rounded-xl p-4 border border-border-subtle`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
              {label}
            </span>
          </div>
          <div className={`font-mono text-2xl font-bold ${color}`}>
            {stats[key].toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
