'use client'

import React, { useState, useEffect, useMemo } from 'react'
import AuthGate from '../components/AuthGate'
import FleetHeader from '../components/FleetHeader'
import FleetSidebar, { ActiveOpsTab } from '../components/FleetSidebar'
import Client360Workbench from '../components/Client360Workbench'
import BillingTab from '../components/BillingTab'
import IncidentRadarTab from '../components/IncidentRadarTab'
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
  getTenantInvoices,
  createTenantInvoice,
  markInvoiceAsPaid,
  calculateSaaSFinanceOverview,
  extendTenantSubscription,
  getDatabaseBackupJobs,
  triggerTenantBackup,
  getAppRolloutStatuses,
  triggerAppRollout,
  resetStaffPin,
  toggleStaffStatus,
  voidStoreOrder,
  syncStoreInventory,
  testPrintPrinter,
  restartPrinterConnection,
} from '../lib/fleet/telemetryStore'

import {
  INITIAL_TENANTS,
  INITIAL_REMOTE_LOGS,
  INITIAL_STAFF_AUDIT_LOGS,
  INITIAL_PROVISIONING_REQUESTS,
  INITIAL_INVOICES,
  INITIAL_BACKUPS,
  INITIAL_ROLLOUTS,
} from '../lib/fleet/mockRealTenants'

import type {
  TenantStore,
  RemoteLogEntry,
  RemoteRepairCommand,
  ProvisioningRequest,
  StaffAuditLog,
  TenantInvoice,
  DatabaseBackupJob,
  ClientAppRolloutStatus,
  PaymentMethod,
} from '../types/fleet'

import { CheckCircle2 } from 'lucide-react'

