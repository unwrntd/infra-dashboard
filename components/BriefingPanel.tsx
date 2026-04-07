'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sun, Moon, CloudSun, Calendar, CheckCircle2, Clock, RefreshCw } from 'lucide-react'

function getCSTHour(): number {
  return parseInt(new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', hour12: false }))
}

function getCSTTime(): string {
  return new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false })
}

function getCSTDate(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric' })
}

function isMorning() { const h = getCSTHour(); return h >= 6 && h < 12 }
function isEvening() { const h = getCSTHour(); return h >= 18 || h < 2 }

interface CalendarEvent {
  subject: string
  start: string
  end: string
  location: string
}

interface BriefingCache {
  updated: string
  today: CalendarEvent[]
  tomorrow: CalendarEvent[]
  kids: CalendarEvent[]
  week: CalendarEvent[]
}

interface BriefingData {
  time: string
  date: string
  type: 'morning' | 'evening' | 'general'
  weather?: { temp: string; condition: string; humidity: string }
  calendar?: BriefingCache
  actions?: string[]
  containerCount?: number
  backupR2?: string
  backupProxmox?: string
  calendarSource?: 'live' | 'cache-miss' | 'loading'
}

function formatEventTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return isoString
  }
}

function isToday(isoString: string): boolean {
  try {
    const date = new Date(isoString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

function getTodayKey(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric' })
}

export default function BriefingPanel() {
  const [data, setData] = useState<BriefingData | null>(null)

  const load = useCallback(async () => {
    const now = new Date()
    const cstTime = getCSTTime()
    const cstDate = getCSTDate()
    const type = isMorning() ? 'morning' : isEvening() ? 'evening' : 'general'

    let weather: BriefingData['weather'] = undefined
    try {
      const wRes = await fetch('/api/weather')
      if (wRes.ok) {
        const w = await wRes.json()
        weather = { temp: w.temp_F, condition: w.condition, humidity: w.humidity }
      }
    } catch {}

    let calendar: BriefingData['calendar'] = undefined
    let calendarSource: BriefingData['calendarSource'] = 'loading'
    try {
      const bRes = await fetch('/api/briefing')
      if (bRes.ok) {
        const b = await bRes.json()
        if (b.calendar) {
          calendar = b.calendar
          calendarSource = b.source
        } else {
          calendarSource = 'cache-miss'
        }
      }
    } catch {
      calendarSource = 'cache-miss'
    }

    const actions = type === 'morning'
      ? ['Check overnight alerts', 'Verify backups completed']
      : type === 'evening'
      ? ['Review failed health checks', 'Check download queues']
      : []

    setData({
      time: cstTime,
      date: cstDate,
      type,
      weather,
      calendar,
      calendarSource,
      actions,
      containerCount: 41,
      backupR2: 'Last: 10:14 PM',
      backupProxmox: 'Sun 1:00 AM',
    })
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 300000) // 5 min
    return () => clearInterval(interval)
  }, [load])

  if (!data) return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
        <Calendar size={14} className="text-cyan-400" />
        <span className="text-sm font-semibold text-white">Briefing</span>
      </div>
      <div className="p-3 text-xs text-slate-400">Loading...</div>
    </div>
  )

  const todayEvents = data.calendar?.today || []
  const kidsEvents = data.calendar?.kids || []
  const kidsToday = kidsEvents.filter(e => isToday(e.start))
  const kidsTomorrow = (data.calendar?.tomorrow || []).filter(e => isToday(e.start))

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex items-center gap-2">
          {data.calendarSource === 'live' && (
            <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />CAL
            </span>
          )}
          <span className="text-xs text-slate-400">{data.time}</span>
          <button onClick={load} className="text-slate-500 hover:text-slate-300">
            <RefreshCw size={10} />
          </button>
        </div>
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

        {/* Today's Calendar Events */}
        {todayEvents.length > 0 && (
          <div>
            <div className="text-slate-500 mb-0.5 px-1 flex items-center justify-between">
              <span>Today · {getTodayKey()}</span>
            </div>
            {todayEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-1 px-1 py-0.5 text-slate-300">
                <span className="text-slate-500 flex-shrink-0 w-16">{formatEventTime(e.start)}</span>
                <span className="truncate flex-1">{e.subject}</span>
              </div>
            ))}
          </div>
        )}

        {/* Kids Schedule (from family calendar) */}
        {kidsToday.length > 0 && (
          <div>
            <div className="text-slate-500 mb-0.5 px-1">Kids today</div>
            {kidsToday.map((e, i) => (
              <div key={i} className="flex items-start gap-1 px-1 text-amber-300">
                <span className="text-slate-500 flex-shrink-0 w-16">{formatEventTime(e.start)}</span>
                <span className="truncate flex-1">{e.subject}</span>
              </div>
            ))}
          </div>
        )}
        {kidsToday.length === 0 && kidsTomorrow.length === 0 && (
          <div className="text-slate-600 px-1">No kids activities this week</div>
        )}

        {/* Tomorrow's preview */}
        {(data.calendar?.tomorrow || []).filter(e => isToday(e.start)).length > 0 && (
          <div>
            <div className="text-slate-500 mb-0.5 px-1">Tomorrow</div>
            {(data.calendar?.tomorrow || []).filter(e => isToday(e.start)).map((e, i) => (
              <div key={i} className="flex items-start gap-1 px-1 py-0.5 text-slate-300">
                <span className="text-slate-500 flex-shrink-0 w-16">{formatEventTime(e.start)}</span>
                <span className="truncate flex-1">{e.subject}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
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

        {/* Calendar source indicator */}
        {data.calendarSource === 'cache-miss' && (
          <div className="text-[9px] text-slate-600 px-1">Calendar: cache miss (will refresh shortly)</div>
        )}
        {data.calendarSource === 'loading' && (
          <div className="text-[9px] text-slate-600 px-1">Calendar: loading...</div>
        )}
      </div>
    </div>
  )
}
