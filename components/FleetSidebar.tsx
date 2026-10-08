'use client'

import React from 'react'
import {
  LayoutDashboard,
  Store,
  Terminal,
  Wrench,
  UserPlus,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export type ActiveOpsTab =
  | 'overview'
  | 'tenants'
  | 'logs'
  | 'remediation'
  | 'provisioning'
  | 'audit'

interface FleetSidebarProps {
  activeTab: ActiveOpsTab
  setActiveTab: (tab: ActiveOpsTab) => void
  openIncidentsCount: number
  pendingRequestsCount: number
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export default function FleetSidebar({
  activeTab,
  setActiveTab,
  openIncidentsCount,
  pendingRequestsCount,
  isCollapsed,
  setIsCollapsed,
}: FleetSidebarProps) {
  const navSections = [
    {
      category: 'Armada',
      items: [
        {
          id: 'overview' as ActiveOpsTab,
          label: 'Ringkasan Armada',
          icon: LayoutDashboard,
        },
        {
          id: 'tenants' as ActiveOpsTab,
          label: 'Direktori Klien',
          icon: Store,
        },
        {
          id: 'logs' as ActiveOpsTab,
          label: 'Log & Insiden',
          icon: Terminal,
          badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
          badgeVariant: 'rose',
        },
      ],
    },
    {
      category: 'Remediasi & Kontrol',
      items: [
        {
          id: 'remediation' as ActiveOpsTab,
          label: 'Remote Remediasi',
          icon: Wrench,
        },
        {
          id: 'provisioning' as ActiveOpsTab,
          label: 'Onboarding & Approvals',
          icon: UserPlus,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          badgeVariant: 'amber',
        },
      ],
    },
    {
      category: 'Tata Kelola',
      items: [
        {
          id: 'audit' as ActiveOpsTab,
          label: 'Audit Trail Staf',
          icon: FileText,
        },
      ],
    },
  ]

  return (
    <aside
      className={`shrink-0 h-[calc(100vh-49px)] sticky top-[49px] bg-white border-r border-zinc-200 flex flex-col justify-between transition-all duration-150 z-20 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* NAV LINKS */}
      <div className="p-2 space-y-4 overflow-y-auto flex-1">
        {navSections.map((sec) => (
          <div key={sec.category} className="space-y-0.5">
            {!isCollapsed ? (
              <div className="px-2 pb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                {sec.category}
              </div>
            ) : (
              <div className="h-2" />
            )}

            {sec.items.map((it) => {
              const Icon = it.icon
              const isActive = activeTab === it.id
              return (
                <button
                  key={it.id}
                  onClick={() => setActiveTab(it.id)}
                  title={isCollapsed ? it.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-zinc-900 text-white font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{it.label}</span>
                      {it.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                            isActive
                              ? 'bg-zinc-800 text-zinc-200'
                              : it.badgeVariant === 'rose'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {it.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* FOOTER COLLAPSE TOGGLE */}
      <div className="p-2 border-t border-zinc-200 bg-zinc-50/60">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span>Perkecil Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
