import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  try {
    const REDIS_PASS = process.env.REDIS_PASSWORD || 'js+VEk19D5QsCqVD08LMbhNtS14ki9xL'
    
    const client = createClient({
      socket: { host: '10.0.3.12', port: 30637 },
      password: REDIS_PASS,
    })
    
    await client.connect()
    const raw = await client.get('baymax:services:status')
    await client.quit()
    
    if (!raw) {
      return NextResponse.json({ services: {}, error: 'No cache yet' }, { status: 503 })
    }
    
    const parsed = JSON.parse(raw)
    const { timestamp, ...services } = parsed
    return NextResponse.json({
      services,
      updated: timestamp ? new Date(timestamp * 1000).toISOString() : null,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error), services: {} }, { status: 500 })
  }
}
