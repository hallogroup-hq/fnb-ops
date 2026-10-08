'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Layers,
  Database,
  CheckCircle2,
  RotateCw,
  Terminal,
  ShieldCheck,
  Zap,
  Printer,
  Tablet,
  Download,
  Clock,
  HardDrive,
} from 'lucide-react'
import type {
  TenantStore,
  RemoteLogEntry,
  DatabaseBackupJob,
  ClientAppRolloutStatus,
} from '../types/fleet'

interface IncidentRadarTabProps {
  tenants: TenantStore[]
  logs: RemoteLogEntry[]
  backups: DatabaseBackupJob[]
  rollouts: ClientAppRolloutStatus[]
  onBroadcastRollout: (version: string, channel: 'production' | 'canary') => void
  onTriggerBackup: (tenantId: string) => void
  onResolveLog: (logId: string) => void
  onQueueCommand: (tenantId: string, commandType: any, payload?: any) => void
}

export default function IncidentRadarTab({
  tenants,
  logs,
  backups,
  rollouts,
  onBroadcastRollout,
  onTriggerBackup,
  onResolveLog,
  onQueueCommand,
}: IncidentRadarTabProps) {
  const [selectedVersion, setSelectedVersion] = useState('v2.5.0-prod')
  const [selectedChannel, setSelectedChannel] = useState<'production' | 'canary'>('production')
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  // Auto-detect store incidents across fleet
  const activeIncidents = React.useMemo(() => {
    const list: Array<{
      id: string
      tenantId: string
      tenantName: string
      type: 'printer' | 'battery' | 'storage' | 'error' | 'past_due'
      title: string
      description: string
      severity: 'critical' | 'warning'
      actionLabel?: string
      actionCommand?: string
    }> = []

    tenants.forEach((t) => {
      // 1. Printer issues
      t.latestTelemetry?.printers.forEach((p) => {
        if (p.status === 'out_of_paper' || p.status === 'error' || p.failedJobsCount > 0) {
          list.push({
            id: `inc-prn-${p.printerId}`,
            tenantId: t.id,
            tenantName: t.name,
            type: 'printer',
            title: `Printer ${p.name} (${p.status.toUpperCase()})`,
            description: `Sensor melaporkan kegagalan cetak (${p.failedJobsCount}x gagal). Periksa kertas thermal.`,
            severity: 'critical',
            actionLabel: 'Restart Printer Driver',
            actionCommand: 'RESTART_PRINTER',
          })
        }
      })

      // 2. Low battery
      t.latestTelemetry?.devices.forEach((d) => {
        if (d.batteryLevel && d.batteryLevel < 20 && !d.isCharging) {
          list.push({
            id: `inc-bat-${d.deviceId}`,
            tenantId: t.id,
            tenantName: t.name,
            type: 'battery',
            title: `Baterai Tablet Kasir ${d.name} Kritis (${d.batteryLevel}%)`,
            description: `Tablet tidak terhubung ke charger. Kasir berisiko mati mendadak saat transaksi ramai.`,
            severity: 'warning',
          })
        }
      })

      // 3. Storage unsynced queue
      if (t.latestTelemetry?.storage && t.latestTelemetry.storage.unSyncedTransactionsCount > 5) {
        list.push({
          id: `inc-stg-${t.id}`,
          tenantId: t.id,
          tenantName: t.name,
          type: 'storage',
          title: `Antrean Offline Tertahan: ${t.latestTelemetry.storage.unSyncedTransactionsCount} Transaksi`,
          description: `Terdapat transaksi lokal yang belum tersinkronisasi ke cloud server lebih dari 1 jam.`,
          severity: 'critical',
          actionLabel: 'Paksa Resync Storage',
          actionCommand: 'RESYNC_STORAGE',
        })
      }

      // 4. Past due
      if (t.billingStatus === 'past_due') {
        list.push({
          id: `inc-bill-${t.id}`,
          tenantId: t.id,
          tenantName: t.name,
          type: 'past_due',
          title: `Tagihan Lisensi Lewat Jatuh Tempo (${t.name})`,
          description: `Akun toko telah melewati jatuh tempo. Periksa status faktur atau lakukan penangguhan.`,
          severity: 'warning',
        })
      }
    })

    return list
  }, [tenants])

  // Aggregate terminal adoption
  const devices = tenants.flatMap((t) => t.latestTelemetry?.devices || [])
  const totalTerminals = devices.length
  const updatedTerminals = devices.filter((d) => d.appVersion === 'v2.5.0-prod').length
  const globalAdoption = totalTerminals > 0 ? Math.round((updatedTerminals / totalTerminals) * 100) : 100

  function handleTriggerBroadcast() {
    setIsBroadcasting(true)
    setTimeout(() => {
      onBroadcastRollout(selectedVersion, selectedChannel)
      setIsBroadcasting(false)
      setFeedbackNotice(`Perintah OTA reload ${selectedVersion} disiarkan ke seluruh armada terminal kasir klien.`)
      setTimeout(() => setFeedbackNotice(null), 4000)
    }, 500)
  }

  return (
    <div className="space-y-4">
      {/* FEEDBACK BANNER */}
      {feedbackNotice && (
        <div className="py-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* TOP RADAR HEALTH RIBBON */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 text-xs">
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Insiden Terdeteksi</span>
            <span className="font-mono text-[10px] text-zinc-400">RADAR</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {activeIncidents.length} Toko
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {activeIncidents.filter((i) => i.severity === 'critical').length} Kritis · {activeIncidents.filter((i) => i.severity === 'warning').length} Peringatan
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Adopsi Versi POS</span>
            <span className="font-mono text-[10px] text-zinc-400">ROLLOUT</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {globalAdoption}%
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {updatedTerminals}/{totalTerminals} Terminal v2.5.0
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Cadangan Database</span>
            <span className="font-mono text-[10px] text-zinc-400">SNAPSHOTS</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {backups.length} File
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Terenkripsi SHA-256
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Log Unhandled</span>
            <span className="font-mono text-[10px] text-zinc-400">ERRORS</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {logs.filter((l) => !l.resolved).length} Masalah
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Realtime Exceptions
          </div>
        </div>
      </div>

      {/* 1. ACTIVE INCIDENTS RADAR LIST */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" />
            <h2 className="font-semibold text-xs text-zinc-900">
              Radar Insiden & Masalah Operasional Lapangan ({activeIncidents.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">AUTO-HEURISTIC MONITOR</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {activeIncidents.length > 0 ? (
            activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                        inc.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="font-semibold text-zinc-900">{inc.title}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">· {inc.tenantName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-mono">{inc.description}</p>
                </div>

                {inc.actionLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      if (inc.actionCommand) {
                        onQueueCommand(inc.tenantId, inc.actionCommand)
                        setFeedbackNotice(`Tindakan "${inc.actionLabel}" berhasil dikirim ke toko ${inc.tenantName}.`)
                      }
                    }}
                    className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs font-mono transition-colors cursor-pointer shrink-0"
                  >
                    {inc.actionLabel}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-400 text-xs font-mono">
              ✓ Semua hardware, printer, dan sinkronisasi kasir armada berjalan normal.
            </div>
          )}
        </div>
      </div>

      {/* 2. OTA ROLLOUT & POS APP VERSION DISTRIBUTION */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={15} className="text-zinc-600" />
            <h3 className="font-semibold text-xs text-zinc-900">
              Distribusi Versi Aplikasi Kasir & Staged OTA Rollout
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">REMOTE UPDATE DISPATCHER</span>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50">
            <div>
              <div className="font-semibold text-zinc-900">
                Siarkan Pembaruan Paksa (Broadcast OTA Reload)
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Memaksa seluruh tablet kasir di lapangan untuk memuat bundle versi rilis terbaru tanpa perlu staf datang ke toko
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="p-1.5 rounded border border-zinc-300 font-mono text-xs bg-white cursor-pointer"
              >
                <option value="v2.5.0-prod">v2.5.0-prod (Rilis Terkini)</option>
                <option value="v2.4.2-stable">v2.4.2-stable (Legacy)</option>
              </select>

              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as any)}
                className="p-1.5 rounded border border-zinc-300 font-mono text-xs bg-white cursor-pointer"
              >
                <option value="production">Production</option>
                <option value="canary">Canary</option>
              </select>

              <button
                type="button"
                onClick={handleTriggerBroadcast}
                disabled={isBroadcasting}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Zap size={13} />
                <span>{isBroadcasting ? 'Menyiarkan...' : 'Siarkan OTA Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* ROLLOUT VERSIONS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-500 uppercase">
                  <th className="py-2 px-3 font-semibold">Versi Rilis</th>
                  <th className="py-2 px-3 font-semibold">Kanal</th>
                  <th className="py-2 px-3 font-semibold text-right">Adopsi</th>
                  <th className="py-2 px-3 font-semibold text-right">Terminal Aktif</th>
                  <th className="py-2 px-3 font-semibold font-sans">Catatan Rilis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-[11px]">
                {rollouts.map((r) => (
                  <tr key={r.version} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">
                      {r.version} {r.isLatest && <span className="text-emerald-600 font-normal">(LATEST)</span>}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-zinc-600">
                      {r.releaseChannel}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                      {r.adoptionPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-600">
                      {r.activeTerminalsCount} Tablet
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 font-sans">
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. MULTI-TENANT DATABASE BACKUPS */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database size={15} className="text-zinc-600" />
            <h3 className="font-semibold text-xs text-zinc-900">
              Snapshot & Cadangan Database Multi-Tenant ({backups.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">DATA INTEGRITY VAULT</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-500 uppercase">
                <th className="py-2 px-3.5 font-semibold">Toko Klien</th>
                <th className="py-2 px-3.5 font-semibold">Ukuran File</th>
                <th className="py-2 px-3.5 font-semibold">Baris Data</th>
                <th className="py-2 px-3.5 font-semibold">Checksum SHA-256</th>
                <th className="py-2 px-3.5 font-semibold">Waktu Pembuatan</th>
                <th className="py-2 px-3.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-[11px]">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50/50">
                  <td className="py-2.5 px-3.5 font-semibold text-zinc-900 font-sans">
                    {b.tenantName}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-700">
                    {b.snapshotSizeMb} MB
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-700">
                    {b.totalRecordsCount.toLocaleString('id-ID')} Records
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500 text-[10px] truncate max-w-xs">
                    {b.checksum}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500">
                    {new Date(b.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify(b, null, 2)
                        const blob = new Blob([jsonStr], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `backup-${b.tenantId}-${Date.now()}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-[10px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>Unduh JSON</span>
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
