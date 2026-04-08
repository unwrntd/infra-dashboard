'use client'

import { useState, useEffect } from 'react'
import { DASHBOARD_CONFIG } from '@/config/dashboard'
import { Circle, CheckCircle2, XCircle } from 'lucide-react'

// Map Title Case service name -> lowercase Redis key
const NAME_TO_KEY: Record<string, string> = {
  Plex: 'plex', Sonarr: 'sonarr', Radarr: 'radarr',
  Bazarr: 'bazarr', SABnzbd: 'sabnzbd', qBittorrent: 'qbittorrent',
  Overseerr: 'overseerr', Tautulli: 'tautulli', Notifiarr: 'notifiarr',
  PlexPy: 'plexpy', Prowlarr: 'prowlarr',
  LiteLLM: 'litellm', Ollama: 'ollama', ChromaDB: 'chromadb', Meilisearch: 'meilisearch',
  Wallabag: 'wallabag', n8n: 'n8n', WikiJS: 'wikijs', Gotenberg: 'gotenberg', Speedtest: 'speedtest',
  Baymax: 'baymax', RoxieClaw: 'roxieclaw',
}

// simple-icons v9 export name mapping (si{TitleCase})
const LOGO_KEYS: Record<string, string> = {
  Plex: 'siPlex', Sonarr: 'siSonarr', Radarr: 'siRadarr',
  Bazarr: 'siBazarr', SABnzbd: 'siSABnzbd', qBittorrent: 'siQbittorrent',
  Overseerr: 'siOverseerr', Tautulli: 'siTautulli',
  PlexPy: 'siTautulli', Prowlarr: 'siProwlarr',
  LiteLLM: 'siLiteLLM', Ollama: 'siOllama', ChromaDB: 'siChromadb',
  Meilisearch: 'siMeilisearch', Wallabag: 'siWallabag', n8n: 'sin8n',
  WikiJS: 'siWikiJS', Gotenberg: 'siGotenberg', Speedtest: 'siOokla',
  Notifiarr: 'siNotifiarr',
}

const LOGO_COLORS: Record<string, string> = {
  Plex: '#E5A000', Sonarr: '#52B2AB', Radarr: '#EBA372',
  Bazarr: '#B8C5D6', SABnzbd: '#E5A000', qBittorrent: '#02AC74',
  Overseerr: '#5291CE', Tautulli: '#02AC74', Notifiarr: '#5E60CE',
  PlexPy: '#02AC74', Prowlarr: '#B8C5D6',
  LiteLLM: '#4F46E5', Ollama: '#E5A000', ChromaDB: '#3F0E8C',
  Meilisearch: '#FF5CAA', Wallabag: '#D6A841', n8n: '#EA4B71',
  WikiJS: '#1E9EFF', Gotenberg: '#8B5CF6', Speedtest: '#00BBF5',
}

let siModule: any = null
async function getSi() {
  if (siModule) return siModule
  try { siModule = await import('simple-icons') } catch { /* skip */ }
  return siModule
}

function ServiceLogo({ name, size = 18 }: { name: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSi().then(si => {
      if (cancelled) return
      const key = LOGO_KEYS[name]
      if (!key || !si) { setLoaded(true); return }
      try {
        const icon = (si as any)[key]
        if (icon?.svg) setSvg(icon.svg)
      } catch { /* skip */ }
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [name])

  if (!loaded) return <div style={{ width: size, height: size }} className="flex-shrink-0" />
  if (!svg) return <Circle size={size} className="text-slate-500 flex-shrink-0" />

  return (
    <span
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{
        width: size, height: size, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: LOGO_COLORS[name] || '#475569',
        borderRadius: 4, flexShrink: 0,
      }}
    />
  )
}

interface ServiceStatus { [key: string]: { status: string; code: string } }

interface MediaStats {
  sonarr?: { total: number }; radarr?: { total: number }
  sabnzbd?: { slots: number; bytes: string }
  qbittorrent?: { downloadSpeed: number }
}

export default function ServiceCardGrid({ title, services }: { title: string; services: typeof DASHBOARD_CONFIG.mediaStack }) {
  const [health, setHealth] = useState<ServiceStatus>({})
  const [mediaStats, setMediaStats] = useState<MediaStats>({})

  // Fetch service health from backend (Baymax → Redis cache)
  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch('/api/services')
        if (res.ok) {
          const data = await res.json()
          setHealth(data.services || {})
        }
      } catch { /* silent */ }
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keep fetching media stats from dashboard API
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

  function getStatus(name: string): 'up' | 'down' | 'unknown' {
    const key = NAME_TO_KEY[name]
    const h = health[key]
    if (!h) return 'unknown'
    return h.status === 'up' ? 'up' : 'down'
  }

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

  const upCount = services.filter(s => getStatus(s.name) === 'up').length

  return (
    <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <span className="text-[10px] text-emerald-400/70">{upCount}/{services.length} up</span>
      </div>
      <div className="flex gap-1.5 p-1.5 overflow-x-auto flex-nowrap flex-1">
        {services.map((svc) => {
          const status = getStatus(svc.name)
          const queueInfo = getQueueInfo(svc.name)
          return (
            <a
              key={svc.name}
              target="_blank"
              rel="noopener noreferrer"
              href={svc.ip.includes('.') && !svc.ip.match(/^\d+\.\d+\.\d+\.\d+$/) ? `https://${svc.ip}` : `http://${svc.ip}:${svc.port}`}
              title={`${svc.name} — ${svc.ip}:${svc.port}`}
              className="flex flex-col items-start px-2 py-1.5 rounded bg-slate-700/50 hover:bg-slate-700 flex-shrink-0 min-w-[72px] transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                {status === 'up' ? (
                  <CheckCircle2 size={9} className="text-emerald-400 flex-shrink-0" />
                ) : status === 'down' ? (
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
