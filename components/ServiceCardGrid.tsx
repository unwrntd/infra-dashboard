'use client'

import { useState, useEffect } from 'react'
import { DASHBOARD_CONFIG } from '@/config/dashboard'
import { Circle, CheckCircle2, XCircle } from 'lucide-react'

interface ServiceState {
  name: string
  status: 'up' | 'down' | 'unknown'
  latency?: number
  info?: string
}

async function checkService(ip: string, port: number, path: string): Promise<{ status: 'up' | 'down' | 'unknown'; latency?: number }> {
  const start = Date.now()
  try {
    const res = await fetch(`http://${ip}:${port}${path}`, {
      signal: AbortSignal.timeout(5000),
    })
    const latency = Date.now() - start
    return { status: res.ok ? 'up' : 'down', latency }
  } catch {
    return { status: 'down' }
  }
}

export default function ServiceCardGrid({ title, services }: { title: string; services: typeof DASHBOARD_CONFIG.mediaStack }) {
  const [states, setStates] = useState<Record<string, ServiceState>>({})

  useEffect(() => {
    async function checkAll() {
      const results: Record<string, ServiceState> = {}
      await Promise.all(
        services.map(async (svc) => {
          const result = await checkService(svc.ip, svc.port, svc.path)
          results[svc.name] = { name: svc.name, ...result }
        })
      )
      setStates(results)
    }
    checkAll()
    const interval = setInterval(checkAll, 60000)
    return () => clearInterval(interval)
  }, [])

  const upCount = Object.values(states).filter(s => s.status === 'up').length

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 min-w-0">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <span className="text-[10px] text-slate-500">{upCount}/{services.length}</span>
      </div>
      <div className="flex gap-1 p-1 overflow-x-auto flex-nowrap">
        {services.map((svc) => {
          const state = states[svc.name]
          return (
            <div
              key={svc.name}
              title={`${svc.name} — ${svc.ip}:${svc.port}${svc.path}`}
              className="flex items-center gap-1 px-1.5 py-1 rounded bg-slate-700/50 flex-shrink-0"
            >
              {state?.status === 'up' ? (
                <CheckCircle2 size={8} className="text-emerald-400" />
              ) : state?.status === 'down' ? (
                <XCircle size={8} className="text-red-400" />
              ) : (
                <Circle size={8} className="text-slate-500" />
              )}
              <span className="text-[10px] text-slate-300 whitespace-nowrap">{svc.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
