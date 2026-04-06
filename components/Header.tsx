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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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
    <header className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-cyan-400" />
        <span className="text-sm font-semibold text-white hidden sm:block">Baymax</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs">{location}</span>
        </div>

        <div className="text-right">
          <div className="text-lg sm:text-xl font-mono text-white">{time}</div>
          <div className="text-[10px] sm:text-xs text-slate-400">{date}</div>
        </div>

        {issueCount > 0 ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-900/50 border border-red-700 rounded text-red-300 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{issueCount} ISSUE{issueCount > 1 ? 'S' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-900/50 border border-emerald-700 rounded text-emerald-300 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ALL CLEAR</span>
          </div>
        )}
      </div>
    </header>
  )
}
