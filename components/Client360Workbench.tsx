'use client'

import React, { useState, useMemo } from 'react'
import {
  Store,
  Tablet,
  Printer,
  HardDrive,
  Users,
  UtensilsCrossed,
  CreditCard,
  Wrench,
  Terminal,
  Search,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
  RefreshCw,
  ShieldAlert,
  Send,
  Plus,
  KeyRound,
  Package,
  Layers,
  ChevronRight,
  Receipt,
  Zap,
  Battery,
  BatteryCharging,
  Wifi,
  Download,
} from 'lucide-react'
import type {
  TenantStore,
  RemoteLogEntry,
  TenantInvoice,
  StoreStaffUser,
  StoreMenuItemPreview,
  StoreInventoryPreview,
  StoreLiveOrderPreview,
} from '../types/fleet'

interface Client360WorkbenchProps {
  tenants: TenantStore[]
  logs: RemoteLogEntry[]
  invoices: TenantInvoice[]
  selectedTenantId?: string
  onSelectTenant: (tenantId: string) => void
  onUpdateTenant: (updated: TenantStore) => void
  onQueueCommand: (tenantId: string, commandType: any, payload?: Record<string, any>) => void
  onResolveLog: (logId: string) => void
  onLaunchShadowMode: (tenant: TenantStore) => void
  onResetStaffPin: (tenantId: string, staffId: string, newPin?: string) => void
  onToggleStaffStatus: (tenantId: string, staffId: string) => void
  onVoidOrder: (tenantId: string, orderId: string, reason: string) => void
  onSyncInventory: (tenantId: string) => void
  onTestPrint: (tenantId: string, printerId: string) => void
  onRestartPrinter: (tenantId: string, printerId: string) => void
  onExtendSubscription: (tenantId: string, days: number) => void
  onMarkInvoicePaid: (invoiceId: string) => void
  onTriggerBackup: (tenantId: string) => void
}

type ClientSubTab =
  | 'overview'
  | 'hardware'
  | 'staff'
  | 'data'
  | 'billing'
  | 'remediation'
  | 'logs'

