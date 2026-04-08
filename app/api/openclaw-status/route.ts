import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    // Read roxieclaw status from Redis (cached by Baymax host)
    const roxieRaw = execSync(
      "redis-cli -h 10.0.3.12 -p 30637 -a 'js+VEk19D5QsCqVD08LMbhNtS14ki9xL' --no-auth-warning get baymax:openclaw:status",
      { timeout: 5000 }
    ).toString().trim()

    let roxieclaw = { status: 'unknown' as string }
    if (roxieRaw && roxieRaw !== '(nil)') {
      try {
        const parsed = JSON.parse(roxieRaw)
        roxieclaw = parsed.roxieclaw || { status: 'unknown' }
      } catch { /* parse failed */ }
    }

    // Baymax status — K8s pod CAN reach Baymax host at 10.0.3.107
    let baymax = { status: 'unknown' as string }
    try {
      const bmOut = execSync(
        "curl -sk --max-time 4 http://10.0.3.107:18789/health",
        { timeout: 6000 }
      ).toString().trim()
      const bmParsed = JSON.parse(bmOut)
      baymax = { status: bmParsed.ok ? 'up' : 'down', code: bmParsed.status }
    } catch { /* baymax unreachable */ }

    return NextResponse.json({ baymax, roxieclaw })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
