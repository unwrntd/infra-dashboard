'use client'

import { useState, useEffect, useCallback } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import Header from '@/components/Header'
import QuickLinks from '@/components/QuickLinks'
import AlertsPanel from '@/components/AlertsPanel'
import BriefingPanel from '@/components/BriefingPanel'
import CloudStatusGrid from '@/components/CloudStatusGrid'
import ProxmoxGrid from '@/components/ProxmoxGrid'
import K8sStatus from '@/components/K8sStatus'
import ServiceCardGrid from '@/components/ServiceCardGrid'
import AIStatus from '@/components/AIStatus'
import OpenClawStatus from '@/components/OpenClawStatus'
import ErrorBoundary from '@/components/ErrorBoundary'
import { DASHBOARD_CONFIG } from '@/config/dashboard'
import 'react-grid-layout/css/styles.css'

const ResponsiveGridLayout = WidthProvider(GridLayout)

const STORAGE_KEY = 'baymax-dashboard-layout-v1'

// Default 12-col layout for 1920px screens
const DEFAULT_LAYOUT = [
  { i: 'alerts',      x: 0,  y: 0, w: 2, h: 4,  minW: 2, minH: 3 },
  { i: 'briefing',    x: 0,  y: 4, w: 2, h: 5,  minW: 2, minH: 4 },
  { i: 'cloud',       x: 2,  y: 0, w: 5, h: 4,  minW: 3, minH: 3 },
  { i: 'proxmox',     x: 2,  y: 4, w: 5, h: 5,  minW: 3, minH: 4 },
  { i: 'k8s',         x: 7,  y: 0, w: 5, h: 9,  minW: 3, minH: 6 },
  { i: 'media',       x: 0,  y: 9, w: 6, h: 5,  minW: 3, minH: 4 },
  { i: 'ai',          x: 6,  y: 9, w: 6, h: 5,  minW: 3, minH: 4 },
]

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}

export default function Dashboard() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayout(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [])

  const onLayoutChange = useCallback((newLayout: typeof layout) => {
    setLayout(newLayout)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout))
    } catch { /* ignore */ }
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
        <Header timezone={DASHBOARD_CONFIG.location.timezone} location={DASHBOARD_CONFIG.location.name} />
        <QuickLinks />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">

      <Header timezone={DASHBOARD_CONFIG.location.timezone} location={DASHBOARD_CONFIG.location.name} />
      <QuickLinks />

      <div className="flex-1 overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={48}
          margin={[8, 8]}
          containerPadding={[8, 8]}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          resizeHandles={['se']}
          useCSSTransforms
        >
          <div key="alerts" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">Alerts</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Panel><AlertsPanel /></Panel>
            </div>
          </div>

          <div key="briefing" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">Briefing</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Panel><BriefingPanel /></Panel>
            </div>
          </div>

          <div key="cloud" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">Cloud & Network</span>
            </div>
            <div className="flex-1 overflow-auto">
              <Panel><CloudStatusGrid /></Panel>
            </div>
          </div>

          <div key="proxmox" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">Proxmox</span>
            </div>
            <div className="flex-1 overflow-auto">
              <Panel><ProxmoxGrid /></Panel>
            </div>
          </div>

          <div key="k8s" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">Kubernetes</span>
            </div>
            <div className="flex-1 overflow-auto">
              <Panel><K8sStatus /></Panel>
            </div>
          </div>

          <div key="media" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">Media Stack</span>
            </div>
            <div className="flex-1 overflow-auto">
              <Panel><ServiceCardGrid title="Media Stack" services={DASHBOARD_CONFIG.mediaStack} /></Panel>
            </div>
          </div>

          <div key="ai" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">AI Stack</span>
            </div>
            <div className="flex-1 overflow-auto">
              <Panel><AIStatus /></Panel>
            </div>
          </div>

          <div key="openclaw" className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
            <div className="drag-handle px-3 py-2 bg-slate-900 border-b border-slate-700 cursor-move flex items-center gap-2">
              <span className="text-xs text-slate-400">⋮⋮</span>
              <span className="text-xs font-semibold text-white">OpenClaw</span>
            </div>
            <div className="flex-1 overflow-auto">
              <Panel><OpenClawStatus /></Panel>
            </div>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}
