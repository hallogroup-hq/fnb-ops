'use client'

import React, { useState } from 'react'
import {
  X,
  Tablet,
  Printer,
  HardDrive,
  Terminal,
  Wrench,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Battery,
  BatteryCharging,
  Zap,
  ExternalLink,
} from 'lucide-react'
import type { TenantStore, RemoteLogEntry } from '../types/fleet'

interface TenantDeepInspectorModalProps {
  tenant: TenantStore
  logs: RemoteLogEntry[]
  onClose: () => void
  onUpdateTenant: (updated: TenantStore) => void
  onQueueCommand: (
    tenantId: string,
    commandType: any,
    payload?: Record<string, any>
  ) => void
  onResolveLog: (logId: string) => void
  onLaunchShadowMode: (tenant: TenantStore) => void
}

export default function TenantDeepInspectorModal({
  tenant,
  logs,
  onClose,
  onUpdateTenant,
  onQueueCommand,
  onResolveLog,
  onLaunchShadowMode,
}: TenantDeepInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'storage' | 'logs' | 'remediation' | 'shadow'
  >('telemetry')

  const [commandFeedback, setCommandFeedback] = useState<string | null>(null)

  // Config patch state
  const [patchTier, setPatchTier] = useState(tenant.subscriptionTier)
  const [patchMaintenance, setPatchMaintenance] = useState(tenant.emergencyMaintenance)
  const [patchModules, setPatchModules] = useState<Record<string, boolean>>({
    ...tenant.modules,
  })

  const tenantLogs = logs.filter((l) => l.tenantId === tenant.id)
  const telemetry = tenant.latestTelemetry

  function handleExecuteRemoteCommand(commandType: string, label: string, payload?: any) {
    onQueueCommand(tenant.id, commandType as any, payload)
    setCommandFeedback(`Perintah remote "${label}" dikirim ke antrean toko ${tenant.name}.`)
    setTimeout(() => {
      setCommandFeedback(null)
    }, 4000)
  }

  function handleSaveConfigPatch(e: React.FormEvent) {
    e.preventDefault()
    const updated: TenantStore = {
      ...tenant,
      subscriptionTier: patchTier,
      emergencyMaintenance: patchMaintenance,
      modules: patchModules,
      updatedAt: Date.now(),
    }
    onUpdateTenant(updated)
    handleExecuteRemoteCommand(
      'PATCH_CONFIG',
      'Patch Lisensi & Modul Toko',
      { tier: patchTier, emergencyMaintenance: patchMaintenance, modules: patchModules }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-lg border border-zinc-200 shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* WORKBENCH HEADER */}
        <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between gap-4 bg-zinc-50/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">
                {tenant.name}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase font-medium">
                {tenant.subscriptionTier}
              </span>
              <span
                className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                  tenant.healthStatus === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : tenant.healthStatus === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : tenant.healthStatus === 'critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {tenant.healthStatus.toUpperCase()}
              </span>
              {tenant.emergencyMaintenance && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-rose-600 text-white">
                  MAINTENANCE LOCK
                </span>
              )}
            </div>

            <div className="text-[11px] text-zinc-500 font-mono mt-0.5 flex items-center gap-2">
              <span>{tenant.slug}</span>
              <span>·</span>
              <span>Pemilik: {tenant.ownerName} ({tenant.ownerPhone})</span>
              <span>·</span>
              <span>ID: {tenant.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onLaunchShadowMode(tenant)}
              className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buka Toko Klien (Shadow Mode)"
            >
              <Eye size={13} />
              <span>Shadow Mode</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {commandFeedback && (
          <div className="py-2 px-5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{commandFeedback}</span>
          </div>
        )}

        {/* WORKBENCH SUBTABS */}
        <div className="flex items-center gap-1 px-5 border-b border-zinc-200 bg-white overflow-x-auto shrink-0">
          {[
            { id: 'telemetry', label: 'Hardware & Terminal', icon: Tablet },
            { id: 'storage', label: 'Storage & DB Health', icon: HardDrive },
            {
              id: 'logs',
              label: `Console Logs (${tenantLogs.filter((l) => !l.resolved).length})`,
              icon: Terminal,
            },
            { id: 'remediation', label: 'Remote Remediasi', icon: Wrench },
            { id: 'shadow', label: 'Shadow Inspector', icon: Eye },
          ].map((tb) => {
            const Icon = tb.icon
            const isSel = activeTab === tb.id
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                  isSel
                    ? 'border-zinc-950 text-zinc-950 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Icon size={14} />
                <span>{tb.label}</span>
              </button>
            )
          })}
        </div>

        {/* WORKBENCH BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* 1. HARDWARE & PERANGKAT */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              {/* CONNECTED POS TERMINALS */}
              <div>
                <div className="text-xs font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
                  <Tablet size={14} className="text-zinc-600" />
                  <span>Terminal Kasir & Tablet Aktif</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {telemetry?.devices && telemetry.devices.length > 0 ? (
                    telemetry.devices.map((d) => (
                      <div
                        key={d.deviceId}
                        className="p-3 rounded-md border border-zinc-200 bg-white space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-zinc-900">{d.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              ID: {d.deviceId} · {d.outletId}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ONLINE
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-100">
                          <div>
                            <span className="text-zinc-400 block text-[10px]">OS / Browser:</span>
                            <span className="text-zinc-700 font-medium">{d.os} ({d.browser})</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Resolusi Layar:</span>
                            <span className="text-zinc-700 font-medium">{d.screenResolution}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Gateway Latency:</span>
                            <span
                              className={`font-mono ${
                                d.networkLatencyMs > 200 ? 'text-rose-600 font-medium' : 'text-zinc-700'
                              }`}
                            >
                              {d.networkLatencyMs} ms
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Baterai & Power:</span>
                            <span className="text-zinc-700 font-medium flex items-center gap-1">
                              {d.isCharging ? (
                                <BatteryCharging size={12} className="text-emerald-600" />
                              ) : (
                                <Battery size={12} />
                              )}
                              <span>{d.batteryLevel !== undefined ? `${d.batteryLevel}%` : 'AC Power'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-zinc-100 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                          <span>Build: {d.appVersion}</span>
                          <span>Ping: {Math.max(1, Math.floor((Date.now() - d.lastHeartbeatAt) / 1000))}s lalu</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-6 text-center text-zinc-400 border border-zinc-200 rounded-md">
                      Belum ada telemetri tablet terhubung.
                    </div>
                  )}
                </div>
              </div>

              {/* CONNECTED PRINTERS */}
              <div>
                <div className="text-xs font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
                  <Printer size={14} className="text-zinc-600" />
                  <span>Printer Thermal ESC/POS (Kasir & Dapur)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {telemetry?.printers && telemetry.printers.length > 0 ? (
                    telemetry.printers.map((p) => (
                      <div
                        key={p.printerId}
                        className={`p-3 rounded-md border text-xs space-y-2 ${
                          p.status === 'out_of_paper' || p.status === 'error'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-zinc-900">{p.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Koneksi: {p.connectionType.toUpperCase()} · Kertas: {p.paperWidth}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                              p.status === 'connected'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.status === 'out_of_paper'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}
                          >
                            {p.status === 'connected'
                              ? 'TERHUBUNG'
                              : p.status === 'out_of_paper'
                              ? 'KERTAS HABIS'
                              : 'TERPUTUS'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-100 font-mono">
                          <span className="text-zinc-500">Gagal Cetak: {p.failedJobsCount}x</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleExecuteRemoteCommand(
                                'PATCH_CONFIG',
                                'Kirim Tes Cetak Remote ESC/POS',
                                { printerId: p.printerId, testPrint: true }
                              )
                            }
                            className="text-zinc-900 font-medium hover:underline cursor-pointer"
                          >
                            Kirim Paket Tes Cetak &rarr;
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-6 text-center text-zinc-400 border border-zinc-200 rounded-md">
                      Belum ada printer thermal terdaftar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. STORAGE & DATABASE HEALTH */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-md border border-zinc-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-zinc-900">
                      Penyimpanan Lokal Browser Client (LocalStorage & IndexedDB)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Monitor kuota penyimpanan browser kasir agar transaksi offline tidak tertolak
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                      telemetry?.storage?.integrityOk
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {telemetry?.storage?.integrityOk ? 'INTEGRITAS OK' : 'PERLU PERBAIKAN'}
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-600">
                    <span>
                      Terpakai: {Math.round((telemetry?.storage?.localStorageBytes || 0) / 1024)} KB
                    </span>
                    <span>
                      Estimasi Batas Kuota: {Math.round((telemetry?.storage?.estimatedQuotaBytes || 5242880) / (1024 * 1024))} MB
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        (telemetry?.storage?.localStorageBytes || 0) > 3500000
                          ? 'bg-rose-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((telemetry?.storage?.localStorageBytes || 0) /
                              (telemetry?.storage?.estimatedQuotaBytes || 5242880)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Transaksi Nyangkut (Offline Queue):</span>
                    <span className={telemetry?.storage?.unSyncedTransactionsCount ? 'text-rose-600 font-medium' : 'text-zinc-800'}>
                      {telemetry?.storage?.unSyncedTransactionsCount || 0} Tagihan
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Sinkronisasi Terakhir:</span>
                    <span className="text-zinc-700">
                      {telemetry?.storage?.lastSyncAt
                        ? `${Math.max(1, Math.floor((Date.now() - telemetry.storage.lastSyncAt) / 60000))} mnt lalu`
                        : 'Belum pernah'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Tindakan:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteRemoteCommand('RESYNC_STORAGE', 'Paksa Sinkronisasi Ulang Database')
                      }
                      className="text-zinc-900 font-medium hover:underline cursor-pointer"
                    >
                      Paksa Resync Database &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CONSOLE & CRASH LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900">
                  Daftar Pengecualian & Crash Runtime ({tenantLogs.length} Entri)
                </span>
                <span className="text-zinc-400 font-mono text-[10px]">
                  FILTER AUTOMATIC
                </span>
              </div>

              <div className="space-y-2">
                {tenantLogs.length > 0 ? (
                  tenantLogs.map((l) => (
                    <div
                      key={l.id}
                      className={`p-3 rounded-md border text-xs space-y-1.5 ${
                        l.resolved
                          ? 'bg-zinc-50 border-zinc-200 opacity-60'
                          : l.level === 'fatal'
                          ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                          : l.level === 'error'
                          ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                          : 'bg-white border-zinc-200 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-mono font-medium px-1 rounded uppercase ${
                              l.level === 'fatal'
                                ? 'bg-rose-100 text-rose-800'
                                : l.level === 'error'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {l.level}
                          </span>
                          <span className="font-semibold text-xs">{l.sourceModule}</span>
                          {l.outletName && (
                            <span className="text-[11px] text-zinc-500 font-mono">
                              · {l.outletName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {new Date(l.timestamp).toLocaleTimeString('id-ID')}
                          </span>
                          {!l.resolved && (
                            <button
                              type="button"
                              onClick={() => onResolveLog(l.id)}
                              className="px-2 py-0.5 rounded bg-white border border-zinc-200 hover:border-zinc-400 font-medium text-[10px] transition-colors cursor-pointer text-zinc-800"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="font-mono text-xs leading-relaxed">
                        {l.message}
                      </p>

                      {l.stackTrace && (
                        <details className="text-[11px] font-mono bg-zinc-900 text-zinc-100 p-2.5 rounded overflow-x-auto cursor-pointer">
                          <summary className="text-zinc-400 hover:text-white font-medium">
                            Stack Trace
                          </summary>
                          <pre className="mt-1 text-[10px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                            {l.stackTrace}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-400 border border-zinc-200 rounded-md">
                    <CheckCircle2 size={20} className="mx-auto mb-1 text-emerald-600" />
                    <p className="font-semibold text-xs text-zinc-800">Tidak ada log error</p>
                    <p className="text-[11px] text-zinc-500">Toko ini berjalan tanpa kendala runtime.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. REMOTE REMEDIATION WORKBENCH */}
          {activeTab === 'remediation' && (
            <div className="space-y-4">
              <div className="bg-zinc-900 text-zinc-100 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-emerald-400" />
                    <h3 className="font-semibold text-xs text-white">
                      Pusat Eksekusi Remediasi Jarak Jauh (Zero-Touch Remote Repair)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    DIRECT CLIENT DISPATCH
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Perintah dikirim langsung ke antrean instance kasir toko klien. Tablet toko mengeksekusi instruksi ini secara otonom tanpa perlu teknisi datang ke toko.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {/* ACTION 1: FORCE CACHE PURGE */}
                  <div className="p-3 rounded bg-zinc-800 border border-zinc-700 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h4 className="font-semibold text-xs text-white">
                        1. Bersihkan Cache & Sinkronisasi Ulang
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Menghapus snapshot cache lokal yang korup dan menarik master data menu/harga terbaru.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteRemoteCommand(
                          'FORCE_CACHE_PURGE',
                          'Pembersihan Cache & Resync'
                        )
                      }
                      className="py-1.5 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>Kirim Perintah Purge Cache</span>
                    </button>
                  </div>

                  {/* ACTION 2: UNSTUCK BILLS */}
                  <div className="p-3 rounded bg-zinc-800 border border-zinc-700 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h4 className="font-semibold text-xs text-white">
                        2. Lepaskan Tagihan & Meja Nyangkut
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Memulihkan pesanan yang tertahan atau meja yang terkunci akibat browser crash saat transaksi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteRemoteCommand(
                          'CLEAR_STUCK_BILLS',
                          'Pelepasan Meja & Tagihan Macet'
                        )
                      }
                      className="py-1.5 px-2.5 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Wrench size={13} />
                      <span>Lepaskan Tagihan Nyangkut</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* REMOTE CONFIG PATCH FORM */}
              <form
                onSubmit={handleSaveConfigPatch}
                className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3"
              >
                <div className="border-b border-zinc-100 pb-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-zinc-900">
                      Patch Lisensi & Modul Fitur Toko
                    </h4>
                    <span className="text-[11px] text-zinc-500">
                      Ubah paket langganan atau aktifkan modul bisnis tambahan dari jarak jauh
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="py-1.5 px-3 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Terapkan Perubahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-zinc-800 block mb-1">
                      Paket Lisensi SaaS:
                    </label>
                    <select
                      value={patchTier}
                      onChange={(e) => setPatchTier(e.target.value as any)}
                      className="w-full p-2 rounded border border-zinc-200 font-medium bg-white cursor-pointer"
                    >
                      <option value="starter">Paket Starter (Kios / Booth)</option>
                      <option value="pro">Paket Pro (Cafe / Resto)</option>
                      <option value="enterprise">Paket Enterprise (Multi-Cabang & Roastery)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-zinc-800 block mb-1">
                      Mode Pemeliharaan Darurat:
                    </label>
                    <select
                      value={patchMaintenance ? 'true' : 'false'}
                      onChange={(e) => setPatchMaintenance(e.target.value === 'true')}
                      className={`w-full p-2 rounded border font-medium cursor-pointer ${
                        patchMaintenance
                          ? 'border-rose-400 bg-rose-50 text-rose-900'
                          : 'border-zinc-200 bg-white text-zinc-800'
                      }`}
                    >
                      <option value="false">Nonaktif (Operasional Berjalan Normal)</option>
                      <option value="true">AKTIF (Kunci Layar Kasir dengan Banner Pemeliharaan)</option>
                    </select>
                  </div>
                </div>

                {/* MODULAR FLAGS TOGGLES */}
                <div>
                  <label className="font-medium text-zinc-800 block mb-1.5 text-xs">
                    Modul Fitur Granular:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { key: 'kitchen_routing_kds', label: 'KDS Layar Dapur' },
                      { key: 'inventory_recipes_hpp', label: 'Resep Bahan & HPP' },
                      { key: 'batch_production_roasting', label: 'Dapur Roastery / Produksi' },
                      { key: 'b2b_wholesale_invoicing', label: 'Catering & Faktur B2B' },
                      { key: 'accurate_grade_accounting', label: 'Akuntansi SAK EMKM' },
                      { key: 'multi_warehouse_transfer', label: 'Transfer Antar Gudang' },
                    ].map((m) => (
                      <label
                        key={m.key}
                        className="flex items-center gap-2 p-2 rounded border border-zinc-200 bg-zinc-50/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={patchModules[m.key] ?? false}
                          onChange={(e) =>
                            setPatchModules({
                              ...patchModules,
                              [m.key]: e.target.checked,
                            })
                          }
                          className="rounded text-zinc-900"
                        />
                        <span className="font-normal text-[11px] text-zinc-800 truncate">
                          {m.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* 5. SHADOW MODE */}
          {activeTab === 'shadow' && (
            <div className="p-5 rounded-lg border border-zinc-200 bg-white space-y-3">
              <div className="text-xs font-semibold text-zinc-900">
                Akses Shadow Inspector Mode
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Membuka instance website kasir klien dengan token verifikasi resmi Hallo Group untuk mereproduksi keluhan atau menginspeksi layout meja secara langsung.
              </p>

              <div className="p-3 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-1">
                <div className="text-zinc-400 text-[10px]">URL Target Diagnostik:</div>
                <div className="font-medium text-zinc-900 truncate">
                  {tenant.liveStoreUrl}?shadow_mode=true&tenant_id={tenant.id}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onLaunchShadowMode(tenant)}
                  className="py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Buka Toko Klien di Tab Baru</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* WORKBENCH FOOTER */}
        <div className="px-5 py-2.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div>
            Terdaftar: {new Date(tenant.createdAt).toLocaleDateString('id-ID')} · Update: {new Date(tenant.updatedAt).toLocaleTimeString('id-ID')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-1 px-3 rounded border border-zinc-300 font-medium text-zinc-700 hover:bg-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
