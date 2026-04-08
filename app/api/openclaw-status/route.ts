import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  const results: Record<string, { status: string; latency?: number; code?: string }> = {}

  // Check Baymax (local)
  try {
    const start = Date.now()
    const output = execSync(
      'curl -sk --max-time 4 http://127.0.0.1:18789/health',
      { timeout: 6000 }
    ).toString().trim()
    const parsed = JSON.parse(output)
    results['baymax'] = {
      status: parsed.ok ? 'up' : 'down',
      latency: Date.now() - start,
      code: parsed.status || 'ok',
    }
  } catch {
    results['baymax'] = { status: 'down', code: 'error' }
  }

  // Check RoxieClaw (192.168.98.116)
  try {
    const start = Date.now()
    const output = execSync(
      'curl -sk --max-time 4 https://192.168.98.116/health',
      { timeout: 6000 }
    ).toString().trim()
    const parsed = JSON.parse(output)
    results['roxieclaw'] = {
      status: parsed.ok ? 'up' : 'down',
      latency: Date.now() - start,
      code: parsed.status || 'ok',
    }
  } catch (e: any) {
    const code = e.status || 'error'
    results['roxieclaw'] = { status: 'down', code: String(code) }
  }

  return NextResponse.json(results)
}
