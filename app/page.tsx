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
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-zinc-900">
        {/* HEADER */}
        <FleetHeader
          stats={stats}
          onOpenProvisionModal={() => setActiveTab('provisioning')}
          onRefreshData={loadAllData}
          isRefreshing={isRefreshing}
        />

        {/* NOTICE TOAST */}
        {actionNotice && (
          <div className="fixed bottom-5 right-5 z-50 py-2 px-3 rounded-md bg-zinc-900 text-white font-medium text-xs shadow-lg flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
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
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
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
              <div className="space-y-3">
                <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                    <div>
                      <h2 className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                        <Terminal size={14} />
                        <span>Pusat Log Error Realtime Seluruh Armada Klien</span>
                      </h2>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Menangkap unhandled exception, error hardware printer, dan storage queue dari seluruh toko
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {logs.length} ENTRI MASUK
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100 p-3 space-y-2">
                    {logs.map((l) => (
                      <div
                        key={l.id}
                        className={`p-3 rounded border text-xs space-y-1.5 ${
                          l.resolved
                            ? 'bg-zinc-50 border-zinc-200 opacity-60'
                            : l.level === 'fatal'
                            ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                            : l.level === 'error'
                            ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                            : 'bg-white border-zinc-200 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                            <span className="font-semibold text-xs">{l.sourceModule}</span>
                            <span className="text-[11px] font-mono text-zinc-500">
                              · Tenant: {l.tenantId} {l.outletName ? `(${l.outletName})` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {new Date(l.timestamp).toLocaleString('id-ID')}
                            </span>
                            {!l.resolved && (
                              <button
                                type="button"
                                onClick={() => handleResolveLog(l.id)}
                                className="px-2 py-0.5 rounded bg-white border border-zinc-200 hover:border-zinc-400 font-medium text-[10px] transition-colors cursor-pointer text-zinc-800"
                              >
                                Selesaikan
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-mono text-xs leading-relaxed">
                          {l.message}
                        </p>

                        {l.stackTrace && (
                          <details className="text-[11px] font-mono bg-zinc-900 text-zinc-100 p-2.5 rounded overflow-x-auto cursor-pointer">
                            <summary className="text-zinc-400 hover:text-white font-medium">
                              Lihat Stack Trace
                            </summary>
                            <pre className="mt-1 text-[10px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
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
              <div className="space-y-4">
                <div className="bg-zinc-900 text-zinc-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className="text-emerald-400" />
                      <div>
                        <h2 className="font-semibold text-xs text-white">
                          Pusat Remediasi Jarak Jauh (Remote Fleet Actions)
                        </h2>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Kirim instruksi perbaikan darurat ke seluruh toko atau toko terpilih tanpa perlu datang ke lokasi fisik
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      FLEET-WIDE BROADCAST
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded bg-zinc-800 border border-zinc-700 space-y-2">
                      <div className="font-semibold text-xs text-white">
                        Mass Cache Purge
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">
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
                        className="w-full py-1.5 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Broadcast Purge All
                      </button>
                    </div>

                    <div className="p-3 rounded bg-zinc-800 border border-zinc-700 space-y-2">
                      <div className="font-semibold text-xs text-white">
                        Release Stuck Bills
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">
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
                        className="w-full py-1.5 px-2.5 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Fix All Critical Stores
                      </button>
                    </div>

                    <div className="p-3 rounded bg-zinc-800 border border-zinc-700 space-y-2">
                      <div className="font-semibold text-xs text-white">
                        Emergency Maintenance
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">
                        Buka diagnostik mendalam pada toko tertentu untuk mengaktifkan pemeliharaan.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tenants')}
                        className="w-full py-1.5 px-2.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Pilih Toko di Direktori &rarr;
                      </button>
                    </div>
                  </div>
                </div>

                {/* COMMAND AUDIT QUEUE */}
                <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                    <h3 className="font-semibold text-xs text-zinc-900">
                      Antrean Perintah Remote Terkini
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {commands.length} PERINTAH
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100 text-xs">
                    {commands.length > 0 ? (
                      commands.map((cmd) => (
                        <div key={cmd.id} className="p-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                              <span className="font-mono text-xs">{cmd.commandType}</span>
                              <span className="text-zinc-400 font-normal">
                                &rarr; Toko {cmd.tenantId}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              ID: {cmd.id} · Diterbitkan: {new Date(cmd.issuedAt).toLocaleTimeString('id-ID')}
                            </div>
                          </div>

                          <div>
                            {cmd.status === 'pending' ? (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                PENDING INSTANCE
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                EXECUTED SUCCESS
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-zinc-400">
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
