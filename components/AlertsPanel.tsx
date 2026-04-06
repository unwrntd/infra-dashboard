'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

interface Alert {
  id?: string
  message?: string
  title?: string
  time?: string
  when?: string
  tags?: string[]
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/infrastructure')
        if (res.ok) {
          const data = await res.json()
          if (data.alerts && Array.isArray(data.alerts)) {
            setAlerts(data.alerts)
          }
        }
      } catch (e) {
        console.error('Alerts fetch error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  function getAlertIcon(tags?: string[]) {
    if (!tags || tags.length === 0) return <Info size={12} className="text-blue-400" />
    if (tags.includes('warning') || tags.includes('high')) return <AlertTriangle size={12} className="text-yellow-400" />
    if (tags.includes('critical') || tags.includes('error')) return <AlertTriangle size={12} className="text-red-400" />
    if (tags.includes('ok') || tags.includes('success')) return <CheckCircle2 size={12} className="text-emerald-400" />
    return <Info size={12} className="text-blue-400" />
  }

  function getBorderColor(tags?: string[]) {
    if (!tags || tags.length === 0) return 'border-l-blue-400'
    if (tags.includes('critical') || tags.includes('error')) return 'border-l-red-400'
    if (tags.includes('warning') || tags.includes('high')) return 'border-l-yellow-400'
    return 'border-l-blue-400'
  }

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
        <Bell size={14} className="text-cyan-400" />
        <span className="text-sm font-semibold text-white">Alerts</span>
        {alerts.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-cyan-700 rounded text-white">{alerts.length}</span>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-auto max-h-48">
        {loading ? (
          <div className="p-3 text-xs text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-3 text-xs text-slate-500">No recent alerts</div>
        ) : (
          alerts.slice(0, 20).map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 px-3 py-1.5 border-l-2 ${getBorderColor(alert.tags)} bg-slate-800/50 hover:bg-slate-700/30`}
            >
              {getAlertIcon(alert.tags)}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 truncate">{alert.title || alert.message || JSON.stringify(alert)}</p>
                {alert.when && (
                  <p className="text-[10px] text-slate-500">{new Date(alert.when).toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' })} CST</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
