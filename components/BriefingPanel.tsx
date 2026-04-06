'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Calendar, Package, CloudSun, Users } from 'lucide-react'

function getTimeInTimezone(timezone: string, date: Date) {
  return date.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false })
}

function isMorning() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 12
}

function isEvening() {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 2
}

export default function BriefingPanel() {
  const [briefing, setBriefing] = useState<{
    time: string
    type: 'morning' | 'evening' | 'general'
    weather?: { temp: string; condition: string }
    calendar?: { events: string[] }
    actions?: string[]
    backup?: { r2: string; proxmox: string }
    kidsSchedule?: string[]
  }>({ time: '', type: 'general' })

  useEffect(() => {
    const now = new Date()
    const cstTime = getTimeInTimezone('America/Chicago', now)

    const type = isMorning() ? 'morning' : isEvening() ? 'evening' : 'general'

    // Static briefing for now — can be enhanced with real API calls
    setBriefing({
      time: cstTime,
      type,
      weather: { temp: '72°F', condition: 'Partly Cloudy' },
      actions: [
        'Check R2 backup status',
        'Review failed pods',
      ],
      backup: { r2: 'Last: 10:14 PM', proxmox: 'Sun 1:00 AM' },
      kidsSchedule: ['Ella: Japanese Club 3:30 PM', 'Ethan: Track practice 4:00 PM'],
    })
  }, [])

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
        {briefing.type === 'morning' ? (
          <Sun size={14} className="text-yellow-400" />
        ) : briefing.type === 'evening' ? (
          <Moon size={14} className="text-indigo-400" />
        ) : (
          <Calendar size={14} className="text-cyan-400" />
        )}
        <span className="text-sm font-semibold text-white">
          {briefing.type === 'morning' ? 'Morning Briefing' : briefing.type === 'evening' ? 'Evening Briefing' : 'Daily Briefing'}
        </span>
        <span className="text-xs text-slate-400 ml-auto">{briefing.time} CST</span>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-auto max-h-48">
        {/* Weather */}
        {briefing.weather && (
          <div className="flex items-center gap-2">
            <CloudSun size={16} className="text-yellow-400" />
            <span className="text-sm text-white">{briefing.weather.temp}</span>
            <span className="text-xs text-slate-400">{briefing.weather.condition}</span>
          </div>
        )}

        {/* Calendar */}
        {briefing.calendar && (
          <div>
            <div className="text-xs text-slate-400 mb-1">Today's Events</div>
            {briefing.calendar.events.map((e, i) => (
              <div key={i} className="text-xs text-slate-200">{e}</div>
            ))}
          </div>
        )}

        {/* Kids Schedule */}
        {briefing.kidsSchedule && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Users size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400">Kids</span>
            </div>
            {briefing.kidsSchedule.map((s, i) => (
              <div key={i} className="text-xs text-slate-300">{s}</div>
            ))}
          </div>
        )}

        {/* Actions */}
        {briefing.actions && briefing.actions.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 mb-1">Action Items</div>
            {briefing.actions.map((a, i) => (
              <div key={i} className="text-xs text-cyan-300">• {a}</div>
            ))}
          </div>
        )}

        {/* Backup Status */}
        {briefing.backup && (
          <div>
            <div className="text-xs text-slate-400 mb-1">Backup</div>
            <div className="text-xs text-slate-300">R2: {briefing.backup.r2}</div>
            <div className="text-xs text-slate-300">Proxmox: {briefing.backup.proxmox}</div>
          </div>
        )}
      </div>
    </div>
  )
}
