import type {
  TenantStore,
  RemoteLogEntry,
  RemoteRepairCommand,
  ProvisioningRequest,
  StaffAuditLog,
  FleetStats,
  TenantInvoice,
  DatabaseBackupJob,
  ClientAppRolloutStatus,
  SaaSFinanceOverview,
  PaymentMethod,
} from '../../types/fleet'

import {
  INITIAL_TENANTS,
  INITIAL_REMOTE_LOGS,
  INITIAL_STAFF_AUDIT_LOGS,
  INITIAL_PROVISIONING_REQUESTS,
  INITIAL_INVOICES,
  INITIAL_BACKUPS,
  INITIAL_ROLLOUTS,
} from './mockRealTenants'

const STORAGE_KEYS = {
  TENANTS: 'fnb_ops_tenants_v1',
  LOGS: 'fnb_ops_logs_v1',
  COMMANDS: 'fnb_ops_commands_v1',
  REQUESTS: 'fnb_ops_requests_v1',
  AUDIT: 'fnb_ops_audit_v1',
  INVOICES: 'fnb_ops_invoices_v1',
  BACKUPS: 'fnb_ops_backups_v1',
  ROLLOUTS: 'fnb_ops_rollouts_v1',
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`[FleetStore] Failed to save key ${key}:`, err)
  }
}

// TENANTS
export function getFleetTenants(): TenantStore[] {
  return loadFromStorage<TenantStore[]>(STORAGE_KEYS.TENANTS, INITIAL_TENANTS)
}

export function saveFleetTenants(tenants: TenantStore[]): void {
  saveToStorage(STORAGE_KEYS.TENANTS, tenants)
}

export function getTenantById(id: string): TenantStore | undefined {
  const tenants = getFleetTenants()
  return tenants.find((t) => t.id === id || t.slug === id)
}

export function updateTenant(updated: TenantStore): void {
  const tenants = getFleetTenants()
  const idx = tenants.findIndex((t) => t.id === updated.id)
  if (idx >= 0) {
    tenants[idx] = { ...updated, updatedAt: Date.now() }
  } else {
    tenants.push({ ...updated, updatedAt: Date.now() })
  }
  saveFleetTenants(tenants)
}

// EXTEND SUBSCRIPTION DURATION
export function extendTenantSubscription(tenantId: string, additionalDays: number): TenantStore | null {
  const tenant = getTenantById(tenantId)
  if (!tenant) return null

  const currentValid = tenant.subscriptionValidUntil > Date.now()
    ? tenant.subscriptionValidUntil
    : Date.now()
  const newValidUntil = currentValid + 1000 * 60 * 60 * 24 * additionalDays

  const updated: TenantStore = {
    ...tenant,
    subscriptionValidUntil: newValidUntil,
    billingStatus: 'active',
    updatedAt: Date.now(),
  }

  updateTenant(updated)

  addStaffAuditLog({
    staffEmail: 'ops@hallogroup.id',
    staffName: 'Billing & Ops Team',
    action: 'SUBSCRIPTION_EXTENDED',
    targetTenantId: tenant.id,
    targetTenantName: tenant.name,
    details: `Masa aktif lisensi ${tenant.name} diperpanjang +${additionalDays} hari hingga ${new Date(newValidUntil).toLocaleDateString('id-ID')}.`,
  })

  return updated
}

// SAAS INVOICES & FINANCE
export function getTenantInvoices(tenantId?: string): TenantInvoice[] {
  const invoices = loadFromStorage<TenantInvoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES)
  if (tenantId) {
    return invoices.filter((inv) => inv.tenantId === tenantId)
  }
  return invoices
}

export function saveTenantInvoices(invoices: TenantInvoice[]): void {
  saveToStorage(STORAGE_KEYS.INVOICES, invoices)
}

