'use client'

import { useState, useEffect } from 'react'
import { Circle, RefreshCw } from 'lucide-react'

interface CloudService {
  status: 'up' | 'degraded' | 'auth_required' | 'down'
  code: string
}

interface CloudData {
  services: Record<string, CloudService>
  updated: string | null
}

function statusColor(status: string) {
  switch (status) {
    case 'up': return 'text-emerald-400 fill-emerald-400'
    case 'degraded': return 'text-yellow-400 fill-yellow-400'
    case 'auth_required': return 'text-blue-400 fill-blue-400'
    case 'down': return 'text-red-400 fill-red-400'
    default: return 'text-slate-500 fill-slate-500'
  }
}

function statusLabel(status: string, code: string) {
  switch (status) {
    case 'up': return 'Up'
    case 'degraded': return 'Degraded'
    case 'auth_required': return 'API Key'
    case 'down': return 'Down'
    default: return 'Unknown'
  }
}

export default function CloudStatusGrid() {
  const [data, setData] = useState<CloudData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCloud() {
      try {
        const res = await fetch('/api/cloud')
        if (res.ok) setData(await res.json())
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchCloud()
    const interval = setInterval(fetchCloud, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2">
        <RefreshCw size={10} className="animate-spin" /> Loading cloud status...
      </div>
    )
  }

  if (!data || !data.services || Object.keys(data.services).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
        No cloud status data. Run check-cloud-services.sh.
      </div>
    )
  }

  const services = Object.entries(data.services).filter(([k]) => k !== 'timestamp')
  const upCount = services.filter(([, v]) => (v as CloudService).status === 'up').length

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300">Cloud Services</span>
        <div className="flex items-center gap-2">
          {data.updated && (
            <span className="text-[9px] text-slate-500">
              Updated {new Date(data.updated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago' })} CT}
            </span>
          )}
          <span className="text-[10px] text-emerald-400/70">{upCount}/{services.length} up</span>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-auto">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {services.map(([name, svc]) => (
            <div key={name} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5">
                <Circle size={7} className={`${statusColor(svc.status)} flex-shrink-0`} />
                <span className="text-[11px] text-slate-300">{name}</span>
              </div>
              <span className={`text-[9px] ${
                svc.status === 'up' ? 'text-emerald-400' :
                svc.status === 'degraded' ? 'text-yellow-400' :
                svc.status === 'auth_required' ? 'text-blue-400' :
                'text-red-400'
              }`}>
                {statusLabel(svc.status, svc.code)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