export default function Client360Workbench({
  tenants,
  logs,
  invoices,
  selectedTenantId,
  onSelectTenant,
  onUpdateTenant,
  onQueueCommand,
  onResolveLog,
  onLaunchShadowMode,
  onResetStaffPin,
  onToggleStaffStatus,
  onVoidOrder,
  onSyncInventory,
  onTestPrint,
  onRestartPrinter,
  onExtendSubscription,
  onMarkInvoicePaid,
  onTriggerBackup,
}: Client360WorkbenchProps) {
  // Directory state
  const [directoryFilter, setDirectoryFilter] = useState<
    'all' | 'healthy' | 'critical' | 'expiring'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Active client sub-tab
  const [activeSubTab, setActiveSubTab] = useState<ClientSubTab>('overview')
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  // Current selected tenant
  const activeTenant = useMemo(() => {
    if (!tenants || tenants.length === 0) return null
    if (selectedTenantId) {
      const found = tenants.find((t) => t.id === selectedTenantId)
      if (found) return found
    }
    return tenants[0]
  }, [tenants, selectedTenantId])

  // Filtered directory list
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // Status filter
      if (directoryFilter === 'healthy' && t.healthStatus !== 'healthy') return false
      if (directoryFilter === 'critical' && t.healthStatus !== 'critical' && t.healthStatus !== 'warning')
        return false
      if (directoryFilter === 'expiring') {
        const days = Math.ceil((t.subscriptionValidUntil - Date.now()) / (1000 * 60 * 60 * 24))
        if (days > 30) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = t.name.toLowerCase().includes(q)
        const matchOwner = t.ownerName.toLowerCase().includes(q)
        const matchPhone = t.ownerPhone.includes(q)
        const matchSlug = t.slug.toLowerCase().includes(q)
        const matchOutlet = t.activeOutlets.some((o) => o.name.toLowerCase().includes(q))
        return matchName || matchOwner || matchPhone || matchSlug || matchOutlet
      }

      return true
    })
  }, [tenants, directoryFilter, searchQuery])

  // Active tenant logs
  const tenantLogs = useMemo(() => {
    if (!activeTenant) return []
    return logs.filter((l) => l.tenantId === activeTenant.id)
  }, [logs, activeTenant])

  // Active tenant invoices
  const tenantInvoices = useMemo(() => {
    if (!activeTenant) return []
    return invoices.filter((i) => i.tenantId === activeTenant.id)
  }, [invoices, activeTenant])

  function showFeedback(msg: string) {
    setFeedbackNotice(msg)
    setTimeout(() => setFeedbackNotice(null), 4000)
  }

  // Feature flag patch handler
  function handleToggleModule(moduleKey: string, currentVal: boolean) {
    if (!activeTenant) return
    const updated: TenantStore = {
      ...activeTenant,
      modules: {
        ...activeTenant.modules,
        [moduleKey]: !currentVal,
      },
      updatedAt: Date.now(),
    }
    onUpdateTenant(updated)
    onQueueCommand(activeTenant.id, 'PATCH_CONFIG', {
      modules: updated.modules,
    })
    showFeedback(`Modul "${moduleKey}" berhasil diperbarui dan disinkronkan ke kasir.`)
  }

  // Emergency maintenance toggle
  function handleToggleMaintenance() {
    if (!activeTenant) return
    const nextVal = !activeTenant.emergencyMaintenance
    const updated: TenantStore = {
      ...activeTenant,
      emergencyMaintenance: nextVal,
      updatedAt: Date.now(),
    }
    onUpdateTenant(updated)
    onQueueCommand(activeTenant.id, 'EMERGENCY_MAINTENANCE_TOGGLE', {
      emergencyMaintenance: nextVal,
    })
    showFeedback(
      nextVal
        ? 'Mode pemeliharaan darurat diaktifkan. Layar kasir toko dikunci.'
        : 'Mode pemeliharaan dinonaktifkan. Kasir dapat bertransaksi kembali normal.'
    )
  }

  if (!activeTenant) {
    return (
      <div className="p-8 text-center bg-white border border-zinc-200 rounded-lg text-zinc-500 font-mono text-xs">
        Belum ada toko yang terdaftar dalam sistem.
      </div>
    )
  }

  const daysRemaining = Math.ceil(
    (activeTenant.subscriptionValidUntil - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="w-full min-w-0 flex flex-col lg:flex-row items-start gap-3.5">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT PANE: CLIENT DIRECTORY STRIP (MASTER LIST)             */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full lg:w-64 xl:w-72 shrink-0 bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
        {/* DIRECTORY HEADER & SEARCH */}
        <div className="p-3 border-b border-zinc-200 space-y-2 bg-zinc-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 tracking-tight flex items-center gap-1.5">
              <Store size={14} className="text-zinc-600" />
              <span>Direktori Klien</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-medium">
              {tenants.length} Toko
            </span>
          </div>

          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Cari toko, owner, cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded border border-zinc-200 text-xs bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 font-mono"
            />
          </div>

          {/* FILTER PILLS */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'healthy', label: 'Sehat' },
              { id: 'critical', label: 'Kritis' },
              { id: 'expiring', label: '< 30 Hari' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDirectoryFilter(f.id as any)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                  directoryFilter === f.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* DIRECTORY ITEMS LIST */}
        <div className="divide-y divide-zinc-100 max-h-[calc(100vh-230px)] overflow-y-auto">
          {filteredTenants.length > 0 ? (
            filteredTenants.map((t) => {
              const isSelected = t.id === activeTenant.id
              const isCrit = t.healthStatus === 'critical'
              const isWarn = t.healthStatus === 'warning'
              const tDays = Math.ceil(
                (t.subscriptionValidUntil - Date.now()) / (1000 * 60 * 60 * 24)
              )

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTenant(t.id)
                  }}
                  className={`w-full text-left p-3 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 border-l-3 border-l-zinc-900'
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-zinc-900 truncate">
                        {t.name}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5 truncate">
                      <span>{t.ownerName}</span>
                      <span>·</span>
                      <span>{t.activeOutlets.length} Cbg</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase font-semibold">
                        {t.subscriptionTier}
                      </span>

                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded border font-medium ${
                          isCrit
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isWarn
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {t.healthStatus.toUpperCase()}
                      </span>

                      {tDays <= 14 && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                          {tDays <= 0 ? 'PAST DUE' : `${tDays}H`}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    size={14}
                    className={`shrink-0 mt-1 transition-transform ${
                      isSelected ? 'text-zinc-900 translate-x-0.5' : 'text-zinc-300'
                    }`}
                  />
                </button>
              )
            })
          ) : (
            <div className="p-6 text-center text-zinc-400 text-xs font-mono">
              Tidak ada toko sesuai filter.
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. RIGHT PANE: CLIENT 360° WORKSPACE (FOCUSED ACTIVE TENANT)   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 min-w-0 w-full bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
        {/* WORKBENCH TOP BAR */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight truncate">
                {activeTenant.name}
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase font-semibold shrink-0">
                TIER: {activeTenant.subscriptionTier}
              </span>
              <span
                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase shrink-0 whitespace-nowrap ${
                  activeTenant.healthStatus === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeTenant.healthStatus === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : activeTenant.healthStatus === 'critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {activeTenant.healthStatus.toUpperCase()}
              </span>
              {activeTenant.emergencyMaintenance && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-600 text-white shrink-0 whitespace-nowrap">
                  MAINTENANCE LOCK
                </span>
              )}
            </div>

            <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="truncate">Domain: {activeTenant.slug}</span>
              <span>·</span>
              <span className="truncate">Pemilik: {activeTenant.ownerName} ({activeTenant.ownerPhone})</span>
              <span>·</span>
              <span className="truncate">ID: {activeTenant.id}</span>
            </div>
          </div>

          {/* ACTIONS: SHADOW MODE & STORE LINK */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onLaunchShadowMode(activeTenant)}
              className="px-2.5 sm:px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Buka Toko Klien dengan otentikasi tim support (Shadow Mode)"
            >
              <Eye size={13} />
              <span className="whitespace-nowrap">Shadow Mode</span>
            </button>

            <a
              href={activeTenant.liveStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              title="Buka Website Kasir Langsung"
            >
              <ExternalLink size={13} />
              <span className="whitespace-nowrap">Buka Toko</span>
            </a>
          </div>
        </div>

        {/* FEEDBACK NOTICE BANNER */}
        {feedbackNotice && (
          <div className="py-2 px-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* WORKBENCH SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1 px-3 sm:px-4 border-b border-zinc-200 bg-white overflow-x-auto w-full min-w-0 shrink-0">
          {[
            { id: 'overview', label: `Cabang (${activeTenant.activeOutlets.length})`, icon: Store },
            { id: 'hardware', label: 'Hardware & Kasir', icon: Tablet },
            {
              id: 'staff',
              label: `Staf (${activeTenant.staffUsers?.length || 0})`,
              icon: Users,
            },
            {
              id: 'data',
              label: `Menu & Stok (${(activeTenant.inventoryItems?.filter((i) => i.isNegative).length || 0) > 0 ? 'Minus!' : 'Normal'})`,
              icon: UtensilsCrossed,
              highlight: (activeTenant.inventoryItems?.filter((i) => i.isNegative).length || 0) > 0,
            },
            {
              id: 'billing',
              label: `Paket & Lisensi (${daysRemaining <= 0 ? 'Past Due' : `${daysRemaining}H`})`,
              icon: CreditCard,
              highlight: daysRemaining <= 7,
            },
            { id: 'remediation', label: 'Remote & DB', icon: Wrench },
            {
              id: 'logs',
              label: `Log Error (${tenantLogs.filter((l) => !l.resolved).length})`,
              icon: Terminal,
              highlight: tenantLogs.filter((l) => !l.resolved).length > 0,
            },
          ].map((tb) => {
            const Icon = tb.icon
            const isSel = activeSubTab === tb.id
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => setActiveSubTab(tb.id as any)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  isSel
                    ? 'border-zinc-950 text-zinc-950 font-semibold'
                    : tb.highlight
                    ? 'border-transparent text-rose-600 hover:text-rose-700 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span>{tb.label}</span>
              </button>
            )
          })}
        </div>

        {/* WORKBENCH BODY VIEW */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* ========================================================= */}
          {/* 1. OVERVIEW & CABANG (OUTLETS)                            */}
          {/* ========================================================= */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4 w-full min-w-0">
              {/* STORE PROFILE METRICS STRIP */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 rounded-md border border-zinc-200 bg-zinc-50/50 min-w-0">
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">GMV HARI INI</span>
                  <span className="text-base font-bold text-zinc-900 font-mono truncate block">
                    Rp {activeTenant.activeOutlets
                      .reduce((sum, o) => sum + (o.todayGmv || 0), 0)
                      .toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">Seluruh cabang aktif</span>
                </div>

                <div className="p-3 rounded-md border border-zinc-200 bg-zinc-50/50 min-w-0">
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">PESANAN HARI INI</span>
                  <span className="text-base font-bold text-zinc-900 font-mono truncate block">
                    {activeTenant.activeOutlets.reduce(
                      (sum, o) => sum + (o.todayOrdersCount || 0),
                      0
                    )}{' '}
                    Transaksi
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">Volume penjualan</span>
                </div>

                <div className="p-3 rounded-md border border-zinc-200 bg-zinc-50/50 min-w-0">
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">MASA AKTIF LISENSI</span>
                  <span className="text-base font-bold text-zinc-900 font-mono truncate block">
                    {daysRemaining <= 0 ? 'Lewat Jatuh Tempo' : `${daysRemaining} Hari Lagi`}
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">
                    {new Date(activeTenant.subscriptionValidUntil).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <div className="p-3 rounded-md border border-zinc-200 bg-zinc-50/50 min-w-0">
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">KUOTA CABANG & KASIR</span>
                  <span className="text-base font-bold text-zinc-900 font-mono truncate block">
                    {activeTenant.activeOutlets.length} / {activeTenant.maxOutlets} Cabang
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">
                    Maks {activeTenant.maxTerminals} Terminal
                  </span>
                </div>
              </div>

              {/* LIST OF STORE OUTLETS / BRANCHES */}
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900">
                    Daftar Gerai & Cabang ({activeTenant.activeOutlets.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">STATUS OPERASIONAL</span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {activeTenant.activeOutlets.map((outlet) => (
                    <div
                      key={outlet.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          <span>{outlet.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-normal">
                            KODE: {outlet.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          ID: {outlet.id} · {outlet.activeTerminalsCount} Terminal Aktif
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-semibold text-zinc-900 font-mono block">
                            Rp {outlet.todayGmv.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {outlet.todayOrdersCount} Pesanan
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
                            outlet.printerHealth === 'ok'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : outlet.printerHealth === 'issue'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          PRINTER {outlet.printerHealth.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LEGAL & BANKING PROFILE */}
              <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2 text-xs">
                <span className="font-semibold text-zinc-900 block">
                  Data Legalitas & Rekening Perbankan Klien
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">ENTITAS HUKUM / NPWP:</span>
                    <span className="text-zinc-800 font-medium">
                      {activeTenant.legalName} ({activeTenant.taxId || 'NPWP: -'})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">REKENING BANK PENCAIRAN:</span>
                    <span className="text-zinc-800 font-medium">
                      {activeTenant.bankName} - {activeTenant.bankAccount || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">ALAMAT OPERASIONAL:</span>
                    <span className="text-zinc-800 font-sans text-xs">
                      {activeTenant.address || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. HARDWARE & TERMINALS (TABLET, PRINTER, KDS)            */}
          {/* ========================================================= */}
          {activeSubTab === 'hardware' && (
            <div className="space-y-4 w-full min-w-0">
              {/* POS TERMINALS */}
              <div>
                <div className="text-xs font-semibold text-zinc-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tablet size={14} className="text-zinc-600" />
                    <span>Terminal Kasir & Display Dapur (KDS)</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">TELEMETRI REALTIME</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTenant.latestTelemetry?.devices &&
                  activeTenant.latestTelemetry.devices.length > 0 ? (
                    activeTenant.latestTelemetry.devices.map((d) => (
                      <div
                        key={d.deviceId}
                        className="p-3.5 rounded-lg border border-zinc-200 bg-white space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-zinc-900">{d.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              ID: {d.deviceId} · {d.outletId}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ONLINE ({d.networkLatencyMs}ms)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-zinc-100 font-mono">
                          <div>
                            <span className="text-zinc-400 block text-[10px]">OS / Browser:</span>
                            <span className="text-zinc-700 font-sans">
                              {d.os} ({d.browser})
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Resolusi Layar:</span>
                            <span className="text-zinc-700">{d.screenResolution}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Versi Aplikasi:</span>
                            <span className="text-zinc-900 font-semibold">{d.appVersion}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Status Baterai:</span>
                            <span className="text-zinc-700">
                              {d.batteryLevel ? `${d.batteryLevel}%` : 'N/A'}{' '}
                              {d.isCharging ? '(Charging)' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-400 border border-zinc-200 rounded-lg text-xs col-span-2">
                      Belum ada telemetri tablet kasir yang tercatat.
                    </div>
                  )}
                </div>
              </div>

              {/* THERMAL PRINTERS WITH DIRECT ACTION BUTTONS */}
              <div>
                <div className="text-xs font-semibold text-zinc-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Printer size={14} className="text-zinc-600" />
                    <span>Printer Thermal Struk Kasir</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">HARDWARE CONTROLS</span>
                </div>

                <div className="space-y-3">
                  {activeTenant.latestTelemetry?.printers &&
                  activeTenant.latestTelemetry.printers.length > 0 ? (
                    activeTenant.latestTelemetry.printers.map((p) => {
                      const isConnected = p.status === 'connected'
                      const isOutPaper = p.status === 'out_of_paper'

                      return (
                        <div
                          key={p.printerId}
                          className="p-3.5 rounded-lg border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900">{p.name}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase font-medium ${
                                  isConnected
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isOutPaper
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                }`}
                              >
                                {p.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="text-[11px] text-zinc-500 font-mono">
                              Koneksi: {p.connectionType.toUpperCase()} · Lebar Kertas: {p.paperWidth}{' '}
                              · Gagal Cetak: {p.failedJobsCount}x
                            </div>
                          </div>

                          {/* ACTION BUTTONS FOR PRINTER */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onTestPrint(activeTenant.id, p.printerId)
                                showFeedback(
                                  `Perintah Test Print dikirim ke printer "${p.name}".`
                                )
                              }}
                              className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs font-mono transition-colors cursor-pointer"
                            >
                              Test Print Jarak Jauh
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onRestartPrinter(activeTenant.id, p.printerId)
                                showFeedback(
                                  `Driver koneksi printer "${p.name}" di-restart.`
                                )
                              }}
                              className="px-2.5 py-1.5 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs font-mono transition-colors cursor-pointer"
                            >
                              Restart Driver
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-6 text-center text-zinc-400 border border-zinc-200 rounded-lg text-xs">
                      Tidak ada printer thermal yang terdaftar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. STORE STAFF & CREDENTIALS (PIN RESET & ACCOUNTS)       */}
          {/* ========================================================= */}
          {activeSubTab === 'staff' && (
            <div className="space-y-4 w-full min-w-0">
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden w-full min-w-0">
                <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                      <Users size={14} className="text-zinc-600" />
                      <span>Manajemen Staf Kasir & Kredensial Toko</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Reset PIN kasir seketika jika staf lupa saat transaksi berlangsung tanpa perlu buka database
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {activeTenant.staffUsers?.length || 0} PENGGUNA
                  </span>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-mono text-zinc-500 uppercase">
                        <th className="py-2.5 px-3.5 font-semibold">Nama Staf</th>
                        <th className="py-2.5 px-3.5 font-semibold">Peran (Role)</th>
                        <th className="py-2.5 px-3.5 font-semibold">Cabang Penempatan</th>
                        <th className="py-2.5 px-3.5 font-semibold">PIN Kasir</th>
                        <th className="py-2.5 px-3.5 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-3.5 font-semibold text-right">Tindakan Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {activeTenant.staffUsers && activeTenant.staffUsers.length > 0 ? (
                        activeTenant.staffUsers.map((staff) => (
                          <tr key={staff.id} className="hover:bg-zinc-50/60 font-mono text-[11px]">
                            <td className="py-2.5 px-3.5 font-semibold text-zinc-900 font-sans">
                              {staff.name}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase font-semibold text-[10px]">
                                {staff.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-zinc-600 font-sans">
                              {staff.outletId
                                ? activeTenant.activeOutlets.find((o) => o.id === staff.outletId)
                                    ?.name || staff.outletId
                                : 'Semua Cabang'}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-zinc-900">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                                {staff.pin}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-semibold border ${
                                  staff.active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                }`}
                              >
                                {staff.active ? 'AKTIF' : 'NONAKTIF'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onResetStaffPin(activeTenant.id, staff.id, '1234')
                                    showFeedback(`PIN untuk "${staff.name}" berhasil di-reset ke 1234.`)
                                  }}
                                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-[10px] transition-colors cursor-pointer"
                                  title="Reset PIN ke default 1234"
                                >
                                  Reset PIN (1234)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onToggleStaffStatus(activeTenant.id, staff.id)
                                    showFeedback(`Status staf "${staff.name}" berhasil diubah.`)
                                  }}
                                  className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium text-[10px] transition-colors cursor-pointer"
                                >
                                  {staff.active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-zinc-400 font-sans">
                            Belum ada staf yang terdaftar pada toko ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. MENU, STOCK & LIVE ORDERS (DATA EXPLORER)              */}
          {/* ========================================================= */}
          {activeSubTab === 'data' && (
            <div className="space-y-4 w-full min-w-0">
              {/* INVENTORY RECONCILIATION STRIP */}
              <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3 w-full min-w-0">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                      <Package size={14} className="text-zinc-600" />
                      <span>Stok Bahan Baku & Deteksi Stok Minus</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Deteksi bahan baku yang terjual melebihi stok fisik dan sinkronkan kalkulasi HPP
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSyncInventory(activeTenant.id)
                      showFeedback('Kalkulasi ulang HPP & sinkronisasi stok bahan baku berhasil!')
                    }}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCw size={13} />
                    <span>Sinkronkan Stok & Rekonsiliasi HPP</span>
                  </button>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-mono text-zinc-500 uppercase">
                        <th className="py-2 px-3 font-semibold">Nama Bahan Baku</th>
                        <th className="py-2 px-3 font-semibold">Stok Saat Ini</th>
                        <th className="py-2 px-3 font-semibold">Stok Minimum</th>
                        <th className="py-2 px-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {activeTenant.inventoryItems && activeTenant.inventoryItems.length > 0 ? (
                        activeTenant.inventoryItems.map((inv) => (
                          <tr key={inv.id} className="hover:bg-zinc-50/60">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900 font-sans">
                              {inv.name}
                            </td>
                            <td
                              className={`py-2.5 px-3 font-bold ${
                                inv.isNegative ? 'text-rose-600' : 'text-zinc-800'
                              }`}
                            >
                              {inv.currentStock} {inv.unit}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {inv.minimumStock} {inv.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {inv.isNegative ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] uppercase font-bold border border-rose-200">
                                  STOK MINUS ALERT
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] uppercase font-semibold border border-emerald-200">
                                  AMAN
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-400 font-sans">
                            Belum ada master bahan baku yang terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIVE ORDERS FEED & VOID STUCK BILLS */}
              <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <h3 className="font-semibold text-xs text-zinc-900">
                    Live Transaksi Hari Ini ({activeTenant.liveOrders?.length || 0})
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400">
                    KASIR TRANSACTION STREAM
                  </span>
                </div>

                <div className="space-y-2">
                  {activeTenant.liveOrders && activeTenant.liveOrders.length > 0 ? (
                    activeTenant.liveOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`p-3 rounded-md border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          ord.orderStatus === 'stuck'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-zinc-50/50 border-zinc-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold font-mono text-zinc-900">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                              {ord.tableName}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                                ord.orderStatus === 'stuck'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-600 mt-0.5">
                            {ord.itemsSummary} · Pembeli: {ord.customerName}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-zinc-900 font-mono">
                            Rp {ord.totalAmount.toLocaleString('id-ID')}
                          </span>

                          {ord.orderStatus === 'stuck' && (
                            <button
                              type="button"
                              onClick={() => {
                                onVoidOrder(activeTenant.id, ord.id, 'Pesanan macet di kasir di-void oleh ops')
                                showFeedback(`Pesanan ${ord.orderNumber} berhasil di-void.`)
                              }}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              Void Pesanan Macet
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-zinc-400 text-xs">
                      Belum ada transaksi hari ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. PAKET, LISENSI & TAGIHAN SAAS                          */}
          {/* ========================================================= */}
          {activeSubTab === 'billing' && (
            <div className="space-y-4 w-full min-w-0">
              {/* SUBSCRIPTION STATUS STRIP */}
              <div className="bg-white rounded-lg border border-zinc-200 p-3.5 sm:p-4 space-y-3 w-full min-w-0">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5 truncate">
                      <CreditCard size={14} className="text-zinc-600 shrink-0" />
                      <span className="truncate">Status Paket & Siklus Penagihan</span>
                    </h3>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                      Paket SaaS Klien Aktif
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase shrink-0 whitespace-nowrap ${
                      activeTenant.billingStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : activeTenant.billingStatus === 'trial'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : activeTenant.billingStatus === 'past_due' || activeTenant.billingStatus === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {activeTenant.billingStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                  <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100 min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">TARIF BULANAN</span>
                    <span className="font-semibold text-zinc-900 font-mono truncate block">
                      Rp {(activeTenant.monthlyFee || 799000).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-zinc-500 block capitalize truncate">
                      {activeTenant.billingCycle || 'monthly'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100 min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">MASA BERLAKU</span>
                    <span className="font-semibold text-zinc-900 font-mono truncate block">
                      {new Date(activeTenant.subscriptionValidUntil).toLocaleDateString('id-ID')}
                    </span>
                    <span
                      className={`text-[10px] font-mono block truncate ${
                        daysRemaining <= 0
                          ? 'text-rose-600 font-semibold'
                          : daysRemaining <= 14
                          ? 'text-amber-600 font-semibold'
                          : 'text-zinc-500'
                      }`}
                    >
                      {daysRemaining <= 0 ? 'PAST DUE' : `${daysRemaining} Hari Lagi`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100 min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">TOTAL LTV PEMBAYARAN</span>
                    <span className="font-semibold text-emerald-700 font-mono truncate block">
                      Rp {(activeTenant.lifetimePaid || 0).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-zinc-500 block truncate">Akumulasi Kas</span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100 min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">AUTO RENEWAL</span>
                    <span className="font-semibold text-zinc-800 font-mono truncate block">
                      {activeTenant.autoRenew ? 'AKTIF' : 'MANUAL'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block truncate">Siklus Faktur</span>
                  </div>
                </div>

                {/* EXTEND LICENSE BUTTONS */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-zinc-500 font-medium">Perpanjang Lisensi:</span>
                    <button
                      type="button"
                      onClick={() => onExtendSubscription(activeTenant.id, 30)}
                      className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs font-mono transition-colors cursor-pointer border border-zinc-200"
                    >
                      +30 Hari (1 Bulan)
                    </button>
                    <button
                      type="button"
                      onClick={() => onExtendSubscription(activeTenant.id, 365)}
                      className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs font-mono transition-colors cursor-pointer border border-zinc-200"
                    >
                      +365 Hari (1 Tahun)
                    </button>
                  </div>
                </div>
              </div>

              {/* INVOICES LIST FOR THIS CLIENT */}
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden w-full min-w-0">
                <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900 truncate">
                    Riwayat Faktur Toko Ini ({tenantInvoices.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">FAKTUR KLIEN</span>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-mono text-zinc-500 uppercase">
                        <th className="py-2 px-3 font-semibold">No. Faktur</th>
                        <th className="py-2 px-3 font-semibold text-right">Nominal</th>
                        <th className="py-2 px-3 font-semibold">Jatuh Tempo</th>
                        <th className="py-2 px-3 font-semibold text-center">Status</th>
                        <th className="py-2 px-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {tenantInvoices.length > 0 ? (
                        tenantInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-zinc-50/60">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900 text-right">
                              Rp {inv.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-semibold border ${
                                  inv.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : inv.status === 'overdue'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans">
                              {inv.status !== 'paid' && (
                                <button
                                  type="button"
                                  onClick={() => onMarkInvoicePaid(inv.id)}
                                  className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium transition-colors cursor-pointer"
                                >
                                  Tandai Lunas
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-zinc-400 font-sans">
                            Belum ada riwayat faktur.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. REMOTE CONTROL & DATABASE SNAPSHOT                     */}
          {/* ========================================================= */}
          {activeSubTab === 'remediation' && (
            <div className="space-y-4 w-full min-w-0">
              <div className="bg-zinc-900 text-zinc-100 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-emerald-400" />
                    <span className="font-semibold text-xs text-white">
                      Remediasi Jarak Jauh Toko {activeTenant.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">REMOTE INSTANCE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded bg-zinc-800 border border-zinc-700 space-y-2">
                    <div className="font-semibold text-xs text-white">Purge Browser Cache</div>
                    <p className="text-[10px] text-zinc-400">
                      Hapus cache bundle browser yang korup pada seluruh tablet toko ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onQueueCommand(activeTenant.id, 'FORCE_CACHE_PURGE')
                        showFeedback('Perintah purge cache disiarkan ke tablet kasir.')
                      }}
                      className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Purge Cache Toko
                    </button>
                  </div>

                  <div className="p-3 rounded bg-zinc-800 border border-zinc-700 space-y-2">
                    <div className="font-semibold text-xs text-white">Lepas Tagihan Nyangkut</div>
                    <p className="text-[10px] text-zinc-400">
                      Buka kunci meja dan lepaskan pesanan checkout yang hang.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onQueueCommand(activeTenant.id, 'CLEAR_STUCK_BILLS')
                        showFeedback('Perintah unfreeze pesanan & meja berhasil dikirim.')
                      }}
                      className="w-full py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Unfreeze All Bills
                    </button>
                  </div>

                  <div className="p-3 rounded bg-zinc-800 border border-zinc-700 space-y-2">
                    <div className="font-semibold text-xs text-white">Snapshot Database</div>
                    <p className="text-[10px] text-zinc-400">
                      Ambil cadangan terenkripsi seluruh data toko ini seketika.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onTriggerBackup(activeTenant.id)
                        showFeedback('Snapshot database toko berhasil diambil dan diarsipkan.')
                      }}
                      className="w-full py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      Trigger Snapshot Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* EMERGENCY MAINTENANCE LOCK TOGGLE */}
              <div className="p-4 rounded-lg border border-zinc-200 bg-white flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-zinc-900">
                    Mode Pemeliharaan Darurat Toko (Maintenance Lock)
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Jika aktif, layar kasir akan dikunci dengan banner pemberitahuan pemeliharaan resmi
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className={`px-3 py-1.5 rounded font-medium text-xs transition-colors cursor-pointer ${
                    activeTenant.emergencyMaintenance
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
                  }`}
                >
                  {activeTenant.emergencyMaintenance ? 'NONAKTIFKAN LOCK' : 'AKTIFKAN MAINTENANCE'}
                </button>
              </div>

              {/* FEATURE MODULES / ENTITLEMENTS MATRIX */}
              <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-3">
                <div className="border-b border-zinc-100 pb-2">
                  <span className="font-semibold text-xs text-zinc-900 block">
                    Modul Fitur Granular (Entitlements Matrix)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Aktifkan atau nonaktifkan fitur bisnis untuk toko ini dari jarak jauh
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'kitchen_routing_kds', label: 'KDS Layar Dapur' },
                    { key: 'inventory_recipes_hpp', label: 'Resep Bahan & HPP' },
                    { key: 'batch_production_roasting', label: 'Dapur Roastery / Produksi' },
                    { key: 'b2b_wholesale_invoicing', label: 'Catering & Faktur B2B' },
                    { key: 'accurate_grade_accounting', label: 'Akuntansi SAK EMKM' },
                    { key: 'multi_warehouse_transfer', label: 'Transfer Antar Gudang' },
                  ].map((m) => {
                    const isEnabled = activeTenant.modules[m.key] ?? false
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => handleToggleModule(m.key, isEnabled)}
                        className={`p-2.5 rounded border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                        }`}
                      >
                        <span className="truncate text-[11px]">{m.label}</span>
                        <span
                          className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                            isEnabled ? 'bg-emerald-200 text-emerald-900' : 'bg-zinc-200 text-zinc-600'
                          }`}
                        >
                          {isEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. CONSOLE LOGS & STACK TRACES                            */}
          {/* ========================================================= */}
          {activeSubTab === 'logs' && (
            <div className="space-y-3 w-full min-w-0">
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden w-full min-w-0">
                <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900">
                    Log Error Khusus Toko {activeTenant.name} ({tenantLogs.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">EXCEPTIONS AUDIT</span>
                </div>

                <div className="divide-y divide-zinc-100 p-3 space-y-2">
                  {tenantLogs.length > 0 ? (
                    tenantLogs.map((l) => (
                      <div
                        key={l.id}
                        className={`p-3 rounded border text-xs space-y-1.5 ${
                          l.resolved
                            ? 'bg-zinc-50 border-zinc-200 opacity-60'
                            : l.level === 'fatal'
                            ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                            : 'bg-amber-50/40 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-medium px-1 rounded uppercase bg-zinc-200 text-zinc-800">
                              {l.level}
                            </span>
                            <span className="font-semibold text-xs">{l.sourceModule}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {new Date(l.timestamp).toLocaleTimeString('id-ID')}
                            </span>
                            {!l.resolved && (
                              <button
                                type="button"
                                onClick={() => {
                                  onResolveLog(l.id)
                                  showFeedback('Log insiden diselesaikan.')
                                }}
                                className="px-2 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-medium cursor-pointer"
                              >
                                Selesaikan
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-mono text-xs">{l.message}</p>

                        {l.stackTrace && (
                          <details className="text-[10px] font-mono bg-zinc-900 text-zinc-100 p-2 rounded cursor-pointer">
                            <summary className="text-zinc-400">Lihat Stack Trace</summary>
                            <pre className="mt-1 text-zinc-300 whitespace-pre-wrap">
                              {l.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-400 text-xs">
                      Tidak ada log error yang tercatat untuk toko ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
