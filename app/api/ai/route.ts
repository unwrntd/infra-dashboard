import { NextResponse } from 'next/server'

async function getOllamaModels() {
  try {
    const res = await fetch('http://10.0.3.132:9876/api/ps', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { loaded: [], available: [] }
    const data = await res.json()
    return {
      loaded: (data.models || []).map((m: any) => ({ name: m.name, size: m.size || 0 })),
    }
  } catch {
    return { loaded: [] }
  }
}

async function getLiteLLMHealth() {
  try {
    const res = await fetch('http://10.0.3.170:4000/health', { signal: AbortSignal.timeout(5000) })
    if (res.ok) return { status: 'up' }
    if (res.status === 401) {
      const modelRes = await fetch('http://10.0.3.170:4000/v1/models', { signal: AbortSignal.timeout(5000) })
      if (modelRes.ok) {
        const d = await modelRes.json()
        return { status: 'up', models: d.data?.map((m: any) => m.id) || [] }
      }
    }
    return { status: 'degraded' }
  } catch {
    return { status: 'down' }
  }
}

async function getServiceHealth(ip: string, port: number, path: string) {
  try {
    const res = await fetch(`http://${ip}:${port}${path}`, { signal: AbortSignal.timeout(5000) })
    return res.ok ? 'up' : 'down'
  } catch {
    return 'down'
  }
}

export async function GET() {
  const [ollama, litellm, chroma, meili] = await Promise.all([
    getOllamaModels(),
    getLiteLLMHealth(),
    getServiceHealth('10.0.3.12', 30800, '/api/v2/heartbeat'),
    getServiceHealth('10.0.3.12', 30770, '/health'),
  ])
  return NextResponse.json({
    ollama,
    litellm,
    services: { chromadb: chroma, meilisearch: meili },
  })
}
