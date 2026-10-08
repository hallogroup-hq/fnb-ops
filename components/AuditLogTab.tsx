'use client'

import React from 'react'
import type { StaffAuditLog } from '../types/fleet'

interface AuditLogTabProps {
  logs: StaffAuditLog[]
}

export default function AuditLogTab({ logs }: AuditLogTabProps) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h2 className="font-semibold text-xs text-zinc-900">
            Audit Trail Aktivitas & Perintah Jarak Jauh
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Log permanen dari seluruh perintah remediasi dan modifikasi konfigurasi tenant klien
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          {logs.length} ENTRI DIREKAM
        </span>
      </div>

      <div className="divide-y divide-zinc-100">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs hover:bg-zinc-50/60 transition-colors"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 text-[10px] border border-zinc-200">
                  {log.action}
                </span>
                <span className="font-medium text-zinc-900">{log.targetTenantName}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({log.targetTenantId})
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-normal font-mono">
                {log.details}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="font-medium text-zinc-800 text-[11px]">{log.staffName}</div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {new Date(log.timestamp).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="p-8 text-center text-zinc-400 text-xs">
            Belum ada aktivitas yang direkam pada audit trail.
          </div>
        )}
      </div>
    </div>
  )
}
