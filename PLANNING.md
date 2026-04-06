# Baymax Infrastructure Dashboard — Planning

## Overview
A single-screen compact dashboard for Evin to monitor his entire homelab at a glance. Designed for a fixed display (TV/monitor) or browser tab.

**URL:** `https://dashboard.safdia.com` (via Traefik)

---

## Tech Stack
- **Framework:** Next.js 15 (App Router) — easy to update, component-based
- **Styling:** Tailwind CSS — compact, dense UI
- **Hosting:** K8s (baymax-tools namespace), already have Traefik + MetalLB
- **Data refresh:** React Query (auto-refresh every 30s for health, 5min for static config)
- **State:** Minimal — dashboard is read-only, no database needed

---

## Design Philosophy
- **Dense information layout** — every pixel earns its place
- **Color coding only** — green/yellow/red for status, minimal decorative elements
- **Auto-refreshes** — no manual reload needed
- **Single file per section** — easy to find and edit

---

## Layout Structure (Single Screen, ~1920x1080)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Time (CST) | Date | Weather | Quick Status  │
├─────────────────────────────────────────────────────────────┤
│ QUICK LINKS: [Proxmox] [Baymax] [Gitea] [Plex] [Sonarr]   │
│               [Radarr] [HA] [UniFi] [AdGuard] [Traefik]... │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  ALERTS      │  BRIEFING   │  CLOUD SVC  │  PROXMOX       │
│  (ntfy)      │  (morning/  │  STATUS     │  VM/LXC GRID   │
│  Live feed   │   custom)    │  3x4 grid   │  Compact       │
│              │              │              │                │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                    KUBERNETES STATUS                       │
│  Node row + Pod grid (all namespaces, compact)              │
├─────────────────────────────────────────────────────────────┤
│  MEDIA STACK   │   AI STACK   │   NETWORK/DNS   │  UPTIME │
│  (arr+Plex)   │  (Ollama,   │   (UniFi,       │  (Pi,    │
│               │   LiteLLM)   │    AdGuard)     │  proxmox)│
└─────────────────────────────────────────────────────────────┘
```

---

## Section Specifications

### 1. Header Bar
- Baymax logo + "Infrastructure Dashboard"
- Live CST time (HH:MM:SS, updates every second)
- Date (e.g., "Monday, April 6, 2026")
- Weather from wttr.in (current temp + condition icon)
- Global status pill: "ALL SYSTEMS GO" / "X ISSUES DETECTED"

### 2. Alerts Panel (ntfy)
- Live feed from ntfy `baymax-alerts` topic
- Shows last 20 alerts
- Each alert: emoji | timestamp (CST) | message
- Color-coded left border: 🔴 critical | 🟡 warning | 🟢 info
- Auto-scrolls to newest
- Click to acknowledge (marks as read, stored in localStorage)

### 3. Quick Links Bar
Horizontal icon bar below header — one row of frequently accessed services.

Each link: 48×48 icon + tooltip on hover, opens in new tab.

```
[Proxmox] [Baymax] [Gitea] [Plex] [Sonarr] [Radarr] [HomeAssistant] [UniFi] [AdGuard] [Traefik] [Grafana] [Wiki] [Notion] [GitHub] ...
```

**Icon source:**
- Iconoir (primary, large free library): `https://cdn.iconoir.com/[name].svg`
- Simplicons (backup): `https://cdn.simplicons.org/[name].svg`
- Direct CDN for brand icons: GitHub, Plex, Notion, etc. have official SVG CDNs
- Lookup: search iconoir.com for the icon name, use the slug

