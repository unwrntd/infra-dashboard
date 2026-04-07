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

interface MediaStats {
  sonarr?: { total: number }
  radarr?: { total: number }
  sabnzbd?: { slots: number; bytes: string }
  qbittorrent?: { downloadSpeed: number }
}

async function checkService(ip: string, port: number, path: string): Promise<{ status: 'up' | 'down' | 'unknown'; latency?: number }> {
  const start = Date.now()
  try {
    const res = await fetch(`http://${ip}:${port}${path}`, {
      signal: AbortSignal.timeout(3000),
    })
    const latency = Date.now() - start
    return { status: res.ok ? 'up' : 'down', latency }
  } catch {
    return { status: 'down' }
  }
}

export default function ServiceCardGrid({ title, services }: { title: string; services: typeof DASHBOARD_CONFIG.mediaStack }) {
  const [states, setStates] = useState<Record<string, ServiceState>>({})
  const [mediaStats, setMediaStats] = useState<MediaStats>({})

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

  useEffect(() => {
    async function fetchMediaStats() {
      try {
        const res = await fetch('/api/media')
        if (res.ok) {
          setMediaStats(await res.json())
        }
      } catch {}
    }
    fetchMediaStats()
    const interval = setInterval(fetchMediaStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const upCount = Object.values(states).filter(s => s.status === 'up').length

  function getQueueInfo(name: string): string | undefined {
    if (name === 'Sonarr' && mediaStats.sonarr?.total) return `${mediaStats.sonarr.total} in queue`
    if (name === 'Radarr' && mediaStats.radarr?.total) return `${mediaStats.radarr.total} in queue`
    if (name === 'SABnzbd' && mediaStats.sabnzbd?.slots) {
      const mb = mediaStats.sabnzbd.bytes ? (parseInt(mediaStats.sabnzbd.bytes) / 1024 / 1024).toFixed(0) : '0'
      return `${mediaStats.sabnzbd.slots} @ ${mb}MB`
    }
    if (name === 'qBittorrent' && mediaStats.qbittorrent?.downloadSpeed) {
      const mbps = (mediaStats.qbittorrent.downloadSpeed / 1024 / 1024).toFixed(1)
      return `↓ ${mbps} MB/s`
    }
    return undefined
  }

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <span className="text-[10px] text-slate-500">{upCount}/{services.length}</span>
      </div>
      <div className="flex gap-1 p-1 overflow-x-auto flex-nowrap">
        {services.map((svc) => {
          const state = states[svc.name]
          const queueInfo = getQueueInfo(svc.name)
          return (
            <div
              key={svc.name}
              title={`${svc.name} — ${svc.ip}:${svc.port}${svc.path}`}
              className="flex flex-col items-start px-2 py-1 rounded bg-slate-700/50 flex-shrink-0 min-w-[60px]"
            >
              <div className="flex items-center gap-1">
                {state?.status === 'up' ? (
                  <CheckCircle2 size={8} className="text-emerald-400" />
                ) : state?.status === 'down' ? (
                  <XCircle size={8} className="text-red-400" />
                ) : (
                  <Circle size={8} className="text-slate-500" />
                )}
                <span className="text-[10px] text-slate-300 whitespace-nowrap">{svc.name}</span>
              </div>
              {queueInfo && (
                <div className="text-[9px] text-slate-500 pl-2">{queueInfo}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