export default function FleetOpsApp() {
  const [activeTab, setActiveTab] = useState<ActiveOpsTab>('fleet')
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    INITIAL_TENANTS[0]?.id || ''
  )
  const [searchQuery, setSearchQuery] = useState<string>('')

  // STORE STATE (Initialized with initial data for immediate SSR hydration)
  const [tenants, setTenants] = useState<TenantStore[]>(INITIAL_TENANTS)
  const [logs, setLogs] = useState<RemoteLogEntry[]>(INITIAL_REMOTE_LOGS)
  const [commands, setCommands] = useState<RemoteRepairCommand[]>([])
  const [requests, setRequests] = useState<ProvisioningRequest[]>(
    INITIAL_PROVISIONING_REQUESTS
  )
  const [auditLogs, setAuditLogs] = useState<StaffAuditLog[]>(
    INITIAL_STAFF_AUDIT_LOGS
  )
  const [invoices, setInvoices] = useState<TenantInvoice[]>(INITIAL_INVOICES)
  const [backups, setBackups] = useState<DatabaseBackupJob[]>(INITIAL_BACKUPS)
  const [rollouts, setRollouts] = useState<ClientAppRolloutStatus[]>(
    INITIAL_ROLLOUTS
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  function loadAllData() {
    setIsRefreshing(true)
    const t = getFleetTenants()
    const l = getRemoteLogs()
    const c = getRemoteCommands()
    const r = getProvisioningRequests()
    const a = getStaffAuditLogs()
    const inv = getTenantInvoices()
    const b = getDatabaseBackupJobs()
    const rol = getAppRolloutStatuses()

    setTenants(t)
    setLogs(l)
    setCommands(c)
    setRequests(r)
    setAuditLogs(a)
    setInvoices(inv)
    setBackups(b)
    setRollouts(rol)

    setTimeout(() => {
      setIsRefreshing(false)
    }, 400)
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const stats = useMemo(() => calculateFleetStats(tenants), [tenants])
  const financeOverview = useMemo(
    () => calculateSaaSFinanceOverview(tenants, invoices),
    [tenants, invoices]
  )

  function handleUpdateTenant(updated: TenantStore) {
    updateTenant(updated)
    setTenants(getFleetTenants())
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
      billingCycle: newTenant.billingCycle || 'monthly',
      monthlyFee: newTenant.monthlyFee || 799000,
      lifetimePaid: newTenant.lifetimePaid || 0,
      autoRenew: newTenant.autoRenew ?? true,
      subscriptionValidUntil:
        newTenant.subscriptionValidUntil ||
        Date.now() + 1000 * 60 * 60 * 24 * 365,
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
    setSelectedTenantId(full.id)
    setActiveTab('fleet')
  }

  function handleLaunchShadowMode(tenant: TenantStore) {
    const shadowUrl = `${tenant.liveStoreUrl}${
      tenant.liveStoreUrl.includes('?') ? '&' : '?'
    }shadow_mode=true&tenant_id=${tenant.id}&staff=ops_hallo`
    if (typeof window !== 'undefined') {
      window.open(shadowUrl, '_blank')
    }
  }

  function handleExtendSubscription(tenantId: string, days: number) {
    extendTenantSubscription(tenantId, days)
    const tList = getFleetTenants()
    setTenants(tList)
    setActionNotice(`Masa aktif langganan toko diperpanjang +${days} hari.`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleMarkInvoicePaid(invoiceId: string, method?: PaymentMethod) {
    markInvoiceAsPaid(invoiceId, method || 'qris')
    setInvoices(getTenantInvoices())
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Faktur berhasil diselesaikan & lisensi otomatis diperbarui!')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleCreateInvoice(data: any) {
    createTenantInvoice(data)
    setInvoices(getTenantInvoices())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Faktur tagihan baru berhasil diterbitkan untuk klien!')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleTriggerBackup(tenantId: string) {
    triggerTenantBackup(tenantId)
    setBackups(getDatabaseBackupJobs())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Snapshot database toko berhasil dibuat.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleBroadcastRollout(
    version: string,
    channel: 'production' | 'canary'
  ) {
    triggerAppRollout(version, channel)
    setRollouts(getAppRolloutStatuses())
    setAuditLogs(getStaffAuditLogs())
    setCommands(getRemoteCommands())
  }

  function handleResetStaffPin(
    tenantId: string,
    staffId: string,
    newPin: string = '1234'
  ) {
    resetStaffPin(tenantId, staffId, newPin)
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice(`PIN staf kasir berhasil di-reset ke ${newPin}.`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleToggleStaffStatus(tenantId: string, staffId: string) {
    toggleStaffStatus(tenantId, staffId)
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
  }

  function handleVoidOrder(tenantId: string, orderId: string, reason: string) {
    voidStoreOrder(tenantId, orderId, reason)
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Pesanan macet berhasil di-void.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleSyncInventory(tenantId: string) {
    syncStoreInventory(tenantId)
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Stok bahan baku dan kalkulasi HPP berhasil disinkronkan!')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleTestPrint(tenantId: string, printerId: string) {
    testPrintPrinter(tenantId, printerId)
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Perintah test print berhasil dikirim ke printer kasir.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  function handleRestartPrinter(tenantId: string, printerId: string) {
    restartPrinterConnection(tenantId, printerId)
    setTenants(getFleetTenants())
    setAuditLogs(getStaffAuditLogs())
    setActionNotice('Driver koneksi printer kasir berhasil di-restart.')
    setTimeout(() => setActionNotice(null), 4000)
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-zinc-900 w-full overflow-x-hidden">
        {/* HEADER */}
        <FleetHeader
          stats={stats}
          pendingInvoicesCount={
            invoices.filter((i) => i.status === 'pending' || i.status === 'overdue')
              .length
          }
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q)
            // If user searches, switch to fleet view if not already there
            if (q.trim() && activeTab !== 'fleet') {
              setActiveTab('fleet')
            }
          }}
          onOpenProvisionModal={() => setActiveTab('provisioning')}
          onRefreshData={loadAllData}
          isRefreshing={isRefreshing}
        />

        {/* NOTICE TOAST */}
        {actionNotice && (
          <div className="fixed bottom-5 right-5 z-50 py-2 px-3 rounded-md bg-zinc-900 text-white font-medium text-xs shadow-lg flex items-center gap-2 font-mono">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* WORKSPACE LAYOUT */}
        <div className="flex-1 flex items-start w-full min-w-0">
          {/* SIDEBAR */}
          <FleetSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openIncidentsCount={stats.openIncidentsCount}
            pendingRequestsCount={
              requests.filter((r) => r.status === 'pending_review').length
            }
            pendingInvoicesCount={
              invoices.filter((i) => i.status === 'pending' || i.status === 'overdue')
                .length
            }
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-5 w-full space-y-4">
            {/* PILAR 1: CLIENT 360° WORKBENCH */}
            {activeTab === 'fleet' && (
              <Client360Workbench
                tenants={tenants}
                logs={logs}
                invoices={invoices}
                selectedTenantId={selectedTenantId}
                onSelectTenant={(id) => setSelectedTenantId(id)}
                onUpdateTenant={handleUpdateTenant}
                onQueueCommand={handleQueueCommand}
                onResolveLog={handleResolveLog}
                onLaunchShadowMode={handleLaunchShadowMode}
                onResetStaffPin={handleResetStaffPin}
                onToggleStaffStatus={handleToggleStaffStatus}
                onVoidOrder={handleVoidOrder}
                onSyncInventory={handleSyncInventory}
                onTestPrint={handleTestPrint}
                onRestartPrinter={handleRestartPrinter}
                onExtendSubscription={handleExtendSubscription}
                onMarkInvoicePaid={handleMarkInvoicePaid}
                onTriggerBackup={handleTriggerBackup}
              />
            )}

            {/* PILAR 2: SAAS FINANCE & BILLING HUB */}
            {activeTab === 'billing' && (
              <BillingTab
                tenants={tenants}
                invoices={invoices}
                finance={financeOverview}
                onExtendSubscription={handleExtendSubscription}
                onMarkInvoicePaid={handleMarkInvoicePaid}
                onCreateInvoice={handleCreateInvoice}
              />
            )}

            {/* PILAR 3: INCIDENT RADAR & DEPLOYMENTS */}
            {activeTab === 'radar' && (
              <IncidentRadarTab
                tenants={tenants}
                logs={logs}
                backups={backups}
                rollouts={rollouts}
                onBroadcastRollout={handleBroadcastRollout}
                onTriggerBackup={handleTriggerBackup}
                onResolveLog={handleResolveLog}
                onQueueCommand={handleQueueCommand}
              />
            )}

            {/* PILAR 4: ONBOARDING TOKO BARU */}
            {activeTab === 'provisioning' && (
              <ProvisioningTab
                requests={requests}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onCreateTenant={handleCreateTenant}
              />
            )}

            {/* PILAR 5: AUDIT TRAIL STAF */}
            {activeTab === 'audit' && <AuditLogTab logs={auditLogs} />}
          </main>
        </div>
      </div>
    </AuthGate>
  )
}
