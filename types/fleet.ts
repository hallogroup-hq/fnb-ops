export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline'

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise'

export type BillingStatus = 'active' | 'trial' | 'grace_period' | 'past_due' | 'suspended' | 'overdue'

export type BillingCycle = 'monthly' | 'annually'

export type PaymentMethod =
  | 'va_bca'
  | 'va_mandiri'
  | 'qris'
  | 'manual_transfer'
  | 'credit_card'
  | 'bank_transfer'

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface TenantInvoice {
  id: string
  invoiceNumber: string
  tenantId: string
  tenantName: string
  planTier: SubscriptionTier
  billingCycle: BillingCycle
  amount: number
  status: InvoiceStatus
  issuedAt: number
  dueDate: number
  paidAt?: number
  paymentMethod?: PaymentMethod
  items: InvoiceLineItem[]
  notes?: string
}

export interface SaaSFinanceOverview {
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  totalCollectedThisMonth: number
  pendingReceivables: number // Piutang belum terbayar
  overdueAmount: number
  arpu: number // Average Revenue Per User
  activeSubscriptionsCount: number
  expiringIn30DaysCount: number
  churnRatePct: number
}

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
  | 'FORCE_OTA_RELOAD'
  | 'TRIGGER_DB_SNAPSHOT'

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

export interface DatabaseBackupJob {
  id: string
  tenantId: string
  tenantName: string
  snapshotSizeMb: number
  totalRecordsCount: number
  status: 'completed' | 'in_progress' | 'failed'
  createdAt: number
  checksum: string
  retentionDays: number
}

export interface ClientAppRolloutStatus {
  version: string
  releaseChannel: 'production' | 'canary' | 'beta'
  isLatest: boolean
  releaseDate: string
  activeTenantsCount: number
  activeTerminalsCount: number
  adoptionPct: number
  notes: string
}

export interface StoreStaffUser {
  id: string
  tenantId: string
  outletId?: string
  name: string
  role: 'owner' | 'manager' | 'cashier' | 'barista' | 'kitchen'
  pin: string
  active: boolean
  lastLoginAt?: number
}

export interface StoreMenuItemPreview {
  id: string
  name: string
  category: string
  price: number
  isAvailable: boolean
  hpp: number
}

export interface StoreInventoryPreview {
  id: string
  name: string
  unit: string
  currentStock: number
  minimumStock: number
  isNegative: boolean
  lastRestockedAt?: number
}

export interface StoreLiveOrderPreview {
  id: string
  orderNumber: string
  tableName?: string
  customerName?: string
  totalAmount: number
  paymentStatus: 'paid' | 'pending' | 'voided'
  orderStatus: 'queue' | 'cooking' | 'served' | 'done' | 'stuck'
  createdAt: number
  itemsSummary: string
}

export interface TenantStore {
  id: string
  slug: string
  name: string
  legalName: string
  categoryFnb?: string
  address?: string
  taxId?: string
  bankName?: string
  bankAccount?: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  subscriptionTier: SubscriptionTier
  billingStatus: BillingStatus
  billingCycle?: BillingCycle
  monthlyFee?: number
  lifetimePaid?: number
  autoRenew?: boolean
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
  staffUsers?: StoreStaffUser[]
  menuItems?: StoreMenuItemPreview[]
  inventoryItems?: StoreInventoryPreview[]
  liveOrders?: StoreLiveOrderPreview[]
  invoices?: TenantInvoice[]
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
  billingCycle?: BillingCycle
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
