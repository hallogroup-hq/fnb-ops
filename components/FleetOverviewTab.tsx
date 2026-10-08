'use client'

import React from 'react'
import {
  Store,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Printer,
  HardDrive,
  Activity,
  Wrench,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Tablet,
  Wifi,
  ArrowRight,
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
  const incidentTenants = [...criticalTenants, ...warningTenants]

  return (
    <div className="space-y-4">
      {/* 1. INDUSTRIAL TELEMETRY STRIP (NO SLOP 4-CARDS) */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        {/* CELL 1: ACTIVE CLIENTS */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Klien & Armada Fisik</span>
            <span className="font-mono text-[10px] text-zinc-400">TENANTS</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
              {stats.totalTenants} Toko
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              / {stats.totalOutlets} Cabang
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {stats.activeTenants} klien aktif berlangganan
          </div>
        </div>

        {/* CELL 2: ARMADA HEALTH DISTRIBUTION */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Kondisi Kesehatan Armada</span>
            <span className="font-mono text-[10px] text-zinc-400">HEALTH</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {stats.healthyCount} OK
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {stats.warningCount} Warn
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {stats.criticalCount} Crit
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {stats.openIncidentsCount > 0 ? (
              <span className="text-rose-600 font-medium">{stats.openIncidentsCount} insiden butuh tindakan</span>
            ) : (
              <span className="text-emerald-600">Semua node normal</span>
            )}
          </div>
        </div>

        {/* CELL 3: SLA & GATEWAY RTT */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>SLA & Latensi Gateway</span>
            <span className="font-mono text-[10px] text-zinc-400">UPTIME</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
              {stats.slaUptimePct}%
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              ~24ms RTT
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Gateway WebSocket & Cloud Sync
          </div>
        </div>

        {/* CELL 4: TOTAL NETWORK GMV */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Omzet Agregat Hari Ini</span>
            <span className="font-mono text-[10px] text-zinc-400">GMV</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums truncate">
            {formatRupiah(stats.totalGmvToday)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Agregat transaksi seluruh kasir
          </div>
        </div>
      </div>

      {/* 2. INCIDENT COMMAND CENTER (ACTIONABLE, HIGH-PRIORITY) */}
      {incidentTenants.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-lg overflow-hidden">
          <div className="bg-rose-50/70 px-4 py-2 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span className="text-xs font-semibold text-rose-950">
                Pusat Tanggap Insiden Armada ({incidentTenants.length} Toko Terdampak)
              </span>
            </div>
            <span className="text-[10px] font-mono text-rose-700 font-medium">
              ZERO-TOUCH REMOTE ACTION
            </span>
          </div>

          <div className="divide-y divide-rose-100">
            {incidentTenants.map((t) => {
              const isCrit = t.healthStatus === 'critical'
              const mainIssue = isCrit
                ? 'Printer thermal kehabisan kertas & 3 transaksi offline tertahan di browser local storage.'
                : 'Storage quota browser mencapai 91% (mendekati batas limit 5MB).'

              return (
                <div
                  key={t.id}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-rose-50/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-zinc-900">
                        {t.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isCrit ? 'CRITICAL' : 'WARNING'}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {t.ownerName} ({t.ownerPhone})
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {mainIssue}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspectTenant(t)}
                      className="px-2.5 py-1.5 rounded bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Diagnostik Hardware
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenRemediation(t.id)}
                      className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Wrench size={13} />
                      <span>1-Click Remediasi</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. STORE FLEET MATRIX & LIVE LOG STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* FLEET TABLE (2 COLS) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900">
                Matriks Armada Klien SaaS
              </h2>
              <p className="text-[11px] text-zinc-500">
                Kondisi terminal kasir, koneksi printer thermal, dan kuota penyimpanan browser
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {tenants.length} TENANTS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2 px-3">Toko / Tier</th>
                  <th className="py-2 px-3">Terminal & Hardware</th>
                  <th className="py-2 px-3">Storage / Queue</th>
                  <th className="py-2 px-3 text-right">Omzet Hari Ini</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                {tenants.map((t) => {
                  const totalOutlets = t.activeOutlets?.length || 0
                  const totalTerminals =
                    t.activeOutlets?.reduce((sum, o) => sum + o.activeTerminalsCount, 0) || 0
                  const gmv = t.activeOutlets?.reduce((sum, o) => sum + o.todayGmv, 0) || 0
                  const storage = t.latestTelemetry?.storage
                  const storageRatio = storage
                    ? Math.round((storage.localStorageBytes / storage.estimatedQuotaBytes) * 100)
                    : 20
                  const unsyncedCount = storage?.unSyncedTransactionsCount || 0
                  const printerStatus = t.latestTelemetry?.printers[0]?.status || 'connected'

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                      onClick={() => onInspectTenant(t)}
                    >
                      {/* STORE & TIER */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-900 leading-tight">
                          {t.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                          <span className="uppercase text-zinc-600 font-medium">
                            {t.subscriptionTier}
                          </span>
                          <span>·</span>
                          <span>{totalOutlets} Cabang</span>
                        </div>
                      </td>

                      {/* TERMINAL & HARDWARE */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-700">
                          <Tablet size={13} className="text-zinc-400" />
                          <span>{totalTerminals} Terminal</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono mt-0.5">
                          <Printer size={11} className="text-zinc-400" />
                          <span
                            className={
                              printerStatus === 'connected'
                                ? 'text-emerald-700'
                                : 'text-rose-700 font-medium'
                            }
                          >
                            {printerStatus === 'connected' ? 'Printer OK' : 'Printer Kertas Habis'}
                          </span>
                        </div>
                      </td>

                      {/* STORAGE / SYNC QUEUE */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                storageRatio > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(storageRatio, 100)}%` }}
                            />
                          </div>
                          <span className="text-zinc-600 text-[10px]">{storageRatio}%</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {unsyncedCount > 0 ? (
                            <span className="text-rose-600 font-medium">
                              {unsyncedCount} Antrean Stuck
                            </span>
                          ) : (
                            <span>Sync 100% Ok</span>
                          )}
                        </div>
                      </td>

                      {/* GMV */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-medium text-zinc-900">{formatRupiah(gmv)}</div>
                        <div className="text-[10px] text-zinc-500">
                          {t.activeOutlets?.reduce((sum, o) => sum + o.todayOrdersCount, 0)} order
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                            t.healthStatus === 'healthy'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.healthStatus === 'warning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : t.healthStatus === 'critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          {t.healthStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectTenant(t)}
                            className="px-2 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Diagnosa
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenRemediation(t.id)}
                            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Remedi
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* LIVE EXCEPTION & TELEMETRY STREAM (1 COL) */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-1.5">
              <Terminal size={14} className="text-zinc-600" />
              <h3 className="text-xs font-semibold text-zinc-900">
                Log Insiden & Exception
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              STREAM LIVE
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[380px]">
            {recentLogs.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className="p-2.5 rounded border border-zinc-200 bg-zinc-50/50 text-xs space-y-1 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-mono font-medium px-1 rounded uppercase ${
                        l.level === 'fatal'
                          ? 'bg-rose-100 text-rose-800'
                          : l.level === 'error'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {l.level}
                    </span>
                    <span className="font-semibold text-zinc-900 truncate max-w-[140px]">
                      {l.outletName || l.tenantId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(l.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-700 font-mono leading-tight">
                  {l.message}
                </p>

                {l.stackTrace && (
                  <div className="text-[10px] font-mono text-rose-800 bg-rose-50/60 p-1 rounded border border-rose-100 truncate">
                    {l.stackTrace}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-2.5 border-t border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Sinkronisasi otomatis aktif</span>
            <span className="text-zinc-700 font-medium">{recentLogs.length} total rekaman</span>
          </div>
        </div>
      </div>
    </div>
  )
}
