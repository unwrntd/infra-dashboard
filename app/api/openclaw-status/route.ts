import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  let roxieclaw = { status: "unknown" as string, code: "" }
  let baymax = { status: "unknown" as string, code: "" }

  try {
    const client = createClient({
      socket: { host: "10.0.3.12", port: 30637 },
      password: "js+VEk19D5QsCqVD08LMbhNtS14ki9xL",
    })
    await client.connect()
    const raw = await client.get("baymax:services:status")
    await client.quit()

    if (raw) {
      const services = JSON.parse(raw)
      if (services.roxieclaw && typeof services.roxieclaw === "object") {
        roxieclaw = { status: services.roxieclaw.status || "unknown", code: services.roxieclaw.code || "" }
      }
      if (services.baymax && Array.isArray(services.baymax)) {
        baymax = { status: services.baymax[0] === "up" ? "up" : "down", code: services.baymax[1] || "" }
      }
    }
  } catch { /* redis read failed */ }

  return NextResponse.json({ baymax, roxieclaw })
}
