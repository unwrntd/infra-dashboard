import { NextResponse } from 'next/server'

// Proxy all infrastructure data through Baymax to avoid CORS and leverage existing credentials

export async function GET() {
  try {
    const results: Record<string, unknown> = {}

    // Proxmox data
    try {
      const pveResults = []
      for (const node of ['proxmox01', 'proxmox02']) {
        const res = await fetch(`https://10.0.3.31:8006/api2/json/nodes/${node}/lxc`, {
          headers: { 'Authorization': `PVEAPIToken=${process.env.PVE_TOKEN}` },
          signal: AbortSignal.timeout(5000)
        })
        if (res.ok) {
          const data = await res.json()
          pveResults.push({ node, containers: data.data || [] })
        }
      }
      results.proxmox = pveResults
    } catch (e) {
      results.proxmox = { error: String(e) }
    }

    // K8s data
    try {
      const res = await fetch('http://10.0.3.12:16443/api/v1/nodes', {
        headers: { 'Authorization': `Bearer ${process.env.KUBE_TOKEN}` },
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        results.k8sNodes = data.items || []
      }
    } catch (e) {
      results.k8sNodes = { error: String(e) }
    }

    // Try to get pods from baymax-tools
    try {
      const res = await fetch('http://10.0.3.12:16443/api/v1/namespaces/baymax-tools/pods', {
        headers: { 'Authorization': `Bearer ${process.env.KUBE_TOKEN}` },
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        results.k8sPods = data.items || []
      }
    } catch (e) {
      results.k8sPods = { error: String(e) }
    }

    // ntfy alerts
    try {
      const res = await fetch('http://10.0.3.12:31180/baymax-alerts/json?limit=20', {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        results.alerts = await res.json()
      }
    } catch (e) {
      results.alerts = { error: String(e) }
    }

    // LiteLLM health
    try {
      const res = await fetch('http://10.0.3.170:4000/health', {
        headers: { 'Authorization': 'Bearer sk-1234' },
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        results.litellm = await res.json()
      } else {
        results.litellm = { status: 'unhealthy', code: res.status }
      }
    } catch (e) {
      results.litellm = { error: String(e) }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
