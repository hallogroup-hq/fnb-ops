'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Store,
  Printer,
  Tablet,
  Wrench,
  Eye,
  SlidersHorizontal,
} from 'lucide-react'
import type { TenantStore, HealthStatus, SubscriptionTier } from '../types/fleet'

interface TenantDirectoryTabProps {
  tenants: TenantStore[]
  onInspectTenant: (tenant: TenantStore) => void
  onOpenRemediation: (tenantId: string) => void
  onLaunchShadowMode: (tenant: TenantStore) => void
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export default function TenantDirectoryTab({
  tenants,
  onInspectTenant,
  onOpenRemediation,
  onLaunchShadowMode,
}: TenantDirectoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [healthFilter, setHealthFilter] = useState<HealthStatus | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | 'all'>('all')

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (healthFilter !== 'all' && t.healthStatus !== healthFilter) return false
      if (tierFilter !== 'all' && t.subscriptionTier !== tierFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = t.name.toLowerCase().includes(q)
        const matchLegal = t.legalName?.toLowerCase().includes(q)
        const matchOwner = t.ownerName.toLowerCase().includes(q)
        const matchSlug = t.slug.toLowerCase().includes(q)
        const matchPhone = t.ownerPhone.includes(q)
        const matchOutlet = t.activeOutlets?.some(
          (o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)
        )
        if (!matchName && !matchLegal && !matchOwner && !matchSlug && !matchPhone && !matchOutlet) {
          return false
        }
      }

      return true
    })
  }, [tenants, searchQuery, healthFilter, tierFilter])

  return (
    <div className="space-y-3">
      {/* 1. FILTER & SEARCH TOOLBAR (CLEAN, NO EMOJI SLOP) */}
      <div className="bg-white rounded-lg border border-zinc-200 p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* SEARCH INPUT */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama toko, outlet, pemilik, nomor telepon, atau slug..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-zinc-200 text-xs font-normal focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* HEALTH FILTER CHIPS */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setHealthFilter('all')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              healthFilter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Semua ({tenants.length})
          </button>
          <button
            type="button"
            onClick={() => setHealthFilter('healthy')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              healthFilter === 'healthy'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Sehat ({tenants.filter((t) => t.healthStatus === 'healthy').length})
          </button>
          <button
            type="button"
            onClick={() => setHealthFilter('warning')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              healthFilter === 'warning'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Peringatan ({tenants.filter((t) => t.healthStatus === 'warning').length})
          </button>
          <button
            type="button"
            onClick={() => setHealthFilter('critical')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              healthFilter === 'critical'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Kritis ({tenants.filter((t) => t.healthStatus === 'critical').length})
          </button>
        </div>

        {/* TIER FILTER */}
        <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-2 py-1 rounded border border-zinc-200 text-xs text-zinc-700 bg-white focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">Semua Lisensi</option>
            <option value="starter">Paket Starter</option>
            <option value="pro">Paket Pro</option>
            <option value="enterprise">Paket Enterprise</option>
          </select>
        </div>
      </div>

      {/* 2. TENANTS HIGH-DENSITY TABLE */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Toko / Tenant</th>
                <th className="py-2.5 px-3">Pemilik & Kontak</th>
                <th className="py-2.5 px-3">Lisensi & Status</th>
                <th className="py-2.5 px-3">Topologi Hardware</th>
                <th className="py-2.5 px-3">Storage Quota</th>
                <th className="py-2.5 px-3 text-right">Omzet Hari Ini</th>
                <th className="py-2.5 px-3 text-right">Aksi Remote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
              {filteredTenants.map((t) => {
                const totalOutlets = t.activeOutlets?.length || 0
                const totalTerminals =
                  t.activeOutlets?.reduce((sum, o) => sum + o.activeTerminalsCount, 0) || 0
                const gmv = t.activeOutlets?.reduce((sum, o) => sum + o.todayGmv, 0) || 0
                const daysLeft = Math.ceil(
                  (t.subscriptionValidUntil - Date.now()) / (1000 * 60 * 60 * 24)
                )
                const storage = t.latestTelemetry?.storage
                const storageRatio = storage
                  ? Math.round((storage.localStorageBytes / storage.estimatedQuotaBytes) * 100)
                  : 20
                const printerStatus = t.latestTelemetry?.printers[0]?.status || 'connected'

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                    onClick={() => onInspectTenant(t)}
                  >
                    {/* TENANT INFO */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {t.emergencyMaintenance && (
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-rose-600 text-white">
                            MAINTENANCE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {t.slug} · ID: {t.id}
                      </div>
                    </td>

                    {/* OWNER INFO */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-zinc-800">{t.ownerName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {t.ownerPhone}
                      </div>
                    </td>

                    {/* LICENSE & HEALTH */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {t.subscriptionTier}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
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
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        {daysLeft > 0 ? `${daysLeft} hari aktif` : 'Expired'}
                      </div>
                    </td>

                    {/* HARDWARE TOPOLOGY */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-700">
                        <Tablet size={12} className="text-zinc-400" />
                        <span>{totalOutlets} Cabang ({totalTerminals} Terminal)</span>
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
                          {printerStatus === 'connected' ? 'Printer OK' : 'Printer Problem'}
                        </span>
                      </div>
                    </td>

                    {/* STORAGE QUOTA */}
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              storageRatio > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(storageRatio, 100)}%` }}
                          />
                        </div>
                        <span className="text-zinc-600 text-[10px]">{storageRatio}%</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {storage ? `${(storage.localStorageBytes / 1024 / 1024).toFixed(1)} MB` : '-'}
                      </div>
                    </td>

                    {/* TODAY GMV */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <div className="font-semibold text-zinc-900">{formatRupiah(gmv)}</div>
                    </td>

                    {/* REMOTE ACTIONS */}
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectTenant(t)}
                          className="px-2 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Buka Diagnostik Hardware & Console"
                        >
                          Diagnosa
                        </button>

                        <button
                          type="button"
                          onClick={() => onLaunchShadowMode(t)}
                          className="p-1 rounded bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 text-[11px] transition-colors cursor-pointer"
                          title="Buka Toko Klien (Shadow Mode)"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenRemediation(t.id)}
                          className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
                          title="Kirim Perintah Perbaikan Jarak Jauh"
                        >
                          Remedi
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400">
                    <Store size={22} className="mx-auto mb-1.5 text-zinc-300" />
                    <p className="font-medium text-xs text-zinc-700">Tidak ada toko klien yang cocok</p>
                    <p className="text-[11px] text-zinc-500">Coba ubah kata kunci pencarian atau filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
