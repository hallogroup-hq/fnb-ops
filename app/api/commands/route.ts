import { NextResponse } from 'next/server'
import {
  getRemoteCommands,
  queueRemoteCommand,
  markCommandExecuted,
} from '../../../lib/fleet/telemetryStore'
import type { RemoteCommandType } from '../../../types/fleet'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const status = searchParams.get('status') // 'pending' | 'executed'

  let commands = getRemoteCommands(tenantId || undefined)
  if (status) {
    commands = commands.filter((c) => c.status === status)
  }

  return NextResponse.json({
    success: true,
    commands,
    total: commands.length,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, outletId, commandType, payload, issuedBy } = body as {
      tenantId: string
      outletId?: string
      commandType: RemoteCommandType
      payload?: Record<string, any>
      issuedBy?: string
    }

    if (!tenantId || !commandType) {
      return NextResponse.json(
        { success: false, error: 'tenantId and commandType are required' },
        { status: 400 }
      )
    }

    const command = queueRemoteCommand({
      tenantId,
      outletId,
      commandType,
      payload,
      issuedBy: issuedBy || 'ops@hallogroup.id',
    })

    return NextResponse.json({
      success: true,
      command,
      message: `Remote command ${commandType} enqueued for tenant ${tenantId}`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { commandId, resultMessage } = body as {
      commandId: string
      resultMessage?: string
    }

    if (!commandId) {
      return NextResponse.json({ success: false, error: 'commandId is required' }, { status: 400 })
    }

    markCommandExecuted(commandId, resultMessage)

    return NextResponse.json({
      success: true,
      message: `Command ${commandId} marked as executed`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
