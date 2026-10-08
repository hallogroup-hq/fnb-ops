'use client'

import React, { useState, useEffect, useMemo } from 'react'
import AuthGate from '../components/AuthGate'
import FleetHeader from '../components/FleetHeader'
import FleetSidebar, { ActiveOpsTab } from '../components/FleetSidebar'
import FleetOverviewTab from '../components/FleetOverviewTab'
import TenantDirectoryTab from '../components/TenantDirectoryTab'
import TenantDeepInspectorModal from '../components/TenantDeepInspectorModal'
import ProvisioningTab from '../components/ProvisioningTab'
import AuditLogTab from '../components/AuditLogTab'

import {
  getFleetTenants,
  saveFleetTenants,
  updateTenant,
  getRemoteLogs,
  resolveRemoteLog,
  getRemoteCommands,
  queueRemoteCommand,
  getProvisioningRequests,
  approveProvisioningRequest,
  rejectProvisioningRequest,
  getStaffAuditLogs,
  calculateFleetStats,
} from '../lib/fleet/telemetryStore'

import type {
  TenantStore,
  RemoteLogEntry,
  RemoteRepairCommand,
  ProvisioningRequest,
  StaffAuditLog,
} from '../types/fleet'

import { Terminal, Wrench, Zap, CheckCircle2 } from 'lucide-react'

