'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Store,
  ExternalLink,
  Printer,
  Tablet,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HardDrive,
  Clock,
  Eye,
  CheckCircle2,
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
        const matchOutlet = t.activeOutlets?.some((o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q))
        if (!matchName && !matchLegal && !matchOwner && !matchSlug && !matchPhone && !matchOutlet) {
          return false
        }
      }

      return true
    })
  }, [tenants, searchQuery, healthFilter, tierFilter])

  return (
    <div className="space-y-5">
      {/* 1. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        {/* SEARCH INPUT */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama toko, kode cabang, nama pemilik, WhatsApp, atau slug..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* STATUS & TIER FILTERS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* HEALTH FILTER */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="all">Semua Status Kesehatan</option>
            <option value="healthy">🟢 Sehat (Normal)</option>
            <option value="warning">🟡 Peringatan (Warning)</option>
            <option value="critical">🔴 Kritis (Ada Error)</option>
            <option value="offline">⚪ Offline (Tutup)</option>
          </select>

          {/* TIER FILTER */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="all">Semua Paket Lisensi</option>
            <option value="starter">Paket Starter</option>
            <option value="pro">Paket Pro</option>
            <option value="enterprise">Paket Enterprise</option>
          </select>
        </div>
      </div>

      {/* 2. TENANTS HIGH-DENSITY TABLE */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Toko / Tenant</th>
                <th className="py-3 px-4">Pemilik & Kontak</th>
                <th className="py-3 px-4">Lisensi & Plan</th>
                <th className="py-3 px-4">Status Kesehatan</th>
                <th className="py-3 px-4">Armada Perangkat</th>
                <th className="py-3 px-4">Omzet Hari Ini</th>
                <th className="py-3 px-4 text-right">Aksi Remote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTenants.map((t) => {
                const totalOutlets = t.activeOutlets?.length || 0
                const totalTerminals = t.activeOutlets?.reduce((sum, o) => sum + o.activeTerminalsCount, 0) || 0
                const gmv = t.activeOutlets?.reduce((sum, o) => sum + o.todayGmv, 0) || 0
                const daysLeft = Math.ceil((t.subscriptionValidUntil - Date.now()) / (1000 * 60 * 60 * 24))

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* TENANT INFO */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {t.emergencyMaintenance && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white">
                              MAINTENANCE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          slug: {t.slug} · ID: {t.id}
                        </div>
                      </div>
                    </td>

                    {/* OWNER INFO */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-800">{t.ownerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t.ownerPhone}
                        </div>
                      </div>
                    </td>

                    {/* LICENSE & BILLING */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-black text-[10px] uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {t.subscriptionTier}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {daysLeft > 0 ? (
                            <span>{daysLeft} hari lagi</span>
                          ) : (
                            <span className="text-rose-600 font-bold">Kedaluwarsa</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* HEALTH STATUS */}
                    <td className="py-3.5 px-4">
                      <div>
                        {t.healthStatus === 'healthy' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Sehat (Normal)
                          </span>
                        )}
                        {t.healthStatus === 'warning' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Waspada
                          </span>
                        )}
                        {t.healthStatus === 'critical' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Kritis (Error)
                          </span>
                        )}
                        {t.healthStatus === 'offline' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Offline
                          </span>
                        )}
                      </div>
                    </td>

                    {/* HARDWARE FLEET */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                          <Tablet size={13} className="text-slate-400" />
                          <span>{totalOutlets} Cabang ({totalTerminals} Terminal)</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <Printer size={13} className="text-slate-400" />
                          <span>{t.latestTelemetry?.printers?.length || 0} Printer Terdaftar</span>
                        </div>
                      </div>
                    </td>

                    {/* TODAY GMV */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">
                        {formatRupiah(gmv)}
                      </div>
                    </td>

                    {/* REMOTE ACTIONS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectTenant(t)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-black text-slate-800 text-xs font-bold transition-colors cursor-pointer bg-white"
                          title="Buka Diagnostik & Telemetri Mendalam"
                        >
                          Diagnostik
                        </button>

                        <button
                          type="button"
                          onClick={() => onLaunchShadowMode(t)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-black text-slate-700 hover:text-black transition-colors cursor-pointer bg-white"
                          title="Buka Toko Klien (1-Click Shadow Mode)"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenRemediation(t.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                          title="Eksekusi Remediasi Jarak Jauh"
                        >
                          Remediasi
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Store size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">Tidak ada toko klien yang cocok</p>
                    <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter status.</p>
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
