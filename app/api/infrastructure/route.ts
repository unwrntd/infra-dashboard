import { NextResponse } from 'next/server'

const K8S_TOKEN = process.env.KUBE_TOKEN || ''
const K8S_HOST = '10.0.3.12'
const K8S_PORT = '16443'
const KUBE_URL = `https://${K8S_HOST}:${K8S_PORT}`

async function k8sGet(path: string) {
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
  const [nodes, pods] = await Promise.all([
    k8sGet('/api/v1/nodes'),
    k8sGet('/api/v1/pods?limit=500'),
  ])

  const parsedNodes = (nodes.items || []).map((n: any) => ({
    name: n.metadata.name,
    status: n.status.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
    cpu: n.status.usage?.cpu ? parseFloat(n.status.usage.cpu.replace('n', '')) / 1e7 : 0,
    memoryUsage: n.status.memory?.usedBytes && n.status.memory?.capacityBytes
      ? Math.round((n.status.memory.usedBytes / n.status.memory.capacityBytes) * 100)
      : null,
    podCount: n.status.podCount || 0,
    conditions: n.status.conditions || [],
  }))

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
    // Run all fetches in parallel with generous timeouts
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
    const res = await fetch('http://10.0.3.12:31180/baymax-alerts/json?limit=30')
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}
