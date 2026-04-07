'use client'

import Header from '@/components/Header'
import QuickLinks from '@/components/QuickLinks'
import AlertsPanel from '@/components/AlertsPanel'
import BriefingPanel from '@/components/BriefingPanel'
import CloudStatusGrid from '@/components/CloudStatusGrid'
import ProxmoxGrid from '@/components/ProxmoxGrid'
import K8sStatus from '@/components/K8sStatus'
import ServiceCardGrid from '@/components/ServiceCardGrid'
import ErrorBoundary from '@/components/ErrorBoundary'
import { DASHBOARD_CONFIG } from '@/config/dashboard'

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">

      <Header
        timezone={DASHBOARD_CONFIG.location.timezone}
        location={DASHBOARD_CONFIG.location.name}
      />

      <QuickLinks />

      <div className="flex-1 overflow-auto">

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-2 p-2 min-h-full">

          <div className="col-span-2 flex flex-col gap-2">
            <Panel><AlertsPanel /></Panel>
            <div className="h-64 flex-shrink-0"><Panel><BriefingPanel /></Panel></div>
          </div>

          <div className="col-span-5 flex flex-col gap-2">
            <Panel><CloudStatusGrid /></Panel>
            <Panel><ProxmoxGrid /></Panel>
          </div>

          <div className="col-span-5 flex flex-col gap-2">
            <Panel><K8sStatus /></Panel>
          </div>
        </div>

        {/* Tablet */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-2 p-2">
          <div className="flex flex-col gap-2">
            <Panel><AlertsPanel /></Panel>
            <Panel><BriefingPanel /></Panel>
          </div>
          <div className="flex flex-col gap-2">
            <Panel><CloudStatusGrid /></Panel>
            <Panel><ProxmoxGrid /></Panel>
            <Panel><K8sStatus /></Panel>
          </div>
        </div>

        {/* Mobile */}
        <div className="grid-cols-1 grid gap-2 p-2 md:hidden">
          <Panel><AlertsPanel /></Panel>
          <Panel><BriefingPanel /></Panel>
          <Panel><CloudStatusGrid /></Panel>
          <Panel><ProxmoxGrid /></Panel>
          <Panel><K8sStatus /></Panel>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
        <div className="flex-1 min-w-0"><Panel><ServiceCardGrid title="Media Stack" services={DASHBOARD_CONFIG.mediaStack} /></Panel></div>
        <div className="flex-1 min-w-0"><Panel><ServiceCardGrid title="AI Stack" services={DASHBOARD_CONFIG.aiStack} /></Panel></div>
      </div>

    </div>
  )
}
