import type { RequestLog as RequestLogType } from '../api'
import { truncateAddress, formatTimestamp } from '../lib/utils'

interface Props {
  logs: RequestLogType[]
}

function StatusPill({ log }: { log: RequestLogType }) {
  if (log.blocked) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-dim text-red">BLOCKED</span>
  }
  if (log.paid) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-dim text-blue">PAID</span>
  }
  if (log.verified) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-accent-dim text-accent">VERIFIED</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-bg-surface text-text-muted">UNKNOWN</span>
}

export default function RequestLog({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No requests yet. Use the panel below to fire test requests.
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-bg-raised border-b border-border text-text-muted text-left">
            <th className="px-3 py-2 font-medium">Agent Address</th>
            <th className="px-3 py-2 font-medium">Human ID</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">HTTP</th>
            <th className="px-3 py-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-border-subtle hover:bg-bg-surface/50 transition-colors animate-fade-in"
            >
              <td className="px-3 py-2 font-mono text-text-muted">
                {truncateAddress(log.agentAddress)}
              </td>
              <td className="px-3 py-2 font-mono text-text-muted">
                {truncateAddress(log.humanId)}
              </td>
              <td className="px-3 py-2">
                <StatusPill log={log} />
              </td>
              <td className="px-3 py-2 font-mono">
                <span className={log.statusCode >= 400 ? 'text-red' : 'text-accent'}>
                  {log.statusCode}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-text-muted">
                {formatTimestamp(log.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
