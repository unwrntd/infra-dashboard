import { NextResponse } from 'next/server'
import { createClient } from 'redis'

const REDIS_URL = 'redis://10.0.3.12:30637'

async function getBriefing() {
  try {
    const client = createClient({ url: REDIS_URL })
    await client.connect()
    const data = await client.get('baymax:calendar:cache')
    await client.disconnect()
    
    if (data) {
      const parsed = JSON.parse(data)
      return {
        calendar: parsed,
        source: 'live'
      }
    }
  } catch (e) {
    console.error('Redis error:', e)
  }
  
  return {
    calendar: null,
    source: 'cache-miss'
  }
}

export async function GET() {
  const briefing = await getBriefing()
  return NextResponse.json(briefing)
}
