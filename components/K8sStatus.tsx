'use client'

import { useState, useEffect } from 'react'
import { Box, Cpu, MemoryStick, AlertCircle, CheckCircle2 } from 'lucide-react'

interface K8sNode {
  name: string
  status: string
  cpu?: number
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

function getAge(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function NodeCard({ node }: { node: K8sNode }) {
  const conditionReady = node.conditions?.find(c => c.type === 'Ready')?.status === 'True'
  const isHealthy = conditionReady && node.status === 'Ready'

  return (
    <div className={`flex flex-col p-1.5 rounded border text-[10px] ${isHealthy ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-red-700/50 bg-red-900/10'}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-semibold text-white">{node.name}</span>
        {isHealthy ? (
          <CheckCircle2 size={10} className="text-emerald-400" />
        ) : (
          <AlertCircle size={10} className="text-red-400" />
        )}
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <span className="flex items-center gap-0.5">
          <Cpu size={9} />{node.cpu ? `${node.cpu.toFixed(0)}%` : '-'}
        </span>
        <span className="flex items-center gap-0.5">
          <MemoryStick size={9} />{node.memoryUsage ? `${node.memoryUsage}%` : '-'}
        </span>
        <span className="flex items-center gap-0.5">
          <Box size={9} />{node.podCount || '-'}
        </span>
      </div>
    </div>
  )
}

function PodRow({ pod, compact = false }: { pod: K8sPod; compact?: boolean }) {
  const isCrash = pod.status === 'CrashLoopBackOff' || pod.status === 'Error'
  const isPending = pod.status === 'Pending' || pod.status === 'ContainerCreating'
  const dotColor = isCrash ? 'bg-red-400' : isPending ? 'bg-yellow-400' : 'bg-emerald-400'

  return (
    <div className={`flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] ${isCrash ? 'text-red-400' : isPending ? 'text-yellow-400' : 'text-slate-300'} ${compact ? '' : 'border-b border-slate-700/30'}`}>
      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="text-slate-500 w-20 truncate flex-shrink-0">{pod.namespace}</span>
      <span className="flex-1 truncate">{pod.name}</span>
      {pod.restarts > 0 && (
        <span className="text-red-400 flex-shrink-0">{pod.restarts}↺</span>
      )}
      <span className="text-slate-500 flex-shrink-0 w-12 text-right">{pod.age}</span>
    </div>
  )
}

export default function K8sStatus() {
  const [nodes, setNodes] = useState<K8sNode[]>([])
  const [pods, setPods] = useState<K8sPod[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'problem'>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/infrastructure')
        if (res.ok) {
          const data = await res.json()
          console.log('[K8s] Received:', data.k8sNodes?.length, 'nodes,', data.k8sPods?.length, 'pods, namespaces:', [...new Set((data.k8sPods||[]).map((p:any)=>p.namespace))])

          if (data.k8sNodes && Array.isArray(data.k8sNodes)) {
            const parsedNodes: K8sNode[] = data.k8sNodes.map((n: any) => ({
              name: n.name || n.metadata?.name || 'unknown',
              status: n.status || (n.metadata?.name ? 'Ready' : 'Unknown'),
              cpu: n.cpu || 0,
              memoryUsage: n.memoryUsage,
              podCount: n.podCount || 0,
              conditions: n.conditions || [],
            }))
            setNodes(parsedNodes)
            console.log('[K8s] Set nodes:', parsedNodes.length)
            console.log('[K8s] node names:', parsedNodes.map((n: K8sNode) => n.name).join(', '))
          }

          if (data.k8sPods && Array.isArray(data.k8sPods)) {
            const parsedPods: K8sPod[] = data.k8sPods.map((p: any) => ({
              name: p.name || p.metadata?.name || 'unknown',
              namespace: p.namespace || p.metadata?.namespace || 'default',
              status: p.status || 'Unknown',
              restarts: typeof p.restarts === 'number' ? p.restarts : 0,
              age: p.age || '-',
              node: p.node || p.spec?.nodeName || '-',
            }))
            setPods(parsedPods)
            console.log('[K8s] Set pods:', parsedPods.length, 'namespaces:', [...new Set(parsedPods.map(p=>p.namespace))])
          }
        } else {
          console.error('[K8s] HTTP error:', res.status)
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

  const namespaces = [...new Set(pods.map(p => p.namespace))]
  const problemPods = pods.filter(p => p.status === 'CrashLoopBackOff' || p.status === 'Error' || p.status === 'Pending' || p.status === 'ContainerCreating')
  const filteredPods = filter === 'problem' ? problemPods : pods

  console.log('[K8s] filter:', filter, '| totalPods:', pods.length, '| namespaces:', namespaces.length, '| filteredPods:', filteredPods.length)

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Box size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Kubernetes</span>
          <span className="text-xs text-slate-400">{nodes.length} nodes · {pods.length} pods · {namespaces.length} ns</span>
        </div>
        <div className="flex items-center gap-2">
          {problemPods.length > 0 && (
            <span className="text-xs text-red-400">{problemPods.length} issues</span>
          )}
          <div className="flex gap-1">
            {['all', 'problem'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-1.5 py-0.5 text-[10px] rounded ${filter === f ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nodes row */}
      <div className="grid grid-cols-4 gap-1 p-1.5 border-b border-slate-700">
        {loading ? (
          <div className="col-span-4 text-xs text-slate-400 p-1">Loading...</div>
        ) : (
          nodes.map(n => <NodeCard key={n.name} node={n} />)
        )}
      </div>

      {/* Pods — scrollable, all namespaces */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-xs text-slate-400 p-2">Loading pods...</div>
        ) : filteredPods.length === 0 ? (
          <div className="text-xs text-slate-500 p-2">No pods to show</div>
        ) : (
          <>
            {/* Namespace group headers */}
            {namespaces.filter(ns => filter === 'all' || problemPods.some(p => p.namespace === ns)).map(ns => {
              const nsPods = filteredPods.filter(p => p.namespace === ns)
              if (nsPods.length === 0) return null
              return (
                <div key={ns}>
                  <div className="sticky top-0 bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500 font-medium border-b border-slate-700/50">
                    {ns} ({nsPods.length})
                  </div>
                  {nsPods.map((p, i) => <PodRow key={`${p.namespace}-${p.name}-${i}`} pod={p} compact />)}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
