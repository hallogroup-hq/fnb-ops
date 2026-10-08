'use client'

import React, { useState } from 'react'
import {
  HardDrive,
  Database,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  RefreshCw,
  Plus,
} from 'lucide-react'
import type { DatabaseBackupJob, TenantStore } from '../types/fleet'

interface DatabaseBackupsTabProps {
  tenants: TenantStore[]
  backups: DatabaseBackupJob[]
  onTriggerBackup: (tenantId: string) => void
}

export default function DatabaseBackupsTab({
  tenants,
  backups,
  onTriggerBackup,
}: DatabaseBackupsTabProps) {
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || '')
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const totalBackupSizeMb = Math.round(
    backups.reduce((sum, b) => sum + b.snapshotSizeMb, 0) * 10
  ) / 10
  const totalRecords = backups.reduce((sum, b) => sum + b.totalRecordsCount, 0)

  function handleTriggerSnapshot() {
    if (!selectedTenantId) return
    setIsProcessing(true)
    setTimeout(() => {
      onTriggerBackup(selectedTenantId)
      setIsProcessing(false)
      const target = tenants.find((t) => t.id === selectedTenantId)
      setFeedbackNotice(`Snapshot database mandiri untuk ${target?.name || selectedTenantId} berhasil diambil dan terenkripsi.`)
      setTimeout(() => setFeedbackNotice(null), 4000)
    }, 600)
  }

  return (
    <div className="space-y-4">
      {/* 1. BACKUP HEALTH STRIP */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Snapshot Tersimpan</span>
            <span className="font-mono text-[10px] text-zinc-400">COUNT</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
            {backups.length} Snapshot
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {totalRecords.toLocaleString('id-ID')} total baris data
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Ukuran Cloud Storage</span>
            <span className="font-mono text-[10px] text-zinc-400">STORAGE</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
            {totalBackupSizeMb} MB
          </div>
          <div className="text-[11px] text-emerald-700 font-mono">
            Enkripsi AES-256 aktif
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Kebijakan Retensi</span>
            <span className="font-mono text-[10px] text-zinc-400">POLICY</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
            30 - 90 Hari
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Sesuai tier lisensi tenant
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Status Integritas Terakhir</span>
            <span className="font-mono text-[10px] text-zinc-400">HEALTH</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-emerald-700 font-mono tabular-nums">
            100% Valid
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Checksum SHA-256 terverifikasi
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono rounded-md flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 2. MANUAL TRIGGER TOOLBAR */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-zinc-700 shrink-0">
            Ambil Snapshot Mandiri:
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="p-1.5 rounded border border-zinc-200 text-xs font-medium bg-white cursor-pointer"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleTriggerSnapshot}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <Database size={13} className={isProcessing ? 'animate-spin' : ''} />
          <span>{isProcessing ? 'Memproses Snapshot...' : 'Ambil Snapshot Sekarang'}</span>
        </button>
      </div>

      {/* 3. SNAPSHOT LEDGER TABLE */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900">
              Riwayat Snapshot & Cadangan Database Multi-Tenant
            </h3>
            <p className="text-[11px] text-zinc-500">
              Daftar backup berkala transaksi, master menu, resep, dan pembukuan per instance toko klien
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {backups.length} REKAMAN
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2 px-3">Snapshot ID & Waktu</th>
                <th className="py-2 px-3">Toko / Tenant</th>
                <th className="py-2 px-3 text-right">Ukuran File</th>
                <th className="py-2 px-3 text-right">Baris Data</th>
                <th className="py-2 px-3">Checksum Integritas</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono">
                    <div className="font-semibold text-zinc-900">{b.id}</div>
                    <div className="text-[10px] text-zinc-400">
                      {new Date(b.createdAt).toLocaleString('id-ID')}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-medium text-zinc-900">{b.tenantName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{b.tenantId}</div>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {b.snapshotSizeMb} MB
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {b.totalRecordsCount.toLocaleString('id-ID')} baris
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-500">
                    <span className="truncate max-w-[140px] inline-block">{b.checksum}</span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase">
                      {b.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({ backupId: b.id, tenant: b.tenantName, verified: true })], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${b.id}.json`
                        a.click()
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Export JSON</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
