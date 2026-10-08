export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline'

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise'

export type BillingStatus = 'active' | 'trial' | 'grace_period' | 'past_due' | 'suspended'

export interface DeviceTelemetry {
  deviceId: string
  name: string
  deviceType: 'pos_tablet' | 'kds_display' | 'mobile_waiter' | 'manager_pc'
  outletId: string
  os: string
  browser: string
  screenResolution: string
  batteryLevel?: number
  isCharging?: boolean
  networkLatencyMs: number
  lastHeartbeatAt: number
  appVersion: string
}

export interface PrinterTelemetry {
  printerId: string
  outletId: string
  name: string
  connectionType: 'bluetooth' | 'usb' | 'network' | 'browser_direct'
  paperWidth: '58mm' | '80mm'
  status: 'connected' | 'out_of_paper' | 'disconnected' | 'error'
  lastPrintJobAt?: number
  failedJobsCount: number
}

export interface StorageTelemetry {
  outletId: string
  localStorageBytes: number
  estimatedQuotaBytes: number
  unSyncedTransactionsCount: number
  integrityOk: boolean
  lastSyncAt: number
}

export interface RemoteLogEntry {
  id: string
  tenantId: string
  outletId?: string
  outletName?: string
  timestamp: number
  level: 'fatal' | 'error' | 'warn' | 'info'
  message: string
  stackTrace?: string
  sourceModule: string
  deviceInfo?: string
  context?: Record<string, any>
  resolved: boolean
}

export type RemoteCommandType =
  | 'FORCE_CACHE_PURGE'
  | 'RESYNC_STORAGE'
  | 'CLEAR_STUCK_BILLS'
  | 'EMERGENCY_MAINTENANCE_TOGGLE'
  | 'PATCH_CONFIG'
  | 'UPDATE_SUBSCRIPTION'

export interface RemoteRepairCommand {
  id: string
  tenantId: string
  outletId?: string
  commandType: RemoteCommandType
  payload?: Record<string, any>
  issuedBy: string
  issuedAt: number
  status: 'pending' | 'executed' | 'failed'
  executedAt?: number
  resultMessage?: string
}

export interface OutletFleetSummary {
  id: string
  name: string
  code: string
  activeTerminalsCount: number
  printerHealth: 'ok' | 'issue' | 'offline'
  todayGmv: number
  todayOrdersCount: number
}

export interface TenantStore {
  id: string
  slug: string
  name: string
  legalName: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  subscriptionTier: SubscriptionTier
  billingStatus: BillingStatus
  subscriptionValidUntil: number
  maxOutlets: number
  maxTerminals: number
  healthStatus: HealthStatus
  liveStoreUrl: string
  activeOutlets: OutletFleetSummary[]
  latestTelemetry?: {
    devices: DeviceTelemetry[]
    printers: PrinterTelemetry[]
    storage: StorageTelemetry
  }
  modules: Record<string, boolean>
  emergencyMaintenance: boolean
  createdAt: number
  updatedAt: number
}

export interface ProvisioningRequest {
  id: string
  storeName: string
  legalName?: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  requestedTier: SubscriptionTier
  requestedOutlets: number
  notes?: string
  status: 'pending_review' | 'approved' | 'rejected'
  submittedAt: number
}

export interface StaffAuditLog {
  id: string
  staffEmail: string
  staffName: string
  action: string
  targetTenantId: string
  targetTenantName: string
  details: string
  timestamp: number
}

export interface FleetStats {
  totalTenants: number
  activeTenants: number
  totalOutlets: number
  healthyCount: number
  warningCount: number
  criticalCount: number
  offlineCount: number
  totalGmvToday: number
  slaUptimePct: number
  openIncidentsCount: number
}
