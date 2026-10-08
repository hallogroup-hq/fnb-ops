'use client'

import React from 'react'
import {
  Store,
  Building2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Printer,
  HardDrive,
  Activity,
  ArrowUpRight,
  Wrench,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from 'lucide-react'
import type { TenantStore, FleetStats, RemoteLogEntry } from '../types/fleet'

interface FleetOverviewTabProps {
  stats: FleetStats
  tenants: TenantStore[]
  recentLogs: RemoteLogEntry[]
  onInspectTenant: (tenant: TenantStore) => void
  onOpenRemediation: (tenantId: string) => void
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export default function FleetOverviewTab({
  stats,
  tenants,
  recentLogs,
  onInspectTenant,
  onOpenRemediation,
}: FleetOverviewTabProps) {
  const criticalTenants = tenants.filter((t) => t.healthStatus === 'critical')
  const warningTenants = tenants.filter((t) => t.healthStatus === 'warning')

  return (
    <div className="space-y-6">
      {/* 1. CRITICAL INCIDENT BANNER */}
      {criticalTenants.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-rose-900">
                  {criticalTenants.length} Toko Memerlukan Tindakan Remedi Segera!
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  INSIDEN KRITIS
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Toko <strong>{criticalTenants.map((t) => t.name).join(', ')}</strong> mengalami hambatan transaksi (antrean transaksi stuck / storage kuota browser). Tangani sekarang secara remote tanpa perlu ke lokasi toko.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenRemediation(criticalTenants[0].id)}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-xs"
          >
            <Wrench size={14} />
            <span>Remediasi Jarak Jauh Sekarang</span>
          </button>
        </div>
      )}

      {/* 2. TOP MACRO STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL TENANTS & OUTLETS */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Klien SaaS</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Store size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{stats.totalTenants} Toko</div>
            <div className="text-xs font-bold text-slate-500 font-mono">
              {stats.totalOutlets} Cabang
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>{stats.activeTenants} klien aktif berlangganan</span>
          </div>
        </div>

        {/* FLEET HEALTH BREAKDOWN */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Status Kesehatan Armada</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              {stats.healthyCount} Sehat
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
              {stats.warningCount} Waspada
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
              {stats.criticalCount} Kritis
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
              {stats.offlineCount} Offline
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            {stats.openIncidentsCount > 0 ? (
              <span className="text-rose-600 font-bold">{stats.openIncidentsCount} insiden error aktif</span>
            ) : (
              <span className="text-emerald-600 font-bold">Semua sistem toko normal</span>
            )}
          </div>
        </div>

        {/* SLA AVAILABILITY */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">SLA Ketersediaan Sistem</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{stats.slaUptimePct}%</div>
            <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              TARGET 99.9%
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Diukur dari respons gateway & sinkronisasi
          </div>
        </div>

        {/* PLATFORM DAILY GMV */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            {formatRupiah(stats.totalGmvToday)}
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Agregat dari seluruh cabang kasir aktif
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN OPERATIONAL OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1 & 2: STORE FLEET SNAPSHOT */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">
                Ringkasan Armada Toko Klien
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Status operasional, perangkat terhubung, dan printer thermal per tenant
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {tenants.length} Tenant Terdaftar
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {tenants.map((t) => {
              const totalOutlets = t.activeOutlets?.length || 0
              const totalTerminals = t.activeOutlets?.reduce((sum, o) => sum + o.activeTerminalsCount, 0) || 0
              const hasPrinterIssue = t.activeOutlets?.some((o) => o.printerHealth !== 'ok')
              const gmv = t.activeOutlets?.reduce((sum, o) => sum + o.todayGmv, 0) || 0

              return (
                <div
                  key={t.id}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 hover:underline cursor-pointer" onClick={() => onInspectTenant(t)}>
                        {t.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase">
                        {t.subscriptionTier}
                      </span>
                      {t.healthStatus === 'healthy' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          SEHAT
                        </span>
                      )}
                      {t.healthStatus === 'warning' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          PERINGATAN
                        </span>
                      )}
                      {t.healthStatus === 'critical' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse">
                          KRITIS
                        </span>
                      )}
                      {t.healthStatus === 'offline' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          OFFLINE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>{t.ownerName} ({t.ownerPhone})</span>
                      <span>·</span>
                      <span className="font-mono">{totalOutlets} Cabang ({totalTerminals} Terminal)</span>
                      <span>·</span>
                      <span className="font-bold text-slate-800">{formatRupiah(gmv)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspectTenant(t)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-black text-slate-800 text-xs font-bold transition-colors cursor-pointer bg-white"
                    >
                      Diagnostik
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenRemediation(t.id)}
                      className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Remediasi
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* COLUMN 3: RECENT INCIDENTS & LOG TICKER */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-slate-700" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Log Insiden Terkini
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                LIVE STREAM
              </span>
            </div>

            <div className="space-y-3 mt-3.5">
              {recentLogs.slice(0, 4).map((l) => (
                <div
                  key={l.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    l.level === 'fatal'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : l.level === 'error'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          l.level === 'fatal'
                            ? 'bg-rose-600 text-white'
                            : l.level === 'error'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {l.level}
                      </span>
                      <span className="font-bold text-[11px] truncate max-w-[140px]">
                        {l.sourceModule}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {Math.max(1, Math.floor((Date.now() - l.timestamp) / 60000))} mnt lalu
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed line-clamp-2 font-mono">
                    {l.message}
                  </p>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <span className="truncate">{l.tenantId}</span>
                    <button
                      type="button"
                      onClick={() => onOpenRemediation(l.tenantId)}
                      className="text-black font-bold hover:underline cursor-pointer"
                    >
                      Perbaiki &gt;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400 font-medium">
              Semua telemetri dan heartbeat diperbarui otomatis dari instance klien.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
