'use client'

import { useState, useEffect } from 'react'
import { Box } from 'lucide-react'

type Status = 'up' | 'down' | 'warning'

interface AppItem {
  name: string
  status: Status
  reason?: string
  ns?: string
}

// Known user-facing services with nice display names
const NICE_NAMES: Record<string, string> = {
  'actualbudget': 'Actual Budget',
  'archivebox': 'Archivebox',
  'bazarr': 'Bazarr',
  'beszel': 'Beszel',
  'browserless': 'Browserless',
  'changedetection': 'Change Detection',
  'cleanuparr': 'Cleanuparr',
  'coderunner': 'Code Runner',
  'dashboard': 'Dashboard',
  'flaresolverr': 'FlareSolverr',
  'gotenberg': 'Gotenberg',
  'infra-dashboard': 'Infra Dashboard',
  'meilisearch': 'Meilisearch',
  'chromadb': 'ChromaDB',
  'notifiarr': 'Notifiarr',
  'ntfy': 'Ntfy',
  'overseerr': 'Overseerr',
  'plant-it': 'Plant-it',
  'prowlarr': 'Prowlarr',
  'radarr': 'Radarr',
  'rustdesk': 'RustDesk',
  'searxng': 'SearXNG',
  'sonarr': 'Sonarr',
  'speedtest-tracker': 'Speedtest',
  'tautulli': 'Tautulli',
  'trek': 'Trek',
  'wallabag': 'Wallabag',
  'whisper': 'Whisper',
  'wikijs': 'Wiki.js',
  'mosquitto': 'Mosquitto',
  'litellm': 'LiteLLM',
  'ollama': 'Ollama',
  'huntarr': 'Huntarr',
  'kitchenowl': 'KitchenOwl',
  'paperless': 'Paperless',
  'immich': 'Immich',
  'node-red': 'Node-RED',
  'wazuh': 'Wazuh',
  'adguard': 'AdGuard',
  'gitea': 'Gitea',
  'homeassistant': 'HomeAssistant',
  'plex': 'Plex',
  'sabnzbd': 'SABnzbd',
  'qbittorrent': 'qBittorrent',
  'coder-runner': 'Code Runner',
  'speedtest': 'Speedtest',
}

// System namespaces to exclude from app listing
const HIDE_NS = new Set(['kube-system', 'cert-manager', 'metallb-system', 'traefik', 'baymax-healthd'])

function getAppName(name: string): string {
  return NICE_NAMES[name] || name.replace(/-runner$/, ' Runner').replace(/-tracker$/, '').replace(/-prom-/, ' ').replace(/kube-prom-stack/, 'Kube-Prom')
}

function StatusDot({ status }: { status: Status }) {
  const colors = { up: 'bg-emerald-400', warning: 'bg-yellow-400', down: 'bg-red-400' }
  const labels = { up: 'text-emerald-400', warning: 'text-yellow-400', down: 'text-red-400' }
  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`}
      title={status}
    />
  )
}

export default function K8sStatus() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/infrastructure')
        if (!res.ok) return
        const data = await res.json()
        const pods: any[] = data.k8sPods || []

        // Extract unique apps per namespace
        const appMap = new Map<string, AppItem>()

        pods.forEach((p: any) => {
          const ns = p.namespace || ''
          if (HIDE_NS.has(ns)) return

          const rawName = p.name || ''
          // Strip random suffix (last segment if alphanumeric)
          const parts = rawName.split('-')
          let appKey = rawName
          if (parts.length > 1) {
            const last = parts[parts.length - 1]
            if (/^[a-f0-9]{8,}$/.test(last) || /^\d+$/.test(last)) {
              appKey = parts.slice(0, -1).join('-')
            }
          }

          const key = `${ns}/${appKey}`
          const podStatus = p.status || ''

          if (!appMap.has(key)) {
            let status: Status = 'up'
            let reason: string | undefined

            if (podStatus === 'CrashLoopBackOff' || podStatus === 'Error' || podStatus === 'Terminated') {
              status = 'down'; reason = 'Crashed'
            } else if (podStatus === 'Pending' || podStatus === 'ContainerCreating') {
              status = 'down'; reason = 'Pending'
            } else if (podStatus === 'Terminating') {
              status = 'down'; reason = 'Terminating'
            } else if ((p.restarts || 0) > 5) {
              status = 'warning'; reason = `${p.restarts} restarts`
            } else if ((p.restarts || 0) > 0) {
              status = 'warning'; reason = `${p.restarts} restart${p.restarts > 1 ? 's' : ''}`
            }

            appMap.set(key, {
              name: appKey,
              status,
              reason,
              ns,
            })
          } else {
            // Already have this app — only downgrade, never upgrade
            const existing = appMap.get(key)!
            const podStatus2 = podStatus
            if (existing.status === 'up') {
              if (podStatus2 === 'CrashLoopBackOff' || podStatus2 === 'Error') {
                existing.status = 'down'; existing.reason = 'Crashed'
              } else if (podStatus2 === 'Pending' || podStatus2 === 'ContainerCreating') {
                existing.status = 'down'; existing.reason = 'Pending'
              } else if ((p.restarts || 0) > 5) {
                existing.status = 'warning'; existing.reason = `${p.restarts} restarts`
              }
            }
          }
        })

        const sorted = Array.from(appMap.values())
          .sort((a, b) => {
            const order: Record<Status, number> = { down: 0, warning: 1, up: 2 }
            if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
            return a.name.localeCompare(b.name)
          })

        setApps(sorted)
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
          <span className="text-xs font-semibold text-white">K8s</span>
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
        ) : apps.length === 0 ? (
          <div className="text-xs text-slate-500 p-2">No apps found</div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            {apps.map(app => (
              <div
                key={`${app.ns}-${app.name}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-700 transition-colors group cursor-default"
                title={app.reason ? `${app.ns}/${app.name}: ${app.reason}` : `${app.ns}/${app.name}`}
              >
                <StatusDot status={app.status} />
                <span className={`text-[11px] truncate ${
                  app.status === 'down' ? 'text-red-300' :
                  app.status === 'warning' ? 'text-yellow-300' : 'text-slate-300'
                }`}>
                  {getAppName(app.name)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
