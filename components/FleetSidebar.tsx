'use client'

import React from 'react'
import {
  LayoutDashboard,
  Store,
  Terminal,
  Wrench,
  UserPlus,
  FileText,
  Radio,
  AlertTriangle,
  Layers,
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
      category: 'Operasional Armada',
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
          label: 'Pusat Log & Crash',
          icon: Terminal,
          badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
          badgeVariant: 'rose',
        },
      ],
    },
    {
      category: 'Tindakan Jarak Jauh',
      items: [
        {
          id: 'remediation' as ActiveOpsTab,
          label: 'Remote Remediasi',
          icon: Wrench,
        },
        {
          id: 'provisioning' as ActiveOpsTab,
          label: 'Onboarding & Approval',
          icon: UserPlus,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          badgeVariant: 'amber',
        },
      ],
    },
    {
      category: 'Tata Kelola Platform',
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
      className={`shrink-0 h-[calc(100vh-57px)] sticky top-[57px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-all duration-200 z-20 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* NAV LINKS */}
      <div className="p-3 space-y-6 overflow-y-auto flex-1">
        {navSections.map((sec) => (
          <div key={sec.category} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[40px] text-left ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-600 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  <Icon size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{it.label}</span>
                      {it.badge !== undefined && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-white text-black'
                              : it.badgeVariant === 'rose'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
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
      <div className="p-3 border-t border-[#E2E8F0] bg-slate-50">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-black hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Perkecil Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
