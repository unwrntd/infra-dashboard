'use client'

import { useState, useEffect } from 'react'
import { Bot, CheckCircle2, XCircle, Circle } from 'lucide-react'

interface InstanceStatus {
  baymax?: { status: string; latency?: number; code?: string }
  roxieclaw?: { status: string; latency?: number; code?: string }
}

function StatusDot({ status }: { status: string }) {
  if (status === 'up') return <CheckCircle2 size={11} className="text-emerald-400" />
  if (status === 'down') return <XCircle size={11} className="text-red-400" />
  return <Circle size={11} className="text-slate-500" />
}

export default function OpenClawStatus() {
  const [instances, setInstances] = useState<Record<string, { status: string; latency?: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/openclaw-status')
        if (res.ok) setInstances(await res.json())
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const INSTANCES = [
    { key: 'baymax', label: 'Baymax', desc: 'Primary assistant' },
    { key: 'roxieclaw', label: 'RoxieClaw', desc: \"Roxie's assistant\" },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={12} className="text-violet-400" />
          <span className="text-xs font-semibold text-white">OpenClaw</span>
        </div>
        <span className="text-[10px] text-slate-400">
          {instances.baymax?.status === 'up' && instances.roxieclaw?.status === 'up'
            ? '2/2 up'
            : `${Object.values(instances).filter(i => i.status === 'up').length}/2 up`}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {loading ? (
          <div className="text-xs text-slate-400 p-1">Loading...</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {INSTANCES.map(inst => {
              const data = instances[inst.key]
              const status = data?.status || 'unknown'
              return (
                <div
                  key={inst.key}
                  className="flex items-center justify-between px-3 py-2 rounded bg-slate-700/40 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={status} />
                    <div className="flex flex-col">
                      <span className={`text-[12px] font-medium ${
                        status === 'down' ? 'text-red-300' : 'text-slate-200'
                      }`}>
                        {inst.label}
                      </span>
                      <span className="text-[9px] text-slate-500">{inst.desc}</span>
                    </div>
                  </div>
                  {data?.latency && (
                    <span className="text-[10px] text-emerald-500">{data.latency}ms</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
