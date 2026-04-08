// ============================================================
// Baymax Infrastructure Dashboard — Config
// Edit this file to add services, change links, adjust thresholds
// ============================================================

export const DASHBOARD_CONFIG = {
  // Location for weather
  location: { timezone: 'America/Chicago', name: 'Spring, TX' },

  // Quick Links — icon names from lucide-react (https://lucide.dev/icons)
  // lucide-react is already installed — use any icon name from their library
  quickLinks: [
    { name: 'Proxmox', url: 'https://10.0.3.31:8006', icon: 'Server' },
    { name: 'Baymax', url: 'https://baymax.safdia.com', icon: 'Bot' },
    { name: 'Gitea', url: 'https://git.safdia.com', icon: 'GitBranch' },
    { name: 'Plex', url: 'https://plex.safdia.com', icon: 'Tv' },
    { name: 'Sonarr', url: 'https://sonarr.safdia.com', icon: 'Film' },
    { name: 'Radarr', url: 'https://radarr.safdia.com', icon: 'Clapperboard' },
    { name: 'HomeAssistant', url: 'http://10.0.3.129:8123', icon: 'Home' },
    { name: 'UniFi', url: 'https://unifi.safdia.com', icon: 'Wifi' },
    { name: 'AdGuard', url: 'http://adguard.safdia.com', icon: 'Shield' },
    { name: 'Traefik', url: 'http://traefik.safdia.com', icon: 'Network' },
    { name: 'Grafana', url: 'https://grafana.safdia.com', icon: 'BarChart3' },
    { name: 'Wiki', url: 'https://wiki.safdia.com', icon: 'BookOpen' },
    { name: 'Notion', url: 'https://notion.so', icon: 'FileText' },
    { name: 'GitHub', url: 'https://github.com', icon: 'Github' },
    { name: 'Plant-it', url: 'https://plantit.safdia.com', icon: 'Leaf' },
    { name: 'Overseerr', url: 'https://overseerr.safdia.com', icon: 'Ticket' },
    { name: 'Wazuh', url: 'https://wazuh.safdia.com', icon: 'Eye' },
    { name: 'n8n', url: 'https://n8n.safdia.com', icon: 'Workflow' },
  ],

  // Proxmox nodes
  proxmox: {
    nodes: [
      { name: 'proxmox01', ip: '10.0.3.31' },
      { name: 'proxmox02', ip: '10.0.3.32' },
    ]
  },

  // K8s namespaces to show
  k8s: {
    namespaces: ['baymax-tools', 'observability', 'traefik'],
    excludedPodPatterns: [' Completed', 'Terminating'],
  },

  // Cloud services to monitor status
  cloudServices: [
    { name: 'OpenAI', slug: 'openai', color: '#10a37f' },
    { name: 'Anthropic', slug: 'anthropic', color: '#d1a454' },
    { name: 'Minimax', slug: 'minimax', color: '#00c7b7' },
    { name: 'Groq', slug: 'groq', color: '#7b2ff7' },
    { name: 'Cloudflare', slug: 'cloudflare', color: '#f6821f' },
    { name: 'GitHub', slug: 'github', color: '#24292e' },
    { name: 'Microsoft 365', slug: 'microsoft-365', color: '#0078d4' },
    { name: 'Notion', slug: 'notion', color: '#000000' },
    { name: 'Vaultwarden', slug: 'vaultwarden', color: '#ffffff', isSelfHosted: true, url: 'https://vaultwarden.safdia.com:8000' },
    { name: 'AdGuard', slug: 'adguard', color: '#68b445', isSelfHosted: true, url: 'http://adguard.safdia.com' },
    { name: 'Pinecone', slug: 'pinecone', color: '#4ade80' },
    { name: 'Supabase', slug: 'supabase', color: '#3ecf8e' },
    { name: 'Cloudflare WAF', slug: 'cloudflare-waf', color: '#f6821f' },
    { name: 'Twilio', slug: 'twilio', color: '#f22f46' },
    { name: 'Stripe', slug: 'stripe', color: '#635bff' },
  ],

  // Media stack services
  mediaStack: [
    { name: 'Plex', ip: '10.0.2.20', port: 32400, path: '/api/health' },
    { name: 'Sonarr', ip: '10.0.3.137', port: 8989, path: '/api/health' },
    { name: 'Radarr', ip: '10.0.3.144', port: 7878, path: '/api/health' },
    { name: 'SABnzbd', ip: '10.0.3.101', port: 7777, path: '/sabnzbd/api?mode=queue' },
    { name: 'qBittorrent', ip: '10.0.3.146', port: 8090, path: '/api/v2/app/preferences' },
    { name: 'Overseerr', ip: '10.0.3.162', port: 5055, path: '/api/v1/status' },
  ],

  // AI stack services
  aiStack: [
    { name: 'LiteLLM', ip: '10.0.3.170', port: 4000, path: '/health' },
    { name: 'Ollama', ip: '10.0.3.132', port: 9876, path: '/api/tags' },
    { name: 'ChromaDB', ip: '10.0.3.11', port: 30800, path: '/api/v1/heartbeat' },
    { name: 'Meilisearch', ip: '10.0.3.11', port: 30770, path: '/health' },

  ],

  // Refresh intervals (ms)
  refreshIntervals: {
    alerts: 30_000,
    proxmox: 30_000,
    k8s: 30_000,
    cloudStatus: 300_000,
    infrastructure: 60_000,
    media: 60_000,
    ai: 60_000,
  },

  // Alert thresholds
  thresholds: {
    cpuWarning: 70,
    cpuCritical: 90,
    memoryWarning: 75,
    memoryCritical: 90,
    diskWarning: 80,
    diskCritical: 90,
  }
}

export type DashboardConfig = typeof DASHBOARD_CONFIG
