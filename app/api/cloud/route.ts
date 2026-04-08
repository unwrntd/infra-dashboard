import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const REDIS_PASS = process.env.REDIS_PASSWORD || 'js+VEk19D5QsCqVD08LMbhNtS14ki9xL'
    
    const output = execSync(
      `redis-cli -h 10.0.3.12 -p 30637 -a '${REDIS_PASS}' --no-auth-warning get baymax:cloud:status`,
      { timeout: 5000 }
    ).toString().trim()

    if (!output || output === '(nil)') {
      return NextResponse.json({ services: {}, error: 'No cache yet' }, { status: 503 })
    }

    const parsed = JSON.parse(output)
    const { timestamp, ...services } = parsed
    return NextResponse.json({
      services,
      updated: timestamp ? new Date(timestamp * 1000).toISOString() : null,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error), services: {} }, { status: 500 })
  }
}
