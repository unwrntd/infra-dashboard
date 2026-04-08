'use client'

import { useState, useEffect } from 'react'
import { DASHBOARD_CONFIG } from '@/config/dashboard'
import { Circle, CheckCircle2, XCircle } from 'lucide-react'

// simple-icons slug mapping for services
const LOGO_SLUGS: Record<string, string> = {
  Plex: 'plex',
  Sonarr: 'sonarr',
  Radarr: 'radarr',
  SABnzbd: 'sabnzbd',
  qBittorrent: 'qbittorrent',
  Overseerr: 'overseerr',
  PlexPy: 'tautulli',
  Bazarr: 'bazarr',
  Prowlarr: 'prowlarr',
  LiteLLM: 'litellm',
  Ollama: 'ollama',
  ChromaDB: 'chromadb',
  'OpenWebUI': 'openwebui',
  Meilisearch: 'meilisearch',
  'Wallabag': 'wallabag',
  n8n: 'n8n',
  WikiJS: 'wikijs',
  Gotenberg: 'gotenberg',
  Speedtest: 'ookla',
}

// Cache for loaded icons
let siCache: Record<string, any> = {}

async function loadSi() {
  if (Object.keys(siCache).length > 0) return siCache
  try {
    const mod = await import('simple-icons')
    siCache = mod
  } catch {
    // not available
  }
  return siCache
}

function ServiceLogo({ name, size = 16 }: { name: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadSi().then(si => {
      if (cancelled) return
      const slug = LOGO_SLUGS[name]
      if (!slug || !si) { setLoaded(true); return }
      try {
        const icon = si.getIcon(slug)
        if (icon) {
          // simple-icons v9: icon.svg is available
          const svgStr = (icon as any).svg
          if (svgStr) { setSvg(svgStr); setLoaded(true); return }
        }
      } catch { /* skip */ }
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [name])

  if (!loaded) return <Circle size={size} className="text-slate-500" />
  if (!svg) return <Circle size={size} className="text-slate-500" />

  return (
    <span
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center' }}
      className="flex-shrink-0"
    />
  )
}

interface ServiceState {
  name: string
  status: 'up' | 'down' | 'unknown'
  latency?: number
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`http://${ip}:${port}${path}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)
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
    const interval = setInterval(checkAll, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchMediaStats() {
      try {
        const res = await fetch('/api/media')
        if (res.ok) setMediaStats(await res.json())
      } catch {}
    }
    fetchMediaStats()
    const interval = setInterval(fetchMediaStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const upCount = Object.values(states).filter(s => s.status === 'up').length

  function getQueueInfo(name: string): string | undefined {
    if (name === 'Sonarr' && mediaStats.sonarr?.total) return `${mediaStats.sonarr.total} queued`
    if (name === 'Radarr' && mediaStats.radarr?.total) return `${mediaStats.radarr.total} queued`
    if (name === 'SABnzbd' && mediaStats.sabnzbd?.slots) {
      const mb = mediaStats.sabnzbd.bytes ? (parseInt(mediaStats.sabnzbd.bytes) / 1024 / 1024).toFixed(0) : '0'
      return `${mediaStats.sabnzbd.slots} slots`
    }
    if (name === 'qBittorrent' && mediaStats.qbittorrent?.downloadSpeed) {
      const mbps = (mediaStats.qbittorrent.downloadSpeed / 1024 / 1024).toFixed(1)
      return `↓ ${mbps} MB/s`
    }
    return undefined
  }

  return (
    <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <span className="text-[10px] text-emerald-400/70">{upCount}/{services.length} up</span>
      </div>
      <div className="flex gap-1.5 p-1.5 overflow-x-auto flex-nowrap">
        {services.map((svc) => {
          const state = states[svc.name]
          const queueInfo = getQueueInfo(svc.name)
          return (
            <a
              key={svc.name}
              href={`http://${svc.ip}:${svc.port}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`${svc.name} — ${svc.ip}:${svc.port}`}
              className="flex flex-col items-start px-2 py-1.5 rounded bg-slate-700/50 hover:bg-slate-700 flex-shrink-0 min-w-[72px] transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                {state?.status === 'up' ? (
                  <CheckCircle2 size={9} className="text-emerald-400 flex-shrink-0" />
                ) : state?.status === 'down' ? (
                  <XCircle size={9} className="text-red-400 flex-shrink-0" />
                ) : (
                  <Circle size={9} className="text-slate-500 flex-shrink-0" />
                )}
                <ServiceLogo name={svc.name} size={14} />
                <span className="text-[11px] text-slate-300 whitespace-nowrap group-hover:text-white transition-colors">
                  {svc.name}
                </span>
              </div>
              {queueInfo && (
                <div className="text-[9px] text-slate-500 pl-5 leading-none mt-0.5">{queueInfo}</div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
