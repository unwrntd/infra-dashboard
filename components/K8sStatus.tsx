'use client'

import { useState, useEffect } from 'react'
import { Box, Circle } from 'lucide-react'

type Status = 'up' | 'down' | 'warning'

interface AppStatus {
  name: string
  namespace: string
  status: Status
  reason?: string
}

function StatusDot({ status }: { status: Status }) {
  const colors = {
    up: 'bg-emerald-400',
    warning: 'bg-yellow-400',
    down: 'bg-red-400',
  }
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />
}

export default function K8sStatus() {
  const [apps, setApps] = useState<AppStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/infrastructure')
        if (!res.ok) return
        const data = await res.json()
        const pods: any[] = data.k8sPods || []

        // Group pods by namespace
        const nsMap = new Map<string, any[]>()
        pods.forEach(p => {
          const ns = p.namespace || p.metadata?.namespace || 'default'
          if (!nsMap.has(ns)) nsMap.set(ns, [])
          nsMap.get(ns)!.push(p)
        })

        // Determine status per namespace
        const appStatuses: AppStatus[] = []
        nsMap.forEach((nsPods, ns) => {
          const hasCrash = nsPods.some(p =>
            p.status === 'CrashLoopBackOff' || p.status === 'Error' || p.status === 'Terminated'
          )
          const hasPending = nsPods.some(p =>
            p.status === 'Pending' || p.status === 'ContainerCreating' || p.status === 'Terminating'
          )
          const hasRestarting = nsPods.some(p => (p.restarts || 0) > 5)

          let status: Status = 'up'
          if (hasCrash || hasPending) status = 'down'
          else if (hasRestarting) status = 'warning'

          appStatuses.push({
            name: ns,
            namespace: ns,
            status,
            reason: hasCrash ? 'Crashed' : hasPending ? 'Pending' : hasRestarting ? 'Restarts' : undefined,
          })
        })

        setApps(appStatuses.sort((a, b) => {
          const order = { down: 0, warning: 1, up: 2 }
          return order[a.status] - order[b.status]
        }))
      } catch (e) {
        console.error('K8s fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const counts = {
    up: apps.filter(a => a.status === 'up').length,
    warning: apps.filter(a => a.status === 'warning').length,
    down: apps.filter(a => a.status === 'down').length,
  }

  return (
    <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Box size={12} className="text-cyan-400" />
          <span className="text-xs font-semibold text-white">K8s Apps</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-emerald-400">{counts.up} up</span>
          {counts.warning > 0 && <span className="text-yellow-400">{counts.warning} warn</span>}
          {counts.down > 0 && <span className="text-red-400">{counts.down} down</span>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-1.5">
        {loading ? (
          <div className="text-xs text-slate-400 p-2">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {apps.map(app => (
              <div
                key={app.name}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-700 transition-colors"
                title={app.reason ? `${app.name}: ${app.reason}` : app.name}
              >
                <StatusDot status={app.status} />
                <span className={`text-[11px] truncate ${
                  app.status === 'down' ? 'text-red-300' :
                  app.status === 'warning' ? 'text-yellow-300' : 'text-slate-300'
                }`}>
                  {app.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