export default function FleetOpsApp() {
  const [activeTab, setActiveTab] = useState<ActiveOpsTab>('overview')
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  // STORE STATE
  const [tenants, setTenants] = useState<TenantStore[]>([])
  const [logs, setLogs] = useState<RemoteLogEntry[]>([])
  const [commands, setCommands] = useState<RemoteRepairCommand[]>([])
  const [requests, setRequests] = useState<ProvisioningRequest[]>([])
  const [auditLogs, setAuditLogs] = useState<StaffAuditLog[]>([])

  const [selectedTenantForModal, setSelectedTenantForModal] = useState<TenantStore | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  function loadAllData() {
    setIsRefreshing(true)
    const t = getFleetTenants()
    const l = getRemoteLogs()
    const c = getRemoteCommands()
    const r = getProvisioningRequests()
    const a = getStaffAuditLogs()

    setTenants(t)
    setLogs(l)
    setCommands(c)
    setRequests(r)
    setAuditLogs(a)

    setTimeout(() => {
      setIsRefreshing(false)
    }, 400)
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const stats = useMemo(() => calculateFleetStats(tenants), [tenants])

  function handleUpdateTenant(updated: TenantStore) {
    updateTenant(updated)
    setTenants(getFleetTenants())
    if (selectedTenantForModal?.id === updated.id) {
      setSelectedTenantForModal(updated)
    }
  }

  function handleQueueCommand(
    tenantId: string,
    commandType: any,
    payload?: Record<string, any>
  ) {
    queueRemoteCommand({
      tenantId,
      commandType,
      payload,
      issuedBy: 'ops@hallogroup.id',
    })
    setCommands(getRemoteCommands())
    setAuditLogs(getStaffAuditLogs())
  }

  function handleResolveLog(logId: string) {
    resolveRemoteLog(logId)
    setLogs(getRemoteLogs())
  }

  function handleApproveRequest(reqId: string) {
    approveProvisioningRequest(reqId)
    loadAllData()
    setActionNotice('Permohonan pendaftaran disetujui & toko berhasil diterbitkan!')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleRejectRequest(reqId: string, reason?: string) {
    rejectProvisioningRequest(reqId, reason)
    loadAllData()
  }

  function handleCreateTenant(newTenant: Partial<TenantStore>) {
    const tenantId = newTenant.id || `org-${Date.now().toString(36)}`
    const full: TenantStore = {
      id: tenantId,
      slug: newTenant.slug || tenantId,
      name: newTenant.name || 'Toko Baru',
      legalName: newTenant.legalName || newTenant.name || 'Toko Baru',
      ownerName: newTenant.ownerName || 'Pemilik',
      ownerPhone: newTenant.ownerPhone || '-',
      ownerEmail: newTenant.ownerEmail || '-',
      subscriptionTier: newTenant.subscriptionTier || 'pro',
      billingStatus: 'active',
      subscriptionValidUntil: newTenant.subscriptionValidUntil || Date.now() + 1000 * 60 * 60 * 24 * 365,
      maxOutlets: newTenant.maxOutlets || 2,
      maxTerminals: newTenant.maxTerminals || 4,
      healthStatus: 'healthy',
      liveStoreUrl: `https://fnb-erp.vercel.app?tenant=${tenantId}`,
      activeOutlets: [
        {
          id: `out-${tenantId}-1`,
          name: 'Cabang Utama',
          code: 'MAIN',
          activeTerminalsCount: 1,
          printerHealth: 'ok',
          todayGmv: 0,
          todayOrdersCount: 0,
        },
      ],
      modules: {
        pos_quick_service: true,
        pos_dine_in_tables: true,
        kitchen_routing_kds: true,
        inventory_basic: true,
        inventory_recipes_hpp: true,
        multi_warehouse_transfer: true,
        batch_production_roasting: true,
        b2b_wholesale_invoicing: true,
        accurate_grade_accounting: true,
        fixed_assets: true,
        bank_reconciliation: true,
        live_excel_export: true,
        official_pdf_export: true,
      },
      emergencyMaintenance: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    updateTenant(full)
    loadAllData()
  }

  function handleLaunchShadowMode(tenant: TenantStore) {
    const shadowUrl = `${tenant.liveStoreUrl}${tenant.liveStoreUrl.includes('?') ? '&' : '?'}shadow_mode=true&tenant_id=${tenant.id}&staff=ops_hallo`
    if (typeof window !== 'undefined') {
      window.open(shadowUrl, '_blank')
    }
  }

  function handleOpenRemediation(tenantId: string) {
    const target = tenants.find((t) => t.id === tenantId)
    if (target) {
      setSelectedTenantForModal(target)
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-slate-900">
        {/* HEADER */}
        <FleetHeader
          stats={stats}
          onOpenProvisionModal={() => setActiveTab('provisioning')}
          onRefreshData={loadAllData}
          isRefreshing={isRefreshing}
        />

        {/* NOTICE TOAST */}
        {actionNotice && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3">
            <CheckCircle2 size={16} />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* WORKSPACE LAYOUT */}
        <div className="flex-1 flex items-start">
          {/* SIDEBAR */}
          <FleetSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openIncidentsCount={stats.openIncidentsCount}
            pendingRequestsCount={requests.filter((r) => r.status === 'pending_review').length}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {activeTab === 'overview' && (
              <FleetOverviewTab
                stats={stats}
                tenants={tenants}
                recentLogs={logs}
                onInspectTenant={(t) => setSelectedTenantForModal(t)}
                onOpenRemediation={handleOpenRemediation}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantDirectoryTab
                tenants={tenants}
                onInspectTenant={(t) => setSelectedTenantForModal(t)}
                onOpenRemediation={handleOpenRemediation}
                onLaunchShadowMode={handleLaunchShadowMode}
              />
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Terminal size={17} />
                        <span>Pusat Log Error Realtime Seluruh Armada Klien</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Menangkap unhandled exception, error hardware printer, dan bottleneck storage dari seluruh toko
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {logs.length} Log Masuk
                    </span>
                  </div>

                  <div className="space-y-3">
                    {logs.map((l) => (
                      <div
                        key={l.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                          l.resolved
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : l.level === 'fatal'
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : l.level === 'error'
                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${
                                l.level === 'fatal'
                                  ? 'bg-rose-600 text-white'
                                  : l.level === 'error'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {l.level}
                            </span>
                            <span className="font-bold text-xs">{l.sourceModule}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              · Tenant: {l.tenantId} {l.outletName ? `(${l.outletName})` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(l.timestamp).toLocaleString('id-ID')}
                            </span>
                            {!l.resolved && (
                              <button
                                type="button"
                                onClick={() => handleResolveLog(l.id)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-black font-bold text-[11px] transition-colors cursor-pointer text-slate-800"
                              >
                                Selesaikan
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-mono text-xs font-semibold leading-relaxed">
                          {l.message}
                        </p>

                        {l.stackTrace && (
                          <details className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto cursor-pointer">
                            <summary className="text-slate-400 font-bold hover:text-white">
                              Lihat Stack Trace &gt;
                            </summary>
                            <pre className="mt-2 text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                              {l.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'remediation' && (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Wrench size={20} className="text-emerald-400" />
                    <div>
                      <h2 className="font-black text-sm text-white">
                        Pusat Remediasi Jarak Jauh (Remote Fleet Remediation)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kirim perintah perbaikan darurat ke seluruh toko atau toko terpilih tanpa perlu datang ke lokasi fisik
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                      <div className="font-bold text-xs text-white">
                        Mass Cache Purge
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Kirim perintah purge cache browser ke seluruh tablet kasir yang aktif.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          tenants.forEach((t) =>
                            handleQueueCommand(t.id, 'FORCE_CACHE_PURGE')
                          )
                          setActionNotice('Perintah mass cache purge disiarkan ke seluruh armada toko.')
                          setTimeout(() => setActionNotice(null), 4000)
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Broadcast Purge All
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                      <div className="font-bold text-xs text-white">
                        Release Stuck Bills
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Lepaskan meja dan antrean checkout yang terkunci pada toko berstatus kritis.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const crit = tenants.filter((t) => t.healthStatus === 'critical')
                          crit.forEach((t) =>
                            handleQueueCommand(t.id, 'CLEAR_STUCK_BILLS')
                          )
                          setActionNotice(`Perintah pelepasan tagihan dikirim ke ${crit.length} toko kritis.`)
                          setTimeout(() => setActionNotice(null), 4000)
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Fix All Critical Stores
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                      <div className="font-bold text-xs text-white">
                        Emergency Mode
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Buka diagnostik mendalam pada toko tertentu untuk mengaktifkan pemeliharaan.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tenants')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Pilih Toko di Direktori &gt;
                      </button>
                    </div>
                  </div>
                </div>

                {/* COMMAND AUDIT QUEUE */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Antrean Perintah Remote Terkini
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {commands.length} Perintah
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {commands.length > 0 ? (
                      commands.map((cmd) => (
                        <div key={cmd.id} className="py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="font-mono text-xs">{cmd.commandType}</span>
                              <span className="text-slate-400 font-normal">
                                -&gt; Toko {cmd.tenantId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ID: {cmd.id} · Diterbitkan: {new Date(cmd.issuedAt).toLocaleTimeString('id-ID')}
                            </div>
                          </div>

                          <div>
                            {cmd.status === 'pending' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                MENUNGGU INSTANCE
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                BERHASIL DIEKSEKUSI
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400">
                        Belum ada riwayat perintah remote yang dikirim.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'provisioning' && (
              <ProvisioningTab
                requests={requests}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onCreateTenant={handleCreateTenant}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogTab logs={auditLogs} />
            )}
          </main>
        </div>

        {/* DEEP INSPECTOR MODAL */}
        {selectedTenantForModal && (
          <TenantDeepInspectorModal
            tenant={selectedTenantForModal}
            logs={logs}
            onClose={() => setSelectedTenantForModal(null)}
            onUpdateTenant={handleUpdateTenant}
            onQueueCommand={handleQueueCommand}
            onResolveLog={handleResolveLog}
            onLaunchShadowMode={handleLaunchShadowMode}
          />
        )}
      </div>
    </AuthGate>
  )
}
