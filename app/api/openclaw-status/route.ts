import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    // Read OpenClaw status from Redis (cached by Baymax host via check-services.sh)
    const output = execSync(
      "redis-cli -h 10.0.3.12 -p 30637 -a 'js+VEk19D5QsCqVD08LMbhNtS14ki9xL' --no-auth-warning get baymax:openclaw:status",
      { timeout: 5000 }
    ).toString().trim()

    if (!output || output === '(nil)') {
      // Fallback: check baymax directly (this works from K8s pod)
      try {
        const baymaxOut = execSync(
          "curl -sk --max-time 4 http://10.0.3.107:18789/health",
          { timeout: 6000 }
        ).toString().trim()
        const baymaxParsed = JSON.parse(baymaxOut)
        return NextResponse.json({
          baymax: { status: baymaxParsed.ok ? 'up' : 'down', code: baymaxParsed.status },
          roxieclaw: { status: 'unknown', code: 'no_cache' },
        })
      } catch {
        return NextResponse.json({ error: 'baymax unreachable', baymax: { status: 'down' }, roxieclaw: { status: 'unknown' } }, { status: 503 })
      }
    }

    const parsed = JSON.parse(output)
    // Baymax status comes from Redis cache key, or fallback to direct check
    let baymaxStatus = parsed.baymax
    if (!baymaxStatus) {
      try {
        const bm = execSync("curl -sk --max-time 4 http://10.0.3.107:18789/health", { timeout: 6000 }).toString().trim()
        baymaxStatus = { status: JSON.parse(bm).ok ? 'up' : 'down' }
      } catch {
        baymaxStatus = { status: 'down' }
      }
    }

    return NextResponse.json({
      baymax: baymaxStatus,
      roxieclaw: parsed.roxieclaw || { status: 'unknown' },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
