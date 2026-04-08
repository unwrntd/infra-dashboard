'use client'

import { useState, useEffect } from 'react'
import { Server, Cpu, HardDrive, MemoryStick, Activity, Circle, RefreshCw } from 'lucide-react'

interface HostMetrics {
  name: string
  status: 'online' | 'offline'
  uptime: number
  cpu: number
  memory: { used: number; total: number; pct: number } | null
  disk: { used: number; total: number; pct: number } | null
  loadavg: number[]
}

interface Container {
  vmid: string
  name: string
  status: string
  cpu?: number
  mem?: number
  maxmem?: number
  maxcpu?: number
  disk?: number
  maxdisk?: number
  uptime?: number
  ip?: string
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}M`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'running' || status === 'online' ? 'bg-emerald-400' : status === 'stopped' || status === 'offline' ? 'bg-slate-500' : 'bg-red-400'
  return <Circle size={8} className={color} fill={color} />
}

function MetricBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export default function ProxmoxGrid() {
  const [hosts, setHosts] = useState<HostMetrics[]>([])
  const [containers, setContainers] = useState<(Container & { node: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'hosts' | 'containers'>('hosts')
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [nodeFilter, setNodeFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/infrastructure')
        if (res.ok) {
          const data = await res.json()
          if (data.proxmoxHosts) setHosts(data.proxmoxHosts)
          if (data.proxmoxContainers) setContainers(data.proxmoxContainers)
        }
      } catch (e) {
        console.error('Failed to fetch proxmox data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = containers.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false
    if (nodeFilter !== 'all' && c.node !== nodeFilter) return false
    return true
  })

  const runningCount = containers.filter(c => c.status === 'running').length
  const totalCount = containers.length
  const nodeNames = [...new Set(containers.map(c => c.node))]

  return (
    <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Server size={12} className="text-cyan-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('hosts')}
              className={`px-2 py-0.5 text-xs rounded ${activeTab === 'hosts' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              Hosts
            </button>
            <button
              onClick={() => setActiveTab('containers')}
              className={`px-2 py-0.5 text-xs rounded ${activeTab === 'containers' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              Containers {runningCount}/{totalCount}
            </button>
          </div>
        </div>
        {activeTab === 'containers' && (
          <div className="flex items-center gap-1">
            <select
              value={nodeFilter}
              onChange={e => setNodeFilter(e.target.value)}
              className="bg-slate-700 text-xs text-slate-300 rounded px-1 py-0.5 border border-slate-600"
            >
              <option value="all">All nodes</option>
              {nodeNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {['all', 'running', 'stopped'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-1.5 py-0.5 text-xs rounded ${filter === f ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hosts view */}
      {activeTab === 'hosts' && (
        <div className="overflow-auto flex-1 p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-slate-400 text-sm flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin" /> Loading...
            </div>
          ) : hosts.length === 0 ? (
            <div className="p-4 text-slate-400 text-sm">No host data</div>
          ) : (
            hosts.map(host => (
              <div key={host.name} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusDot status={host.status} />
                    <span className="text-sm font-semibold text-white">{host.name}</span>
                    <span className="text-xs text-slate-400">{formatUptime(host.uptime)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Activity size={10} /> {host.loadavg.slice(0, 3).join(', ')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* CPU */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Cpu size={10} /> CPU
                      </span>
                      <span className="text-xs text-white font-mono">
                        {host.cpu ? `${(host.cpu * 100).toFixed(1)}%` : '-'}
                      </span>
                    </div>
                    <MetricBar pct={host.cpu ? host.cpu * 100 : 0} color="bg-cyan-500" />
                  </div>
                  {/* Memory */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MemoryStick size={10} /> RAM
                      </span>
                      <span className="text-xs text-white font-mono">
                        {host.memory ? `${host.memory.pct}%` : '-'}
                      </span>
                    </div>
                    <MetricBar pct={host.memory?.pct || 0} color="bg-emerald-500" />
                    <div className="text-xs text-slate-500 mt-0.5">
                      {host.memory ? `${formatBytes(host.memory.used)} / ${formatBytes(host.memory.total)}` : '-'}
                    </div>
                  </div>
                  {/* Disk */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <HardDrive size={10} /> Disk
                      </span>
                      <span className="text-xs text-white font-mono">
                        {host.disk ? `${host.disk.pct}%` : '-'}
                      </span>
                    </div>
                    <MetricBar pct={host.disk?.pct || 0} color="bg-amber-500" />
                    <div className="text-xs text-slate-500 mt-0.5">
                      {host.disk ? `${formatBytes(host.disk.used)} / ${formatBytes(host.disk.total)}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Containers view */}
      {activeTab === 'containers' && (
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 sticky top-0">
              <tr className="text-slate-400 text-left">
                <th className="px-2 py-1 font-medium">S</th>
                <th className="px-2 py-1 font-medium">Name</th>
                <th className="px-2 py-1 font-medium">Node</th>
                <th className="px-2 py-1 font-medium text-right">CPU</th>
                <th className="px-2 py-1 font-medium text-right">Mem</th>
                <th className="px-2 py-1 font-medium text-right">Disk</th>
                <th className="px-2 py-1 font-medium text-right">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={`${c.node}-${c.vmid}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-2 py-1"><StatusDot status={c.status} /></td>
                  <td className="px-2 py-1 text-white font-medium">{c.name}</td>
                  <td className="px-2 py-1 text-slate-400">{c.node}</td>
                  <td className="px-2 py-1 text-right text-slate-300">
                    {c.cpu != null ? `${(c.cpu / 100).toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-2 py-1 text-right text-slate-300">
                    {c.mem ? `${formatBytes(c.mem)}` : '-'}
                  </td>
                  <td className="px-2 py-1 text-right text-slate-300">
                    {c.disk ? `${formatBytes(c.disk)}` : '-'}
                  </td>
                  <td className="px-2 py-1 text-right text-slate-400">
                    {c.uptime ? formatUptime(c.uptime) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
