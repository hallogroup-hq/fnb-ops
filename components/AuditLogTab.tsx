'use client'

import React from 'react'
import { FileText, ShieldCheck, Clock, User, ArrowRight } from 'lucide-react'
import type { StaffAuditLog } from '../types/fleet'

interface AuditLogTabProps {
  logs: StaffAuditLog[]
}

export default function AuditLogTab({ logs }: AuditLogTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-extrabold text-sm text-slate-900">
            Audit Trail Aktivitas Staf Internal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat tidak terhapus dari seluruh perintah remote dan modifikasi lisensi pada toko klien
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400">
          {logs.length} Log Direkam
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px]">
                  {log.action}
                </span>
                <span className="font-bold text-slate-900">{log.targetTenantName}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({log.targetTenantId})
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {log.details}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="font-semibold text-slate-800">{log.staffName}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {new Date(log.timestamp).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