export function createTenantInvoice(
  inv: Omit<TenantInvoice, 'id' | 'issuedAt' | 'invoiceNumber'> & { customInvoiceNumber?: string }
): TenantInvoice {
  const invoices = getTenantInvoices()
  const seq = (invoices.length + 1).toString().padStart(3, '0')
  const newInvoice: TenantInvoice = {
    ...inv,
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    invoiceNumber: inv.customInvoiceNumber || `INV/2026/10/${seq}`,
    issuedAt: Date.now(),
  }

  const updated = [newInvoice, ...invoices]
  saveTenantInvoices(updated)

  addStaffAuditLog({
    staffEmail: 'billing@hallogroup.id',
    staffName: 'SaaS Billing Automated',
    action: 'INVOICE_CREATED',
    targetTenantId: inv.tenantId,
    targetTenantName: inv.tenantName,
    details: `Menerbitkan tagihan paket ${inv.planTier.toUpperCase()} senilai Rp ${inv.amount.toLocaleString('id-ID')} (${newInvoice.invoiceNumber}).`,
  })

  return newInvoice
}

export function markInvoiceAsPaid(invoiceId: string, paymentMethod: PaymentMethod = 'qris'): void {
  const invoices = getTenantInvoices()
  const target = invoices.find((inv) => inv.id === invoiceId)
  if (!target) return

  const updated = invoices.map((inv) =>
    inv.id === invoiceId
      ? {
          ...inv,
          status: 'paid' as const,
          paidAt: Date.now(),
          paymentMethod,
        }
      : inv
  )
  saveTenantInvoices(updated)

  // Auto-extend tenant validity +30 days or +365 days
  const days = target.billingCycle === 'annually' ? 365 : 30
  extendTenantSubscription(target.tenantId, days)

  // Update lifetime paid of tenant
  const tenant = getTenantById(target.tenantId)
  if (tenant) {
    updateTenant({
      ...tenant,
      lifetimePaid: (tenant.lifetimePaid || 0) + target.amount,
      billingStatus: 'active',
    })
  }

  addStaffAuditLog({
    staffEmail: 'finance@hallogroup.id',
    staffName: 'Finance Settlement Hub',
    action: 'INVOICE_SETTLED',
    targetTenantId: target.tenantId,
    targetTenantName: target.tenantName,
    details: `Faktur ${target.invoiceNumber} senilai Rp ${target.amount.toLocaleString('id-ID')} ditandai LUNAS via ${paymentMethod.toUpperCase()}.`,
  })
}

export function calculateSaaSFinanceOverview(
  tenants?: TenantStore[],
  invoices?: TenantInvoice[]
): SaaSFinanceOverview {
  const tList = tenants || getFleetTenants()
  const invList = invoices || getTenantInvoices()

  // Calculate MRR: sum of monthlyFee across active tenants
  const mrr = tList.reduce((sum, t) => {
    if (t.billingStatus === 'suspended') return sum
    return sum + (t.monthlyFee || (t.subscriptionTier === 'enterprise' ? 1999000 : t.subscriptionTier === 'pro' ? 799000 : 299000))
  }, 0)

  const arr = mrr * 12

  const paidInvoices = invList.filter((i) => i.status === 'paid')
  const totalCollectedThisMonth = paidInvoices.reduce((sum, i) => sum + i.amount, 0)

  const pendingInvoices = invList.filter((i) => i.status === 'pending')
  const pendingReceivables = pendingInvoices.reduce((sum, i) => sum + i.amount, 0)

  const overdueInvoices = invList.filter((i) => i.status === 'overdue')
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amount, 0)

  const activeSubscriptionsCount = tList.filter((t) => t.billingStatus === 'active' || t.billingStatus === 'trial').length
  const arpu = activeSubscriptionsCount > 0 ? Math.round(mrr / activeSubscriptionsCount) : 0

  const now = Date.now()
  const expiringIn30DaysCount = tList.filter(
    (t) => t.subscriptionValidUntil > now && t.subscriptionValidUntil <= now + 1000 * 60 * 60 * 24 * 30
  ).length

  return {
    mrr,
    arr,
    totalCollectedThisMonth,
    pendingReceivables,
    overdueAmount,
    arpu,
    activeSubscriptionsCount,
    expiringIn30DaysCount,
    churnRatePct: 0.0,
  }
}