**Default links:**
```typescript
export const QUICK_LINKS = [
  { name: 'Proxmox', url: 'https://10.0.3.31:8006', icon: 'server' },
  { name: 'Baymax', url: 'https://baymax.safdia.com', icon: 'robot' },
  { name: 'Gitea', url: 'https://git.safdia.com', icon: 'git' },
  { name: 'Plex', url: 'https://plex.safdia.com', icon: 'plex' },
  { name: 'Sonarr', url: 'https://sonarr.safdia.com', icon: 'tv' },
  { name: 'Radarr', url: 'https://radarr.safdia.com', icon: 'film' },
  { name: 'HomeAssistant', url: 'http://10.0.3.129:8123', icon: 'home' },
  { name: 'UniFi', url: 'https://unifi.safdia.com', icon: 'wifi' },
  { name: 'AdGuard', url: 'http://adguard.safdia.com', icon: 'shield' },
  { name: 'Traefik', url: 'http://traefik.safdia.com', icon: 'router' },
  { name: 'Grafana', url: 'https://grafana.safdia.com', icon: 'chart' },
  { name: 'Wiki', url: 'https://wiki.safdia.com', icon: 'book' },
  { name: 'Notion', url: 'https://notion.so', icon: 'notion' },
  { name: 'GitHub', url: 'https://github.com', icon: 'github' },
  { name: 'Plant-it', url: 'https://plantit.safdia.com', icon: 'plant' },
]
```

Users can edit `QUICK_LINKS` in `dashboard.ts` to add/remove/reorder.

**Implementation:** Simple flexbox row, SVG icon fetched from CDN, tooltip on hover via `title` attribute or custom tooltip component.

---

### 4. Briefing Panel
**Morning Briefing** (shows 6AM–12PM CST):
- Weather + UV index
- Calendar events for today (from MS365)
- Kids' school schedule (Ella/Ethan, from Notion or hardcoded)
- Any packages expected today (from package tracker)
- Top 3 action items / reminders
- Container count, backup status

**Evening Briefing** (shows 6PM–11PM CST):
- Network activity summary
- Daily backup result (R2 + Proxmox)
- Service changes since morning
- Any failed health checks
- Tomorrow's notable events

**Custom Briefings** (configurable):
- Pre-meeting (5min before calendar events)
- Post-trip (after travel plans)
- Weekly summary (Sunday night)

### 5. Cloud Service Status
Grid of cloud/API services — 3 columns × 4 rows.

Each cell shows:
- Provider logo (SVG, 24x24)
- Service name
- Status dot: 🟢 operational | 🟡 degraded | 🔴 outage | ⚫ unknown
- Last checked timestamp

Services to monitor:
```
Row 1: OpenAI | Anthropic | Google AI (Gemini)
Row 2: Minimax | Groq | Cloudflare
Row 3: GitHub | Microsoft 365 | Notion
Row 4: Vaultwarden | AdGuard | Tailscale
Row 5: Pinecone | Supabase | MongoDB Atlas
Row 6: Twilio | Stripe | Cloudflare (WAF/CDN)
```

Data source: 
- Primary: `https://api.servicestatus.io/v1/status/incidents/live` (requires API key, ~$10/mo)
- Fallback: scrape public status pages + health endpoint checks

### 6. Proxmox VM/LXC Grid
Compact grid of all VMs/LXCs across both nodes.

Each row = one VM/LXC:
`[STATUS] ID | NAME | TYPE | CPU% | MEM | DISK | UPTIME`

Features:
- Filter tabs: All | Running | Stopped | Containers | VMs
- Sort by: Name, CPU, Memory, Status
- Search box
- Color: green=running, yellow=stopped, red=error
- Click to expand: IP address, tags

Data: Proxmox API (both nodes, admin token)

### 7. Kubernetes Status
**Node Row:** 4 nodes (pi01-pi04) — CPU%, memory, pods running

**Pod Grid:** All pods in baymax-tools + observability namespaces
Compact cells: `NAMESPACE/POD | STATUS | RESTARTS | AGE`

Features:
- Filter: All | Running | CrashLoop | Pending
- Auto-highlight CrashLoop pods in red
- Count badges per namespace

Data: K8s API (direct, kubeconfig)

### 8. Media Stack Row
Cards for: Plex | Sonarr | Radarr | SABnzbd | qBittorrent | Tautulli
Each card: name | status | active downloads/queue count | last refresh

### 9. AI Stack Row
Cards for: LiteLLM | Ollama (MacBook) | ChromaDB | Meilisearch | OpenWebUI
Each card: name | status | models loaded count | API response time

