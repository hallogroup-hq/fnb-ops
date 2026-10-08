import { NextResponse } from 'next/server'
import {
  getRemoteLogs,
  addRemoteLog,
  getFleetTenants,
  updateTenant,
  getTenantById,
} from '../../../lib/fleet/telemetryStore'
import type { DeviceTelemetry, PrinterTelemetry, StorageTelemetry } from '../../../types/fleet'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')

  const logs = getRemoteLogs()
  const filtered = tenantId ? logs.filter((l) => l.tenantId === tenantId) : logs

  return NextResponse.json({
    success: true,
    logs: filtered,
    total: filtered.length,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenantId,
      outletId,
      outletName,
      device,
      printer,
      storage,
      errorLog,
    } = body as {
      tenantId: string
      outletId?: string
      outletName?: string
      device?: DeviceTelemetry
      printer?: PrinterTelemetry
      storage?: StorageTelemetry
      errorLog?: {
        level: 'fatal' | 'error' | 'warn' | 'info'
        message: string
        stackTrace?: string
        sourceModule: string
        context?: Record<string, any>
      }
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 })
    }

    // 1. If an error log is reported, ingest it
    if (errorLog) {
      addRemoteLog({
        tenantId,
        outletId,
        outletName,
        level: errorLog.level,
        message: errorLog.message,
        stackTrace: errorLog.stackTrace,
        sourceModule: errorLog.sourceModule,
        context: errorLog.context,
      })
    }

    // 2. If telemetry heartbeat is reported, update tenant store
    const tenant = getTenantById(tenantId)
    if (tenant) {
      const existingTelemetry = tenant.latestTelemetry || {
        devices: [],
        printers: [],
        storage: {
          outletId: outletId || 'main',
          localStorageBytes: 0,
          estimatedQuotaBytes: 5242880,
          unSyncedTransactionsCount: 0,
          integrityOk: true,
          lastSyncAt: Date.now(),
        },
      }

      let updatedDevices = [...existingTelemetry.devices]
      if (device) {
        const devIdx = updatedDevices.findIndex((d) => d.deviceId === device.deviceId)
        if (devIdx >= 0) {
          updatedDevices[devIdx] = device
        } else {
          updatedDevices.push(device)
        }
      }

      let updatedPrinters = [...existingTelemetry.printers]
      if (printer) {
        const prnIdx = updatedPrinters.findIndex((p) => p.printerId === printer.printerId)
        if (prnIdx >= 0) {
          updatedPrinters[prnIdx] = printer
        } else {
          updatedPrinters.push(printer)
        }
      }

      const updatedStorage = storage || existingTelemetry.storage

      // Evaluate health status
      let health = tenant.healthStatus
      if (errorLog && errorLog.level === 'fatal') {
        health = 'critical'
      } else if (errorLog && errorLog.level === 'error') {
        health = 'warning'
      } else if (printer && (printer.status === 'error' || printer.status === 'out_of_paper')) {
        health = 'warning'
      } else if (storage && !storage.integrityOk) {
        health = 'critical'
      } else if (health !== 'critical') {
        health = 'healthy'
      }

      updateTenant({
        ...tenant,
        healthStatus: health,
        latestTelemetry: {
          devices: updatedDevices,
          printers: updatedPrinters,
          storage: updatedStorage,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Telemetry ingested successfully',
      timestamp: Date.now(),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
