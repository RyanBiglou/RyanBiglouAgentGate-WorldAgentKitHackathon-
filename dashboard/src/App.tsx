import { useState } from 'react'
import { useEndpoints, type RegisteredEndpoint } from './api'
import Sidebar from './components/Sidebar'
import EndpointDetail from './components/EndpointDetail'
import CreateModal from './components/CreateModal'

export default function App() {
  const { endpoints, loading, refresh } = useEndpoints()
  const [selected, setSelected] = useState<RegisteredEndpoint | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const handleCreated = async () => {
    await refresh()
    setShowCreate(false)
  }

  const handleSelect = (ep: RegisteredEndpoint) => {
    setSelected(ep)
  }

  const handleDelete = async () => {
    setSelected(null)
    await refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        endpoints={endpoints}
        loading={loading}
        selected={selected}
        onSelect={handleSelect}
        onCreateClick={() => setShowCreate(true)}
      />
      <main className="flex-1 overflow-auto">
        {selected ? (
          <EndpointDetail endpoint={selected} onDelete={handleDelete} />
        ) : (
          <EmptyState />
        )}
      </main>
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="font-mono text-4xl mb-3 text-text-muted opacity-30">{'{ }'}</div>
        <p className="text-text-muted text-sm">
          Select an endpoint or register a new one to get started
        </p>
      </div>
    </div>
  )
}
