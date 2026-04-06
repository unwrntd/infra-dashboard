'use client'

import Header from '@/components/Header'
import QuickLinks from '@/components/QuickLinks'
import AlertsPanel from '@/components/AlertsPanel'
import BriefingPanel from '@/components/BriefingPanel'
import CloudStatusGrid from '@/components/CloudStatusGrid'
import ProxmoxGrid from '@/components/ProxmoxGrid'
import K8sStatus from '@/components/K8sStatus'
import ServiceCardGrid from '@/components/ServiceCardGrid'
import { DASHBOARD_CONFIG } from '@/config/dashboard'

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">

      {/* Header — always visible */}
      <Header
        timezone={DASHBOARD_CONFIG.location.timezone}
        location={DASHBOARD_CONFIG.location.name}
      />

      {/* Quick Links — horizontal scroll on mobile */}
      <QuickLinks />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">

        {/* Desktop: 3-column layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-2 p-2 min-h-full">

          {/* Left Column: Alerts + Briefing */}
          <div className="col-span-2 flex flex-col gap-2">
            <div className="flex-1 min-h-0">
              <AlertsPanel />
            </div>
            <div className="h-64 flex-shrink-0">
              <BriefingPanel />
            </div>
          </div>

          {/* Middle Column: Cloud + Proxmox */}
          <div className="col-span-5 flex flex-col gap-2">
            <div className="flex-1 min-h-0">
              <CloudStatusGrid />
            </div>
            <div className="flex-1 min-h-0">
              <ProxmoxGrid />
            </div>
          </div>

          {/* Right Column: K8s */}
          <div className="col-span-5 flex flex-col gap-2">
            <div className="flex-1 min-h-0">
              <K8sStatus />
            </div>
          </div>
        </div>

        {/* Tablet: 2-column */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-2 p-2">
          <div className="flex flex-col gap-2">
            <AlertsPanel />
            <BriefingPanel />
          </div>
          <div className="flex flex-col gap-2">
            <CloudStatusGrid />
            <ProxmoxGrid />
            <K8sStatus />
          </div>
        </div>

        {/* Mobile: single column stack */}
        <div className="grid-cols-1 grid gap-2 p-2 md:hidden">
          <AlertsPanel />
          <BriefingPanel />
          <CloudStatusGrid />
          <ProxmoxGrid />
          <K8sStatus />
        </div>

      </div>

      {/* Bottom Row: Service Stacks */}
      <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
        <div className="flex-1 min-w-0">
          <ServiceCardGrid title="Media Stack" services={DASHBOARD_CONFIG.mediaStack} />
        </div>
        <div className="flex-1 min-w-0">
          <ServiceCardGrid title="AI Stack" services={DASHBOARD_CONFIG.aiStack} />
        </div>
      </div>

    </div>
  )
}
