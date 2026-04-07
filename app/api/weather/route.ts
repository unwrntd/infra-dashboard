import { NextResponse } from 'next/server'

const CONDITIONS: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
  80: 'Light Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
  95: 'Thunderstorm',
}

export async function GET() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=30.11&longitude=-95.44&current_weather=true&temperature_unit=fahrenheit',
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return NextResponse.json({ error: 'Weather unavailable' }, { status: 500 })

    const data = await res.json()
    const cw = data.current_weather

    return NextResponse.json({
      temp_F: cw?.temperature?.toFixed(0) || '—',
      condition: CONDITIONS[cw?.weathercode] || `Code ${cw?.weathercode}`,
      humidity: '—',
      wind_mph: cw?.windspeed || '—',
      uvIndex: '—',
      feelsLike_F: '—',
      location: 'Spring, TX',
      updated: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
