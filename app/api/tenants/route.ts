import { NextResponse } from 'next/server'
import {
  getFleetTenants,
  saveFleetTenants,
  getTenantById,
  updateTenant,
  approveProvisioningRequest,
  rejectProvisioningRequest,
  addStaffAuditLog,
} from '../../../lib/fleet/telemetryStore'
import type { TenantStore } from '../../../types/fleet'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const tenant = getTenantById(id)
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, tenant })
  }

  const tenants = getFleetTenants()
  return NextResponse.json({ success: true, tenants, total: tenants.length })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, requestId, newTenant } = body as {
      action?: 'approve_request' | 'reject_request' | 'create_tenant'
      requestId?: string
      newTenant?: Partial<TenantStore>
    }

    if (action === 'approve_request' && requestId) {
      const created = approveProvisioningRequest(requestId)
      if (!created) {
        return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, tenant: created })
    }

    if (action === 'reject_request' && requestId) {
      rejectProvisioningRequest(requestId)
      return NextResponse.json({ success: true, message: 'Request rejected' })
    }

    if (action === 'create_tenant' && newTenant && newTenant.name) {
      const tenantId = newTenant.id || `org-${newTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      const fullTenant: TenantStore = {
        id: tenantId,
        slug: newTenant.slug || newTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: newTenant.name,
        legalName: newTenant.legalName || newTenant.name,
        ownerName: newTenant.ownerName || 'Pemilik Resto',
        ownerPhone: newTenant.ownerPhone || '-',
        ownerEmail: newTenant.ownerEmail || '-',
        subscriptionTier: newTenant.subscriptionTier || 'pro',
        billingStatus: newTenant.billingStatus || 'active',
        subscriptionValidUntil: newTenant.subscriptionValidUntil || Date.now() + 1000 * 60 * 60 * 24 * 365,
        maxOutlets: newTenant.maxOutlets || 3,
        maxTerminals: newTenant.maxTerminals || 6,
        healthStatus: 'healthy',
        liveStoreUrl: `https://fnb-erp.vercel.app?tenant=${tenantId}`,
        activeOutlets: newTenant.activeOutlets || [
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
        modules: newTenant.modules || {
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

      updateTenant(fullTenant)
      addStaffAuditLog({
        staffEmail: 'ops@hallogroup.id',
        staffName: 'Tim Support Hallo Group',
        action: 'TENANT_MANUAL_PROVISIONED',
        targetTenantId: fullTenant.id,
        targetTenantName: fullTenant.name,
        details: `Membuat instance tenant baru secara manual: ${fullTenant.name} (${fullTenant.subscriptionTier.toUpperCase()}).`,
      })

      return NextResponse.json({ success: true, tenant: fullTenant })
    }

    return NextResponse.json({ success: false, error: 'Invalid action or payload' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, updates } = body as {
      tenantId: string
      updates: Partial<TenantStore>
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 })
    }

    const tenant = getTenantById(tenantId)
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    const merged = { ...tenant, ...updates }
    updateTenant(merged)

    addStaffAuditLog({
      staffEmail: 'ops@hallogroup.id',
      staffName: 'Tim Support Hallo Group',
      action: 'TENANT_CONFIG_UPDATED',
      targetTenantId: tenant.id,
      targetTenantName: tenant.name,
      details: `Memperbarui konfigurasi tenant: ${Object.keys(updates).join(', ')}`,
    })

    return NextResponse.json({ success: true, tenant: merged })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
