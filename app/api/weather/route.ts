import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // wttr.in - free, no API key needed
    const res = await fetch('https://wttr.in/Spring,TX?format=j1', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ error: 'Weather unavailable' }, { status: 500 })

    const data = await res.json()
    const current = data.current_condition?.[0]

    return NextResponse.json({
      temp_F: current?.temp_F?.[0] || '—',
      condition: current?.weatherDesc?.[0]?.value || 'Unknown',
      humidity: current?.humidity?.[0] || '—',
      wind_mph: current?.windspeedKmph?.[0] || '—',
      uvIndex: current?.UVindex?.[0] || '—',
      feelsLike_F: current?.FeelsLikeF?.[0] || '—',
      location: data.nearest_area?.[0]?.areaName?.[0]?.value || 'Spring, TX',
      updated: current?.localObsDateTime?.[0] || new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
