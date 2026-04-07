import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'

// Use in-cluster service account token (auto-mounted in K8s)
function getK8sToken() {
  try {
    return readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8').trim()
  } catch {
    return process.env.KUBE_TOKEN || ''
  }
}
const KUBE_URL = 'https://kubernetes.default.svc.cluster.local'

async function k8sGet(path: string) {
  const K8S_TOKEN = getK8sToken()
  if (!K8S_TOKEN) return { error: 'No K8s token' }
  try {
    const res = await fetch(`${KUBE_URL}${path}`, {
      headers: { 'Authorization': `Bearer ${K8S_TOKEN}` },
    })
    if (!res.ok) return { error: `K8s API ${res.status}` }
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function getK8sData() {
  // Fetch nodes, pods, and node metrics in parallel
  const [nodes, pods, metrics] = await Promise.all([
    k8sGet('/api/v1/nodes'),
    k8sGet('/api/v1/pods?limit=500'),
    k8sGet('/apis/metrics.k8s.io/v1beta1/nodes'),
  ])

  // Build metrics lookup: nodeName -> { cpu, memory }
  const metricsMap: Record<string, { cpu: number; memoryUsage: number }> = {}
  if (metrics.items) {
    for (const m of metrics.items) {
      const cpuNanocores = parseFloat(m.usage.cpu.replace('n', '')) || 0
      const cpuPercent = cpuNanocores / 1e7 // convert nanocores to % of one core
      const memUsed = parseInt(m.usage.memory.replace('Ki', '')) || 0
      const memCapacity = memUsed // approximate — we'll skip capacity-based %
      metricsMap[m.metadata.name] = {
        cpu: Math.round(cpuPercent * 100) / 100,
        memoryUsage: memUsed, // store Ki used
      }
    }
  }

  const parsedNodes = (nodes.items || []).map((n: any) => {
    const m = metricsMap[n.metadata.name]
    return {
      name: n.metadata.name,
      status: n.status.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
      cpu: m?.cpu || 0,
      memoryUsage: m?.memoryUsage ? Math.round((m.memoryUsage / 1024 / 1024) * 10) / 10 : null, // GiB used
      podCount: n.status.podCount || 0,
      conditions: n.status.conditions || [],
    }
  })

  const parsedPods = (pods.items || []).map((p: any) => ({
    name: p.metadata.name,
    namespace: p.metadata.namespace,
    status: p.status.phase,
    restarts: p.status.containerStatuses?.[0]?.restartCount || 0,
    age: p.metadata.creationTimestamp ? getAge(p.metadata.creationTimestamp) : '-',
    node: p.spec.nodeName,
  }))

  return { nodes: parsedNodes, pods: parsedPods }
}

function getAge(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

export async function GET() {
  try {
    const [k8s, pve, ntfyData] = await Promise.all([
      getK8sData(),
      getProxmoxData(),
      getNtfyData(),
    ])

    return NextResponse.json({
      k8sNodes: k8s.nodes,
      k8sPods: k8s.pods,
      proxmox: pve,
      alerts: ntfyData,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function getProxmoxData() {
  const PVE_TOKEN = process.env.PVE_TOKEN || ''
  if (!PVE_TOKEN) return []

  const nodes = ['proxmox01', 'proxmox02']
  const results = await Promise.all(
    nodes.map(async (node) => {
      try {
        const res = await fetch(`https://10.0.3.31:8006/api2/json/nodes/${node}/lxc`, {
          headers: { 'Authorization': `PVEAPIToken=${PVE_TOKEN}` },
        })
        if (!res.ok) return { node, error: `HTTP ${res.status}` }
        const data = await res.json()
        return { node, containers: data.data || [] }
      } catch (e: any) {
        return { node, error: e.message }
      }
    })
  )
  return results
}

async function getNtfyData() {
  try {
    const res = await fetch('http://10.0.3.12:31180/baymax-alerts/json?poll=1&limit=30')
    if (!res.ok) return []
    const text = await res.text()
    const lines = text.trim().split('\n')
    const alerts = []
    for (const line of lines) {
      if (!line || line.includes('"event":"open"')) continue
      try { alerts.push(JSON.parse(line)) } catch { /* skip bad lines */ }
    }
    return alerts.slice(0, 30)
  } catch {
    return []
  }
}