// MULTI-TENANT DATABASE BACKUPS
export function getDatabaseBackupJobs(): DatabaseBackupJob[] {
  return loadFromStorage<DatabaseBackupJob[]>(STORAGE_KEYS.BACKUPS, INITIAL_BACKUPS)
}

export function triggerTenantBackup(tenantId: string): DatabaseBackupJob {
  const backups = getDatabaseBackupJobs()
  const tenant = getTenantById(tenantId)
  const tenantName = tenant?.name || tenantId

  const newBackup: DatabaseBackupJob = {
    id: `bkp-${tenantId.slice(0, 8)}-${Date.now().toString(36)}`,
    tenantId,
    tenantName,
    snapshotSizeMb: Math.round((Math.random() * 20 + 15) * 10) / 10,
    totalRecordsCount: Math.floor(Math.random() * 8000 + 4000),
    status: 'completed',
    createdAt: Date.now(),
    checksum: `sha256:${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
    retentionDays: tenant?.subscriptionTier === 'enterprise' ? 90 : 30,
  }

  saveToStorage(STORAGE_KEYS.BACKUPS, [newBackup, ...backups])

  addStaffAuditLog({
    staffEmail: 'dba@hallogroup.id',
    staffName: 'Database Ops Daemon',
    action: 'BACKUP_CREATED',
    targetTenantId: tenantId,
    targetTenantName: tenantName,
    details: `Snapshot database mandiri berhasil dibuat (${newBackup.snapshotSizeMb} MB, ${newBackup.totalRecordsCount} baris data).`,
  })

  return newBackup
}

// CLIENT APP ROLLOUT & OTA
export function getAppRolloutStatuses(): ClientAppRolloutStatus[] {
  return loadFromStorage<ClientAppRolloutStatus[]>(STORAGE_KEYS.ROLLOUTS, INITIAL_ROLLOUTS)
}

export function triggerAppRollout(version: string, channel: 'production' | 'canary' = 'production'): void {
  const rollouts = getAppRolloutStatuses()
  const updated = rollouts.map((r) =>
    r.version === version
      ? { ...r, isLatest: true, releaseChannel: channel }
      : { ...r, isLatest: false }
  )
  saveToStorage(STORAGE_KEYS.ROLLOUTS, updated)

  // Broadcast OTA reload command to all tenants
  const tenants = getFleetTenants()
  tenants.forEach((t) => {
    queueRemoteCommand({
      tenantId: t.id,
      commandType: 'FORCE_OTA_RELOAD',
      payload: { targetVersion: version, channel },
      issuedBy: 'devops@hallogroup.id',
    })
  })

  addStaffAuditLog({
    staffEmail: 'release@hallogroup.id',
    staffName: 'Release Manager',
    action: 'CANARY_ROLLOUT_BROADCAST',
    targetTenantId: 'fleet_all',
    targetTenantName: 'Seluruh Armada Klien',
    details: `Memperbarui versi rilis resmi ke ${version} (${channel}) dan mengirim sinyal reload ke seluruh tablet kasir.`,
  })
}

// REMOTE LOGS
export function getRemoteLogs(): RemoteLogEntry[] {
  return loadFromStorage<RemoteLogEntry[]>(STORAGE_KEYS.LOGS, INITIAL_REMOTE_LOGS)
}

export function addRemoteLog(entry: Omit<RemoteLogEntry, 'id' | 'timestamp' | 'resolved'>): RemoteLogEntry {
  const logs = getRemoteLogs()
  const newEntry: RemoteLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    resolved: false,
  }
  const updated = [newEntry, ...logs]
  saveToStorage(STORAGE_KEYS.LOGS, updated)
  return newEntry
}

export function resolveRemoteLog(logId: string): void {
  const logs = getRemoteLogs()
  const updated = logs.map((l) => (l.id === logId ? { ...l, resolved: true } : l))
  saveToStorage(STORAGE_KEYS.LOGS, updated)
}

// REMOTE COMMANDS (QUEUE)
export function getRemoteCommands(tenantId?: string): RemoteRepairCommand[] {
  const commands = loadFromStorage<RemoteRepairCommand[]>(STORAGE_KEYS.COMMANDS, [])
  if (tenantId) {
    return commands.filter((c) => c.tenantId === tenantId)
  }
  return commands
}

export function queueRemoteCommand(
  cmd: Omit<RemoteRepairCommand, 'id' | 'issuedAt' | 'status'>
): RemoteRepairCommand {
  const commands = getRemoteCommands()
  const newCmd: RemoteRepairCommand = {
    ...cmd,
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    issuedAt: Date.now(),
    status: 'pending',
  }
  const updated = [newCmd, ...commands]
  saveToStorage(STORAGE_KEYS.COMMANDS, updated)

  addStaffAuditLog({
    staffEmail: cmd.issuedBy || 'ops@hallogroup.id',
    staffName: 'Tim Support Hallo Group',
    action: `REMOTE_COMMAND_${cmd.commandType}`,
    targetTenantId: cmd.tenantId,
    targetTenantName: getTenantById(cmd.tenantId)?.name || cmd.tenantId,
    details: `Perintah remote ${cmd.commandType} dikirim ke antrean toko klien.`,
  })

  return newCmd
}

export function markCommandExecuted(cmdId: string, resultMessage?: string): void {
  const commands = getRemoteCommands()
  const updated = commands.map((c) =>
    c.id === cmdId
      ? {
          ...c,
          status: 'executed' as const,
          executedAt: Date.now(),
          resultMessage: resultMessage || 'Berhasil dieksekusi oleh instance klien.',
        }
      : c
  )
  saveToStorage(STORAGE_KEYS.COMMANDS, updated)
}

// PROVISIONING REQUESTS
export function getProvisioningRequests(): ProvisioningRequest[] {
  return loadFromStorage<ProvisioningRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_PROVISIONING_REQUESTS)
}

export function addProvisioningRequest(
  req: Omit<ProvisioningRequest, 'id' | 'status' | 'submittedAt'>
): ProvisioningRequest {
  const requests = getProvisioningRequests()
  const newReq: ProvisioningRequest = {
    ...req,
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'pending_review',
    submittedAt: Date.now(),
  }
  const updated = [newReq, ...requests]
  saveToStorage(STORAGE_KEYS.REQUESTS, updated)
  return newReq
}

export function approveProvisioningRequest(reqId: string): TenantStore | null {
  const requests = getProvisioningRequests()
  const target = requests.find((r) => r.id === reqId)
  if (!target) return null

  const newTenantId = `org-${target.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`
  const fee = target.requestedTier === 'enterprise' ? 1999000 : target.requestedTier === 'pro' ? 799000 : 299000

  const newTenant: TenantStore = {
    id: newTenantId,
    slug: target.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: target.storeName,
    legalName: target.legalName || target.storeName,
    ownerName: target.ownerName,
    ownerPhone: target.ownerPhone,
    ownerEmail: target.ownerEmail,
    subscriptionTier: target.requestedTier,
    billingStatus: 'trial',
    billingCycle: target.billingCycle || 'monthly',
    monthlyFee: fee,
    lifetimePaid: 0,
    autoRenew: true,
    subscriptionValidUntil: Date.now() + 1000 * 60 * 60 * 24 * 14,
    maxOutlets: target.requestedOutlets || 1,
    maxTerminals: (target.requestedOutlets || 1) * 2,
    healthStatus: 'healthy',
    liveStoreUrl: `https://fnb-erp.vercel.app?tenant=${newTenantId}`,
    activeOutlets: [
      {
        id: `out-${newTenantId}-main`,
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
      kitchen_routing_kds: target.requestedTier !== 'starter',
      inventory_basic: true,
      inventory_recipes_hpp: target.requestedTier !== 'starter',
      multi_warehouse_transfer: target.requestedTier === 'enterprise',
      batch_production_roasting: target.requestedTier === 'enterprise',
      b2b_wholesale_invoicing: target.requestedTier === 'enterprise',
      accurate_grade_accounting: true,
      fixed_assets: target.requestedTier === 'enterprise',
      bank_reconciliation: target.requestedTier === 'enterprise',
      live_excel_export: true,
      official_pdf_export: true,
    },
    emergencyMaintenance: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const updatedRequests = requests.map((r) =>
    r.id === reqId ? { ...r, status: 'approved' as const } : r
  )
  saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests)

  const tenants = getFleetTenants()
  saveFleetTenants([newTenant, ...tenants])

  addStaffAuditLog({
    staffEmail: 'ops@hallogroup.id',
    staffName: 'Tim Support Hallo Group',
    action: 'SELF_REGISTRATION_APPROVED',
    targetTenantId: newTenant.id,
    targetTenantName: newTenant.name,
    details: `Menyetujui pendaftaran dan mengaktifkan instance toko ${newTenant.name} (${target.requestedTier.toUpperCase()}).`,
  })

  return newTenant
}

export function rejectProvisioningRequest(reqId: string, reason?: string): void {
  const requests = getProvisioningRequests()
  const updatedRequests = requests.map((r) =>
    r.id === reqId ? { ...r, status: 'rejected' as const, notes: reason || r.notes } : r
  )
  saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests)
}

// STAFF AUDIT LOGS
export function getStaffAuditLogs(): StaffAuditLog[] {
  return loadFromStorage<StaffAuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_STAFF_AUDIT_LOGS)
}

