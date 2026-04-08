'use client'

import { useState, useEffect } from 'react'
import { DASHBOARD_CONFIG } from '@/config/dashboard'
import { Circle, CheckCircle2, XCircle } from 'lucide-react'

// simple-icons v9 export name mapping (si{TitleCase})
const LOGO_KEYS: Record<string, string> = {
  Plex: 'siPlex',
  Sonarr: 'siSonarr',
  Radarr: 'siRadarr',
  SABnzbd: 'siSABnzbd',
  qBittorrent: 'siQbittorrent',
  Overseerr: 'siOverseerr',
  PlexPy: 'siTautulli',
  Bazarr: 'siBazarr',
  Prowlarr: 'siProwlarr',
  LiteLLM: 'siLiteLLM',
  Ollama: 'siOllama',
  ChromaDB: 'siChromadb',
  Meilisearch: 'siMeilisearch',
  Wallabag: 'siWallabag',
  n8n: 'sin8n',
  WikiJS: 'siWikiJS',
  Gotenberg: 'siGotenberg',
  Speedtest: 'siOokla',
}

// Background colors per service (matches service branding)
const LOGO_COLORS: Record<string, string> = {
  Plex: '#E5A000',
  Sonarr: '#52B2AB',
  Radarr: '#EBA372',
  SABnzbd: '#E5A000',
  qBittorrent: '#02AC74',
  Overseerr: '#5291CE',
  PlexPy: '#02AC74',
  Bazarr: '#B8C5D6',
  Prowlarr: '#B8C5D6',
  LiteLLM: '#4F46E5',
  Ollama: '#E5A000',
  ChromaDB: '#3F0E8C',
  Meilisearch: '#FF5CAA',
  Wallabag: '#D6A841',
  n8n: '#EA4B71',
  WikiJS: '#1E9EFF',
  Gotenberg: '#8B5CF6',
  Speedtest: '#00BBF5',
}

// Cache for loaded simple-icons module
let siModule: any = null

async function getSi() {
  if (siModule) return siModule
  try {
    siModule = await import('simple-icons')
  } catch { /* not available */ }
  return siModule
}

function ServiceLogo({ name, size = 18 }: { name: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [hex, setHex] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSi().then(si => {
      if (cancelled) return
      const key = LOGO_KEYS[name]
      if (!key || !si) { setLoaded(true); return }
      try {
        const icon = (si as any)[key]
        if (icon && icon.svg) {
          setSvg(icon.svg)
          setHex(icon.hex || null)
        }
      } catch { /* skip */ }
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [name])

  if (!loaded) return <div style={{ width: size, height: size }} className="flex-shrink-0" />
  if (!svg) return <Circle size={size} className="text-slate-500 flex-shrink-0" />

  const bg = LOGO_COLORS[name] || hex || '#475569'

  return (
    <span
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderRadius: 4,
        flexShrink: 0,
      }}
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
