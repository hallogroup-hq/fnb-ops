import type {
  TenantStore,
  RemoteLogEntry,
  RemoteRepairCommand,
  ProvisioningRequest,
  StaffAuditLog,
  FleetStats,
} from '../../types/fleet'

import {
  INITIAL_TENANTS,
  INITIAL_REMOTE_LOGS,
  INITIAL_STAFF_AUDIT_LOGS,
  INITIAL_PROVISIONING_REQUESTS,
} from './mockRealTenants'

const STORAGE_KEYS = {
  TENANTS: 'fnb_ops_tenants_v1',
  LOGS: 'fnb_ops_logs_v1',
  COMMANDS: 'fnb_ops_commands_v1',
  REQUESTS: 'fnb_ops_requests_v1',
  AUDIT: 'fnb_ops_audit_v1',
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

  // Record to staff audit log
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

  // Create new TenantStore
  const newTenantId = `org-${target.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`
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
    subscriptionValidUntil: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14-day trial
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

  // Update request status
  const updatedRequests = requests.map((r) =>
    r.id === reqId ? { ...r, status: 'approved' as const } : r
  )
  saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests)

  // Add tenant
  const tenants = getFleetTenants()
  saveFleetTenants([newTenant, ...tenants])

  // Audit log
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

  // Calculate approximate SLA based on non-critical/offline ratio
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
