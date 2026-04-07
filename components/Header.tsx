'use client'

import { useState, useEffect } from 'react'
import { Bot, MapPin, AlertTriangle, CheckCircle2, CloudSun } from 'lucide-react'

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

interface Weather {
  temp_F: string
  condition: string
  feelsLike_F: string
  humidity: string
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
  const [weather, setWeather] = useState<Weather | null>(null)

  const date = getDateInTimezone(timezone)

  useEffect(() => {
    setTime(getTimeInTimezone(timezone))
    const interval = setInterval(() => {
      setTime(getTimeInTimezone(timezone))
    }, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather')
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
        }
      } catch {}
    }
    fetchWeather()
    const interval = setInterval(fetchWeather, 300000) // 5 min
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-cyan-400" />
        <span className="text-sm font-semibold text-white hidden sm:block">Baymax</span>
      </div>

      <div className="flex items-center gap-4">
        {weather && (
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <CloudSun className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">{weather.temp_F}°F</span>
            <span className="text-xs text-slate-400 hidden lg:block">{weather.condition}</span>
          </div>
        )}

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
