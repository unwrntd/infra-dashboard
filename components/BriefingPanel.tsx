'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, CloudSun, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

function getTimeInTimezone(timezone: string, date: Date) {
  return date.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false })
}

function getCSTHour(): number {
  const val = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', hour12: false })
  return parseInt(val)
}

function isMorning() {
  const h = getCSTHour()
  return h >= 6 && h < 12
}

function isEvening() {
  const h = getCSTHour()
  return h >= 18 || h < 2
}

interface BriefingData {
  time: string
  type: 'morning' | 'evening' | 'general'
  weather?: { temp: string; condition: string; humidity: string }
  calendar?: { events: { time: string; title: string }[] }
  actions?: string[]
  kidsSchedule?: string[]
  containerCount?: number
  backupR2?: string
  backupProxmox?: string
}

export default function BriefingPanel() {
  const [data, setData] = useState<BriefingData | null>(null)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const cstTime = getTimeInTimezone('America/Chicago', now)
      const type = isMorning() ? 'morning' : isEvening() ? 'evening' : 'general'

      let weather: BriefingData['weather'] = undefined
      try {
        const wRes = await fetch('/api/weather')
        if (wRes.ok) {
          const w = await wRes.json()
          weather = { temp: w.temp_F, condition: w.condition, humidity: w.humidity }
        }
      } catch {}

      // Static for now — calendar integration needs OAuth
      const kidsSchedule = type === 'morning' ? [
        'Ella: Japanese Club 3:30 PM',
        'Ethan: Track practice 4:00 PM',
      ] : type === 'evening' ? [
        'Ella: Drama rehearsal 4:30 PM',
        'Ethan: none today',
      ] : []

      const actions = type === 'morning' ? [
        'Check overnight alerts',
        'Verify backups completed',
      ] : type === 'evening' ? [
        'Review failed health checks',
        'Check download queues',
      ] : []

      setData({
        time: cstTime,
        type,
        weather,
        actions,
        kidsSchedule,
        containerCount: 41,
        backupR2: 'Last: 10:14 PM',
        backupProxmox: 'Sun 1:00 AM',
      })
    }
    load()
  }, [])

  if (!data) return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
        <Calendar size={14} className="text-cyan-400" />
        <span className="text-sm font-semibold text-white">Briefing</span>
      </div>
      <div className="p-3 text-xs text-slate-400">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
        {data.type === 'morning' ? (
          <Sun size={14} className="text-yellow-400" />
        ) : data.type === 'evening' ? (
          <Moon size={14} className="text-indigo-400" />
        ) : (
          <Calendar size={14} className="text-cyan-400" />
        )}
        <span className="text-sm font-semibold text-white">
          {data.type === 'morning' ? 'Morning Briefing' : data.type === 'evening' ? 'Evening Briefing' : 'Daily Briefing'}
        </span>
        <span className="text-xs text-slate-400 ml-auto">{data.time} CST</span>
      </div>

      <div className="flex-1 p-2 space-y-1.5 overflow-auto text-[11px]">

        {/* Weather */}
        {data.weather && (
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-700/40 rounded">
            <CloudSun size={12} className="text-yellow-400" />
            <span className="text-white font-medium">{data.weather.temp}°F</span>
            <span className="text-slate-400">· {data.weather.condition}</span>
            <span className="text-slate-500 ml-auto">{data.weather.humidity}% RH</span>
          </div>
        )}

        {/* Kids Schedule */}
        {data.kidsSchedule && data.kidsSchedule.length > 0 && (
          <div>
            <div className="text-slate-500 mb-0.5 px-1">Kids today</div>
            {data.kidsSchedule.map((s, i) => (
              <div key={i} className="text-slate-300 px-1">{s}</div>
            ))}
          </div>
        )}

        {/* Action Items */}
        {data.actions && data.actions.length > 0 && (
          <div>
            <div className="text-slate-500 mb-0.5 px-1">Actions</div>
            {data.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-1 text-cyan-300 px-1">
                <span>→</span>{a}
              </div>
            ))}
          </div>
        )}

        {/* Container count */}
        {data.containerCount && (
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-400">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <span>{data.containerCount} containers across cluster</span>
          </div>
        )}

        {/* Backup info */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-400">
          <Clock size={10} />
          <span>R2: {data.backupR2}</span>
        </div>
      </div>
    </div>
  )
}