### 10. Network/DNS Row
Cards for: UniFi | AdGuard | PiKVM | Traefik | DNS Records count
Each card: name | status | upstream response time

### 10. Uptime / Infrastructure Row
Rack-style display:
```
Baymax (LXC 203) | pi01 | pi02 | pi03 | pi04
Uptime: Xd Xh | Xd Xh | Xd Xh | Xd Xh
Load: X.XX   | X.XX  | X.XX  | X.XX
Mem: XX%     | XX%   | XX%   | XX%
Disk: XX%    | XX%   | XX%   | XX%
```

---

## API Endpoints (Next.js Route Handlers)

All under `/api/`:

| Endpoint | Source | Refresh |
|---|---|---|
| `/api/alerts` | ntfy `baymax-alerts` | 30s |
| `/api/briefing` | MS365 + Notion + script | 5min |
| `/api/cloud-status` | ServiceStatus.io or scrape | 5min |
| `/api/proxmox` | Proxmox API (10.0.3.31, 10.0.3.32) | 30s |
| `/api/k8s/nodes` | K8s API | 30s |
| `/api/k8s/pods` | K8s API | 30s |
| `/api/k8s/services` | K8s API | 60s |
| `/api/media/*` | Arr APIs + Plex | 60s |
| `/api/ai/*` | LiteLLM + Ollama health | 60s |
| `/api/network/*` | UniFi + AdGuard | 60s |
| `/api/infrastructure` | Mixed sources | 30s |

---

## Configuration File

All dashboard config lives in one file: `src/config/dashboard.ts`

```typescript
export const DASHBOARD_CONFIG = {
  location: { timezone: 'America/Chicago', name: 'Spring, TX' },
  
  quickLinks: [
    { name: 'Proxmox', url: 'https://10.0.3.31:8006', icon: 'server' },
    { name: 'Baymax', url: 'https://baymax.safdia.com', icon: 'robot' },
    { name: 'Gitea', url: 'https://git.safdia.com', icon: 'git' },
    { name: 'Plex', url: 'https://plex.safdia.com', icon: 'plex' },
    { name: 'Sonarr', url: 'https://sonarr.safdia.com', icon: 'tv' },
    { name: 'Radarr', url: 'https://radarr.safdia.com', icon: 'film' },
    { name: 'HomeAssistant', url: 'http://10.0.3.129:8123', icon: 'home' },
    { name: 'UniFi', url: 'https://unifi.safdia.com', icon: 'wifi' },
    { name: 'AdGuard', url: 'http://adguard.safdia.com', icon: 'shield' },
    { name: 'Traefik', url: 'http://traefik.safdia.com', icon: 'router' },
    { name: 'Grafana', url: 'https://grafana.safdia.com', icon: 'chart' },
    { name: 'Wiki', url: 'https://wiki.safdia.com', icon: 'book' },
    { name: 'Plant-it', url: 'https://plantit.safdia.com', icon: 'plant' },
  ],

  proxmox: {
    nodes: [
      { name: 'proxmox01', ip: '10.0.3.31', apiToken: 'secret' },
      { name: 'proxmox02', ip: '10.0.3.32', apiToken: 'secret' },
    ]
  },

  k8s: {
    namespaces: ['baymax-tools', 'observability'],
    excludedPods: [' Completed'],
  },

  cloudServices: [
    { name: 'OpenAI', slug: 'openai', url: 'https://status.openai.com' },
    { name: 'Anthropic', slug: 'anthropic', url: 'https://status.anthropic.com' },
    { name: 'Minimax', slug: 'minimax', url: 'https://status.minimaxi.com' },
    // ... easily add/remove
  ],

  mediaStack: {
    plex: { ip: '10.0.2.20', apiKey: 'secret' },
    sonarr: { ip: '10.0.3.137', apiKey: 'secret' },
    // ...
  },

  refreshIntervals: {
    alerts: 30_000,      // 30s
    proxmox: 30_000,
    k8s: 30_000,
    cloudStatus: 300_000, // 5min
    briefing: 300_000,
  }
}
```

