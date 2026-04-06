'use client'

import { useState, useEffect } from 'react'
import { Server, Cpu, HardDrive, MemoryStick, Activity, Circle } from 'lucide-react'

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

interface NodeData {
  node: string
  containers: Container[]
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}M`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'running' ? 'bg-emerald-400' : status === 'stopped' ? 'bg-slate-500' : 'bg-red-400'
  return <Circle size={8} className={color} fill={color} />
}

export default function ProxmoxGrid() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [nodeFilter, setNodeFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/infrastructure')
        if (res.ok) {
          const data = await res.json()
          if (data.proxmox && Array.isArray(data.proxmox)) {
            setNodes(data.proxmox)
          }
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

  const allContainers = nodes.flatMap(n => n.containers.map(c => ({ ...c, node: n.node })))
  const filtered = allContainers.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false
    if (nodeFilter !== 'all' && c.node !== nodeFilter) return false
    return true
  })

  const runningCount = allContainers.filter(c => c.status === 'running').length
  const totalCount = allContainers.length

  const nodeNames = nodes.map(n => n.node)

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Proxmox</span>
          <span className="text-xs text-slate-400">{runningCount}/{totalCount} running</span>
        </div>
        <div className="flex gap-1">
          {['all', 'running', 'stopped'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-2 py-0.5 text-xs rounded ${filter === f ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto max-h-48">
        {loading ? (
          <div className="p-4 text-slate-400 text-sm">Loading...</div>
        ) : (
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
                    {c.cpu ? `${(c.cpu / 100).toFixed(0)}%` : '-'}
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
        )}
      </div>
    </div>
  )
}
