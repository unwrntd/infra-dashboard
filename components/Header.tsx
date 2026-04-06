'use client'

import { useState, useEffect } from 'react'
import { Bot, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'

function getTimeInTimezone(timezone: string): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function getDateInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Header({
  timezone = 'America/Chicago',
  location = 'Spring, TX',
  issueCount = 0
}: {
  timezone?: string
  location?: string
  issueCount?: number
}) {
  const [time, setTime] = useState(getTimeInTimezone(timezone))
  const date = getDateInTimezone(timezone)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeInTimezone(timezone))
    }, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
      <div className="flex items-center gap-3">
        <Bot className="w-6 h-6 text-cyan-400" />
        <span className="text-lg font-semibold text-white">Baymax Infrastructure</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>

        <div className="text-right">
          <div className="text-2xl font-mono text-white">{time}</div>
          <div className="text-xs text-slate-400">{date}</div>
        </div>

        {issueCount > 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{issueCount} ISSUE{issueCount > 1 ? 'S' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/50 border border-emerald-700 rounded text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>ALL SYSTEMS GO</span>
          </div>
        )}
      </div>
    </header>
  )
}
