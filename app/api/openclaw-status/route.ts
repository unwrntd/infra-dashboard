import { NextResponse } from 'next/server'

export async function GET() {
  // Read roxieclaw status from Redis (cached by Baymax host)
  let roxieclaw = { status: 'unknown' as string }
  try {
    const { createClient } = await import('@redis/client')
    const client = createClient({
      socket: { host: '10.0.3.12', port: 30637 },
      password: 'js+VEk19D5QsCqVD08LMbhNtS14ki9xL',
    })
    await client.connect()
    const raw = await client.get('baymax:openclaw:status')
    await client.quit()
    if (raw) {
      const parsed = JSON.parse(raw)
      roxieclaw = (parsed as any).roxieclaw || { status: 'unknown' }
    }
  } catch { /* redis failed */ }

  // Baymax status — K8s pod CAN reach Baymax host at 10.0.3.107
  let baymax = { status: 'unknown', code: '' }
  try {
    const res = await fetch('http://10.0.3.107:18789/health', {
      signal: AbortSignal.timeout(4000),
    })
    const data = await res.json() as { ok: boolean; status: string }
    baymax = { status: data.ok ? 'up' : 'down', code: data.status }
  } catch { /* baymax unreachable */ }

  return NextResponse.json({ baymax, roxieclaw })
}