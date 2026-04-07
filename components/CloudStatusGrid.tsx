'use client'

import { useState, useEffect } from 'react'
import { Cloud, Circle } from 'lucide-react'
import { DASHBOARD_CONFIG } from '@/config/dashboard'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'unknown'
  lastChecked: string
}

export default function CloudStatusGrid() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkService(service: typeof DASHBOARD_CONFIG.cloudServices[0]): Promise<[string, ServiceStatus]> {
      // For self-hosted services, do a real health check
      if (service.isSelfHosted && service.url) {
        try {
          await fetch(service.url, {
            signal: AbortSignal.timeout(5000),
          })
          return [service.name, { name: service.name, status: 'operational', lastChecked: new Date().toISOString() }]
        } catch {
          return [service.name, { name: service.name, status: 'degraded', lastChecked: new Date().toISOString() }]
        }
      }

      // For cloud services, show as unknown (manual config required)
      return [service.name, { name: service.name, status: 'unknown', lastChecked: new Date().toISOString() }]
    }

    async function fetchAll() {
      const results = await Promise.all(
        DASHBOARD_CONFIG.cloudServices.map(checkService)
      )
      const map: Record<string, ServiceStatus> = {}
      results.forEach(([name, status]) => { map[name] = status })
      setStatuses(map)
      setLoading(false)
    }

    fetchAll()
    const interval = setInterval(fetchAll, 300000) // 5 min
    return () => clearInterval(interval)
  }, [])

  function StatusIndicator({ status }: { status: ServiceStatus['status'] }) {
    switch (status) {
      case 'operational':
        return <Circle size={8} className="text-emerald-400 fill-emerald-400" />
      case 'degraded':
        return <Circle size={8} className="text-yellow-400 fill-yellow-400" />
      case 'outage':
        return <Circle size={8} className="text-red-400 fill-red-400" />
      default:
        return <Circle size={8} className="text-slate-500 fill-slate-500" />
    }
  }

  // 3 columns
  const cols = 3
  const services = DASHBOARD_CONFIG.cloudServices
  const rows = []
  for (let i = 0; i < services.length; i += cols) {
    rows.push(services.slice(i, i + cols))
  }

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
        <Cloud size={14} className="text-cyan-400" />
        <span className="text-sm font-semibold text-white">Cloud Services</span>
        <span className="text-xs text-slate-400">{DASHBOARD_CONFIG.cloudServices.length} services</span>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="text-xs text-slate-400">Checking status...</div>
        ) : (
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {services.map((svc) => {
              const s = statuses[svc.name]
              return (
                <div key={svc.name} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-700/50">
                  <StatusIndicator status={s?.status || 'unknown'} />
                  <span className="text-xs text-slate-300 flex-1 truncate">{svc.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
