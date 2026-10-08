'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Radio,
  Server,
  Plus,
  LogOut,
  Bell,
  RefreshCw,
  ExternalLink,
  ChevronDown,
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
  const [staffName, setStaffName] = useState<string>('Staff Operasional')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = window.sessionStorage.getItem('fnb_ops_staff_name')
      if (name) setStaffName(name)
    }
  }, [])

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('fnb_ops_auth_verified')
      window.sessionStorage.removeItem('fnb_ops_staff_name')
      window.location.reload()
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 md:px-6 py-3 flex items-center justify-between gap-4 shadow-2xs">
      {/* BRAND & STATUS BADGE */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
          OP
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-sm text-slate-900 tracking-tight">
              Nusantara Fleet Ops
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              v2.5 PROD
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Realtime Terhubung
            </span>
            <span>·</span>
            <span className="font-mono text-slate-600">SLA {stats.slaUptimePct}%</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS & PROFILE */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:border-black transition-colors cursor-pointer bg-white"
          title="Segarkan Data Telemetri"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={onOpenProvisionModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-xs cursor-pointer"
        >
          <Plus size={14} />
          <span>+ Provisioning Klien</span>
        </button>

        {/* STAFF USER PILL */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-black text-slate-800">
            {staffName.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
              {staffName}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">Hallo Ops Staff</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Keluar dari Konsol"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
