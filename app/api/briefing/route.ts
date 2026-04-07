import { NextResponse } from 'next/server'
import { createClient } from 'redis'

const REDIS_HOST = process.env.REDIS_HOST || '10.0.3.12'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '30637')
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''

async function getBriefing() {
  try {
    const url = `redis://${REDIS_HOST}:${REDIS_PORT}`
    const client = createClient({ url, password: REDIS_PASSWORD || undefined })
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
    console.error('Briefing error:', e)
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