export function addStaffAuditLog(entry: Omit<StaffAuditLog, 'id' | 'timestamp'>): void {
  const logs = getStaffAuditLogs()
  const newEntry: StaffAuditLog = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  }
  saveToStorage(STORAGE_KEYS.AUDIT, [newEntry, ...logs])
}

// FLEET STATISTICS
export function calculateFleetStats(tenants?: TenantStore[]): FleetStats {
  const list = tenants || getFleetTenants()
  const totalTenants = list.length
  const activeTenants = list.filter((t) => t.billingStatus === 'active' || t.billingStatus === 'trial').length
  const totalOutlets = list.reduce((acc, t) => acc + (t.activeOutlets?.length || 0), 0)

  const healthyCount = list.filter((t) => t.healthStatus === 'healthy').length
  const warningCount = list.filter((t) => t.healthStatus === 'warning').length
  const criticalCount = list.filter((t) => t.healthStatus === 'critical').length
  const offlineCount = list.filter((t) => t.healthStatus === 'offline').length

  const totalGmvToday = list.reduce(
    (acc, t) => acc + (t.activeOutlets?.reduce((sum, o) => sum + (o.todayGmv || 0), 0) || 0),
    0
  )

  const logs = getRemoteLogs()
  const openIncidentsCount = logs.filter((l) => !l.resolved && (l.level === 'fatal' || l.level === 'error')).length

  const uptimeRatio = totalTenants > 0 ? (totalTenants - (criticalCount + offlineCount * 0.5)) / totalTenants : 1
  const slaUptimePct = Math.round(Math.max(90, Math.min(99.98, uptimeRatio * 100)) * 100) / 100

  return {
    totalTenants,
    activeTenants,
    totalOutlets,
    healthyCount,
    warningCount,
    criticalCount,
    offlineCount,
    totalGmvToday,
    slaUptimePct,
    openIncidentsCount,
  }
}
