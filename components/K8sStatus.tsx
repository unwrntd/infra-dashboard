'use client'

import { useState, useEffect } from 'react'
import { Box, Cpu, MemoryStick, AlertCircle, CheckCircle2 } from 'lucide-react'

interface K8sNode {
  name: string
  status: string
  cpu?: number
  memory?: number
  memoryUsage?: number
  podCount?: number
  conditions?: { type: string; status: string }[]
}

interface K8sPod {
  name: string
  namespace: string
  status: string
  restarts: number
  age: string
  node: string
}

function NodeCard({ node }: { node: K8sNode }) {
  const ready = node.conditions?.find(c => c.type === 'Ready')?.status === 'True'
  const isHealthy = ready && node.status === 'Ready'

  return (
    <div className={`flex flex-col p-2 rounded border ${isHealthy ? 'border-emerald-700 bg-emerald-900/20' : 'border-red-700 bg-red-900/20'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-white">{node.name}</span>
        {isHealthy ? (
          <CheckCircle2 size={12} className="text-emerald-400" />
        ) : (
          <AlertCircle size={12} className="text-red-400" />
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-0.5"><Cpu size={10} />{node.cpu ? `${node.cpu.toFixed(0)}%` : '-'}</span>
        <span className="flex items-center gap-0.5"><MemoryStick size={10} />{node.memoryUsage ? `${node.memoryUsage}%` : '-'}</span>
        <span className="flex items-center gap-0.5"><Box size={10} />{node.podCount || '-'}</span>
      </div>
    </div>
  )
}

function PodRow({ pod }: { pod: K8sPod }) {
  const isCrash = pod.status === 'CrashLoopBackOff' || pod.restarts > 5
  const isPending = pod.status === 'Pending' || pod.status === 'ContainerCreating'

  return (
    <div className={`flex items-center gap-2 px-2 py-1 text-[10px] border-b border-slate-700/30 last:border-0 ${isCrash ? 'text-red-400' : isPending ? 'text-yellow-400' : 'text-slate-300'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCrash ? 'bg-red-400' : isPending ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
      <span className="text-slate-500 w-24 truncate flex-shrink-0">{pod.namespace}</span>
      <span className="flex-1 truncate text-white">{pod.name}</span>
      <span className="text-slate-400 w-16 text-right">{pod.restarts > 0 ? `${pod.restarts}↻` : ''}</span>
      <span className="text-slate-500 w-16 text-right">{pod.age}</span>
    </div>
  )
}

export default function K8sStatus() {
  const [nodes, setNodes] = useState<K8sNode[]>([])
  const [pods, setPods] = useState<K8sPod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/infrastructure')
        if (res.ok) {
          const data = await res.json()

          if (data.k8sNodes && Array.isArray(data.k8sNodes)) {
            const parsedNodes = data.k8sNodes.map((n: any) => ({
              name: n.metadata?.name || 'unknown',
              status: n.status?.conditions?.find((c: any) => c.type === 'Ready')?.status || 'Unknown',
              cpu: parseFloat(n.status?.usage?.cpu?.replace('n', '')) / 1e7 || 0,
              memoryUsage: n.status?.memory?.usedBytes && n.status?.memory?.capacityBytes
                ? (n.status.memory.usedBytes / n.status.memory.capacityBytes * 100)
                : undefined,
              podCount: n.status?.podCount || 0,
              conditions: n.status?.conditions || [],
            }))
            setNodes(parsedNodes)
          }

          if (data.k8sPods && Array.isArray(data.k8sPods)) {
            const parsedPods = data.k8sPods.map((p: any) => ({
              name: p.metadata?.name || 'unknown',
              namespace: p.metadata?.namespace || 'default',
              status: p.status?.phase || 'Unknown',
              restarts: p.status?.containerStatuses?.[0]?.restartCount || 0,
              age: p.metadata?.creationTimestamp ? getAge(p.metadata.creationTimestamp) : '-',
              node: p.spec?.nodeName || '-',
            }))
            setPods(parsedPods)
          }
        }
      } catch (e) {
        console.error('K8s fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const problemPods = pods.filter(p => p.status === 'CrashLoopBackOff' || p.restarts > 5 || p.status === 'Pending')

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Box size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Kubernetes</span>
          <span className="text-xs text-slate-400">{nodes.length} nodes · {pods.length} pods</span>
        </div>
        {problemPods.length > 0 && (
          <span className="text-xs text-red-400">{problemPods.length} issues</span>
        )}
      </div>

      {/* Nodes row */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-slate-700">
        {loading ? (
          <div className="col-span-4 text-xs text-slate-400 p-2">Loading nodes...</div>
        ) : (
          nodes.map(n => <NodeCard key={n.name} node={n} />)
        )}
      </div>

      {/* Pods list */}
      <div className="max-h-32 overflow-auto">
        {loading ? (
          <div className="text-xs text-slate-400 p-2">Loading pods...</div>
        ) : pods.length === 0 ? (
          <div className="text-xs text-slate-400 p-2">No pods found</div>
        ) : (
          pods.slice(0, 50).map((p, i) => <PodRow key={`${p.namespace}-${p.name}-${i}`} pod={p} />)
        )}
      </div>
    </div>
  )
}

function getAge(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}
