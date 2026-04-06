'use client'

import { LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import { DASHBOARD_CONFIG } from '@/config/dashboard'

type IconName = keyof typeof Icons

function DynamicIcon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const Icon = Icons[name as IconName] as LucideIcon
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

export default function QuickLinks() {
  return (
    <div className="bg-slate-800 border-b border-slate-700 overflow-x-auto">
      <div className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">
        {DASHBOARD_CONFIG.quickLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name}
            className="flex flex-col items-center justify-center w-14 h-12 rounded-lg hover:bg-slate-700 transition-colors group flex-shrink-0"
          >
            <DynamicIcon name={link.icon} size={20} className="text-slate-300 group-hover:text-cyan-400" />
            <span className="text-[9px] text-slate-500 group-hover:text-slate-300 mt-0.5 truncate w-full text-center px-0.5 max-w-full">
              {link.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
