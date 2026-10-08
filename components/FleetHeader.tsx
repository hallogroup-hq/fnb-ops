'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  RefreshCw,
  LogOut,
  Radio,
  Search,
} from 'lucide-react'
import type { FleetStats } from '../types/fleet'

interface FleetHeaderProps {
  stats: FleetStats
  onOpenProvisionModal: () => void
  onRefreshData: () => void
  isRefreshing?: boolean
}

export default function FleetHeader({
  stats,
  onOpenProvisionModal,
  onRefreshData,
  isRefreshing = false,
}: FleetHeaderProps) {
  const [staffName, setStaffName] = useState<string>('Akmal I. (Lead Operations)')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = window.sessionStorage.getItem('fnb_ops_staff_name')
      if (name) setStaffName(name)
    }
  }, [])

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('fnb_ops_logged_out', 'true')
      window.location.reload()
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* BRAND & STATUS INDICATOR */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
            HG
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs tracking-tight text-zinc-900">
              Fleet Operations
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
              v2.5
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

        {/* GATEWAY STATUS */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Gateway Active</span>
          <span className="text-zinc-300">/</span>
          <span className="tabular-nums font-medium text-zinc-900">{stats.slaUptimePct}% SLA</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-500">{stats.totalOutlets} Outlets Live</span>
        </div>
      </div>

      {/* ACTIONS & OPERATOR BADGE */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-1.5 rounded border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 bg-white transition-colors cursor-pointer"
          title="Segarkan telemetri"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-zinc-900' : ''} />
        </button>

        <button
          type="button"
          onClick={onOpenProvisionModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus size={13} />
          <span>Onboard Tenant</span>
        </button>

        <div className="h-4 w-px bg-zinc-200" />

        {/* OPERATOR INFO */}
        <div className="flex items-center gap-2 pl-1">
          <div className="text-right hidden md:block">
            <div className="text-xs font-medium text-zinc-900 leading-tight">
              {staffName}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 leading-tight">
              Hallo Group HQ
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Kunci sesi"
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  )
}
