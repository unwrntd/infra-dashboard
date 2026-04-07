import { NextResponse } from 'next/server'

// Media service health + queue stats
// Keys should be in env or vault in production; using IPs for now

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function getSonarrQueue() {
  const API_KEY = process.env.SONARR_API_KEY || ''
  if (!API_KEY) return null
  const data = await fetchJson('http://10.0.3.137:8989/api/v3/queue?page=1&pageSize=1', {
    'X-Api-Key': API_KEY,
  })
  return data ? { total: data.totalRecords || 0 } : null
}

async function getRadarrQueue() {
  const API_KEY = process.env.RADARR_API_KEY || ''
  if (!API_KEY) return null
  const data = await fetchJson('http://10.0.3.144:7878/api/v3/queue?page=1&pageSize=1', {
    'X-Api-Key': API_KEY,
  })
  return data ? { total: data.totalRecords || 0 } : null
}

async function getSABnzbdQueue() {
  const API_KEY = process.env.SABNZBD_API_KEY || ''
  const data = await fetchJson(`http://10.0.3.101:7777/sabnzbd/api?apikey=${API_KEY}&output=json&mode=queue`)
  return data?.queue ? { slots: data.queue.noofslots, bytes: data.queue.bytes } : null
}

async function getQbitPreferences() {
  const data = await fetchJson('http://10.0.3.146:8090/api/v2/app/preferences')
  return data ? { downloadSpeed: data.download_speed || 0 } : null
}

async function getPlexStatus() {
  const TOKEN = process.env.PLEX_TOKEN || ''
  if (!TOKEN) return null
  // Plex health check — just see if the server responds
  const data = await fetchJson('https://plex.safdia.com/api/resources?X-Plex-Token=' + TOKEN)
  return data ? { connected: true } : null
}

export async function GET() {
  const [sonarr, radarr, sabnzbd, qbit] = await Promise.all([
    getSonarrQueue(),
    getRadarrQueue(),
    getSABnzbdQueue(),
    getQbitPreferences(),
  ])

  return NextResponse.json({
    sonarr,
    radarr,
    sabnzbd,
    qbittorrent: qbit,
  })
}
