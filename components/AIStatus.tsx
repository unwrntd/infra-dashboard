'use client'

import { useState, useEffect } from 'react'
import { Cpu, Circle, Bot, CheckCircle2, XCircle } from 'lucide-react'

interface OllamaModel {
  name: string
  size: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024**3) return `${(bytes / 1024**2).toFixed(0)}M`
  return `${(bytes / 1024**3).toFixed(1)}G`
}

function ModelPill({ name, size }: { name: string; size: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/60 rounded">
      <Circle size={6} className="text-emerald-400 fill-emerald-400 flex-shrink-0" />
      <span className="text-[11px] text-slate-200">{name}</span>
      <span className="text-[10px] text-slate-500">{formatSize(size)}</span>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  if (status === 'up') return <CheckCircle2 size={10} className="text-emerald-400" />
  if (status === 'down') return <XCircle size={10} className="text-red-400" />
  return <Circle size={10} className="text-slate-500" />
}

export default function AIStatus() {
  const [data, setData] = useState<{
    ollama: { loaded: OllamaModel[] }
    litellm: { status: string; models?: string[] }
    services: Record<string, string>
  } | null>(null)
  const [openclaw, setOpenclaw] = useState<Record<string, { status: string }>>({})

  useEffect(() => {
    async function fetchAI() {
      try {
        const [aiRes, ocRes] = await Promise.all([
          fetch('/api/ai'),
          fetch('/api/openclaw-status'),
        ])
        if (aiRes.ok) setData(await aiRes.json())
        if (ocRes.ok) setOpenclaw(await ocRes.json())
      } catch { /* silent */ }
    }
    fetchAI()
    const interval = setInterval(fetchAI, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
        Loading AI stack...
      </div>
    )
  }

  const { ollama, litellm, services } = data

  return (
    <div className="flex flex-col gap-3 p-3 overflow-auto">
      {/* OpenClaw Instances */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Bot size={11} className="text-violet-400" />
          <span className="text-[11px] font-semibold text-slate-300">OpenClaw</span>
        </div>
        <div className="flex gap-2">
          {['baymax', 'roxieclaw'].map(inst => {
            const ocData = openclaw[inst]
            const status = ocData?.status || 'unknown'
            return (
              <div key={inst} className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/40 rounded">
                <StatusDot status={status} />
                <span className={`text-[10px] ${status === 'down' ? 'text-red-300' : 'text-slate-300'}`}>
                  {inst === 'baymax' ? 'Baymax' : 'RoxieClaw'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ollama */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Cpu size={11} className="text-cyan-400" />
            <span className="text-[11px] font-semibold text-slate-300">Ollama</span>
            <span className="text-[10px] text-slate-500">{ollama.loaded.length} loaded</span>
          </div>
          <span className="text-[10px] text-emerald-400/70">10.0.3.132:9876</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ollama.loaded.length > 0 ? (
            ollama.loaded.map(m => <ModelPill key={m.name} name={m.name} size={m.size} />)
          ) : (
            <span className="text-[10px] text-slate-500">No models loaded</span>
          )}
        </div>
      </div>

      {/* LiteLLM */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-300">LiteLLM</span>
          <span className={`text-[10px] ${litellm.status === 'up' ? 'text-emerald-400' : litellm.status === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>
            {litellm.status}
          </span>
        </div>
        {litellm.models && litellm.models.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {litellm.models.slice(0, 6).map(m => (
              <span key={m} className="text-[9px] px-1.5 py-0.5 bg-slate-700/40 rounded text-slate-400">{m.split('/').pop()}</span>
            ))}
            {litellm.models.length > 6 && (
              <span className="text-[9px] text-slate-500">+{litellm.models.length - 6} more</span>
            )}
          </div>
        )}
      </div>

      {/* Other AI/Knowledge services */}
      <div className="grid grid-cols-3 gap-1">
        {Object.entries(services).map(([name, status]) => (
          <div key={name} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-[10px] text-slate-400 capitalize">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