---

## File Structure

```
projects/infra-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   ├── page.tsx            # Main dashboard page
│   │   ├── globals.css         # Tailwind + custom
│   │   └── api/
│   │       ├── alerts/route.ts
│   │       ├── proxmox/route.ts
│   │       ├── k8s/[resource]/route.ts
│   │       ├── cloud-status/route.ts
│   │       ├── briefing/route.ts
│   │       └── infrastructure/route.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── QuickLinks.tsx
│   │   ├── AlertsPanel.tsx
│   │   ├── BriefingPanel.tsx
│   │   ├── CloudStatusGrid.tsx
│   │   ├── ProxmoxGrid.tsx
│   │   ├── K8sStatus.tsx
│   │   ├── MediaStackRow.tsx
│   │   ├── AISstackRow.tsx
│   │   ├── NetworkRow.tsx
│   │   ├── UptimeRow.tsx
│   │   └── ui/                 # Shared: StatusDot, Card, Badge, etc.
│   ├── lib/
│   │   ├── proxmox.ts         # Proxmox API client
│   │   ├── k8s.ts             # K8s API client
│   │   ├── ntfy.ts            # ntfy fetch
│   │   └── cloud-status.ts    # ServiceStatus.io or scraper
│   └── config/
│       └── dashboard.ts        # THE config file — add services here
├── kubernetes/
│   └── deployment.yaml         # K8s manifest
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Implementation Priority

### Phase 1 — Core Infrastructure (MVP)
1. Next.js project setup + K8s deploy
2. Header (time, weather, global status)
3. Quick Links bar (icon row)
4. Proxmox VM grid
5. K8s node + pod status
6. Static cloud status (colored dots, manual config)
7. Basic layout with Tailwind

### Phase 2 — Live Data
7. ntfy alerts panel (live)
8. Cloud status auto-refresh
9. Proxmox API integration
10. K8s API integration

### Phase 3 — Smart Features
11. Morning/evening briefing logic
12. MS365 calendar integration
13. Media stack cards
14. AI stack cards
15. Network cards

### Phase 4 — Polish
16. Sound alerts for critical
17. Dark/light mode toggle
18. Compact mode toggle
19. Mobile view (scrollable)
20. Historical uptime chart (7 days)

---

## Deployment

```bash
# Build
cd projects/infra-dashboard
docker build -t ghcr.io/unwrntd/infra-dashboard:latest .
docker push ghcr.io/unwrntd/infra-dashboard:latest

# Apply K8s manifest
kubectl apply -f kubernetes/deployment.yaml
```

Ingress already deployed via Traefik at `dashboard.safdia.com`.

---

## Adding New Services

**To add a cloud service:**
1. Edit `src/config/dashboard.ts` → add to `cloudServices` array
2. Status page URL auto-added to scraper
3. Done.

**To add/edit Quick Links:**
Edit `src/config/dashboard.ts` → `quickLinks` array. Each entry: `{ name, url, icon }`.
Icon names come from [Iconoir](https://iconoir.com) (free, open) or [Simplicons](https://simplicons.org). The component resolves `icon` → CDN URL automatically.

**To add a Proxmox VM alert:**
VMs with status != "running" automatically show red in the grid. No extra config.

**To add a K8s namespace:**
Edit `src/config/dashboard.ts` → `k8s.namespaces`. Namespace pods auto-appear.

**To add a media/AI service:**
Edit config file → `mediaStack` or `aiStack` section. Each has a simple health-check endpoint.

---

## Gotchas / Notes
- Proxmox admin token: stored in Vaultwarden ("Proxmox Admin API")
- K8s kubeconfig: `~/.kube/config` (Baymax has direct access)
- ntfy topic: `baymax-alerts`, anonymous read from `http://10.0.3.12:31180/baymax-alerts`
- ServiceStatus.io: free tier has 10 services, paid ~$10/mo for unlimited
- Traefik already at 10.0.3.202 — just add Ingress manifest
- Dashboard should auto-fit 1920×1080 — use CSS Grid with fixed row heights
