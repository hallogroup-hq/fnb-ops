'use client'

import React from 'react'
import {
  Store,
  CreditCard,
  AlertTriangle,
  UserPlus,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

export type ActiveOpsTab =
  | 'fleet'
  | 'billing'
  | 'radar'
  | 'provisioning'
  | 'audit'

interface FleetSidebarProps {
  activeTab: ActiveOpsTab
  setActiveTab: (tab: ActiveOpsTab) => void
  openIncidentsCount: number
  pendingRequestsCount: number
  pendingInvoicesCount: number
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export default function FleetSidebar({
  activeTab,
  setActiveTab,
  openIncidentsCount,
  pendingRequestsCount,
  pendingInvoicesCount,
  isCollapsed,
  setIsCollapsed,
}: FleetSidebarProps) {
  const navItems = [
    {
      id: 'fleet' as ActiveOpsTab,
      label: 'Kendali Klien 360°',
      sublabel: 'Cabang, hardware & stok',
      icon: Store,
    },
    {
      id: 'billing' as ActiveOpsTab,
      label: 'Keuangan & Paket',
      sublabel: 'MRR, faktur & lisensi',
      icon: CreditCard,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
      badgeVariant: 'amber',
    },
    {
      id: 'radar' as ActiveOpsTab,
      label: 'Radar Insiden & Rollout',
      sublabel: 'Hardware SLA & OTA POS',
      icon: AlertTriangle,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
      badgeVariant: 'rose',
    },
    {
      id: 'provisioning' as ActiveOpsTab,
      label: 'Onboarding Toko Baru',
      sublabel: 'Wizard pendaftaran klien',
      icon: UserPlus,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeVariant: 'amber',
    },
    {
      id: 'audit' as ActiveOpsTab,
      label: 'Audit Trail Staf',
      sublabel: 'Log kepatuhan internal',
      icon: FileText,
    },
  ]

  return (
    <aside
      className={`shrink-0 h-[calc(100vh-49px)] sticky top-[49px] bg-white border-r border-zinc-200 flex flex-col justify-between transition-all duration-150 z-20 ${
        isCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* NAV LINKS */}
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1">
        {!isCollapsed && (
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
            OPERASI SAAS HQ
          </div>
        )}

        {navItems.map((it) => {
          const Icon = it.icon
          const isActive = activeTab === it.id
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setActiveTab(it.id)}
              className={`w-full flex items-center justify-between p-2 rounded-md text-xs font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title={it.label}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={16}
                  className={`shrink-0 ${
                    isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'
                  }`}
                />
                {!isCollapsed && (
                  <div className="text-left truncate">
                    <span className="block truncate font-semibold leading-tight">
                      {it.label}
                    </span>
                    <span
                      className={`block text-[10px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-zinc-400' : 'text-zinc-400'
                      }`}
                    >
                      {it.sublabel}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && it.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                    it.badgeVariant === 'rose'
                      ? isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-100 text-rose-800'
                      : isActive
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {it.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* FOOTER & COLLAPSE TOGGLE */}
      <div className="p-2 border-t border-zinc-200 bg-zinc-50/50 space-y-1">
        {!isCollapsed && (
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Sesi SuperAdmin</span>
            </span>
            <span className="text-zinc-400">HQ-2026</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 text-xs transition-colors cursor-pointer"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
