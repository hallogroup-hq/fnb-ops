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
  Wifi,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Send,
  Zap,
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
    setCommandFeedback(`Perintah remote "${label}" berhasil dikirim ke antrean toko ${tenant.name}.`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {tenant.name}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-extrabold uppercase">
                {tenant.subscriptionTier}
              </span>
              {tenant.healthStatus === 'healthy' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  SEHAT
                </span>
              )}
              {tenant.healthStatus === 'warning' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  PERINGATAN
                </span>
              )}
              {tenant.healthStatus === 'critical' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse">
                  KRITIS
                </span>
              )}
              {tenant.healthStatus === 'offline' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  OFFLINE
                </span>
              )}
              {tenant.emergencyMaintenance && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  MODE PEMELIHARAAN AKTIF
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
              <span>{tenant.legalName}</span>
              <span>·</span>
              <span className="font-mono">ID: {tenant.id}</span>
              <span>·</span>
              <span>Pemilik: {tenant.ownerName} ({tenant.ownerPhone})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onLaunchShadowMode(tenant)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buka Toko Klien (1-Click Shadow Mode)"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Shadow Mode</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {commandFeedback && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 px-5 animate-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{commandFeedback}</span>
          </div>
        )}

        {/* SUBTABS BAR */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
          {[
            { id: 'telemetry', label: 'Perangkat & Hardware', icon: Tablet },
            { id: 'storage', label: 'Storage & DB Health', icon: HardDrive },
            {
              id: 'logs',
              label: `Log Error (${tenantLogs.filter((l) => !l.resolved).length})`,
              icon: Terminal,
            },
            { id: 'remediation', label: 'Remote Remediasi', icon: Wrench },
            { id: 'shadow', label: 'Akses Shadow Mode', icon: Eye },
          ].map((tb) => {
            const Icon = tb.icon
            const isSel = activeTab === tb.id
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  isSel
                    ? 'border-black text-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={15} />
                <span>{tb.label}</span>
              </button>
            )
          })}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. PERANGKAT & HARDWARE */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* CONNECTED DEVICES */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <Tablet size={16} className="text-slate-700" />
                  <span>Terminal & Tablet Kasir Aktif</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {telemetry?.devices && telemetry.devices.length > 0 ? (
                    telemetry.devices.map((d) => (
                      <div
                        key={d.deviceId}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{d.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {d.deviceId} · Cabang: {d.outletId}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            ONLINE
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">OS & Browser:</span>
                            <span className="font-semibold text-slate-800">{d.os} ({d.browser})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Resolusi Layar:</span>
                            <span className="font-semibold text-slate-800">{d.screenResolution}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Latency Jaringan:</span>
                            <span className={`font-mono font-bold ${d.networkLatencyMs > 200 ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {d.networkLatencyMs} ms
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Baterai & Daya:</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              {d.isCharging ? <BatteryCharging size={13} className="text-emerald-600" /> : <Battery size={13} />}
                              <span>{d.batteryLevel !== undefined ? `${d.batteryLevel}%` : 'AC Power'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                          <span className="font-mono">Versi: {d.appVersion}</span>
                          <span className="font-mono">Heartbeat: {Math.max(1, Math.floor((Date.now() - d.lastHeartbeatAt) / 1000))}d lalu</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                      Belum ada terminal kasir yang melaporkan telemetri.
                    </div>
                  )}
                </div>
              </div>

              {/* CONNECTED PRINTERS */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <Printer size={16} className="text-slate-700" />
                  <span>Printer Thermal Kasir & Dapur (ESC/POS)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {telemetry?.printers && telemetry.printers.length > 0 ? (
                    telemetry.printers.map((p) => (
                      <div
                        key={p.printerId}
                        className={`p-4 rounded-2xl border space-y-3 ${
                          p.status === 'out_of_paper' || p.status === 'error'
                            ? 'bg-rose-50/70 border-rose-300'
                            : 'bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Koneksi: {p.connectionType.toUpperCase()} · Lebar Kertas: {p.paperWidth}
                            </div>
                          </div>

                          {p.status === 'connected' && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              TERHUBUNG
                            </span>
                          )}
                          {p.status === 'out_of_paper' && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                              KERTAS HABIS
                            </span>
                          )}
                          {p.status === 'disconnected' && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              TERPUTUS
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Gagal Cetak: {p.failedJobsCount}x</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleExecuteRemoteCommand('PATCH_CONFIG', 'Kirim Tes Cetak Remote ESC/POS', {
                                printerId: p.printerId,
                                testPrint: true,
                              })
                            }
                            className="text-xs font-bold text-black hover:underline cursor-pointer"
                          >
                            Kirim Perintah Tes Cetak &gt;
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                      Belum ada printer thermal yang terdaftar pada telemetri.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. STORAGE & DATABASE HEALTH */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive size={18} className="text-slate-700" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Status Penyimpanan Lokal Browser (LocalStorage / IndexedDB)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Memastikan browser kasir memiliki ruang cukup dan tidak mengalami kuota penuh
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      telemetry?.storage?.integrityOk
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {telemetry?.storage?.integrityOk ? 'INTEGRITAS VALID' : 'PERLU PERBAIKAN'}
                  </span>
                </div>

                {/* USAGE PROGRESS BAR */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>
                      Terpakai: {Math.round((telemetry?.storage?.localStorageBytes || 0) / 1024)} KB
                    </span>
                    <span>
                      Estimasi Kuota: {Math.round((telemetry?.storage?.estimatedQuotaBytes || 5242880) / (1024 * 1024))} MB
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Transaksi Nyangkut (Offline Queue):</span>
                    <span className={`font-mono font-bold ${telemetry?.storage?.unSyncedTransactionsCount ? 'text-rose-600' : 'text-slate-800'}`}>
                      {telemetry?.storage?.unSyncedTransactionsCount || 0} Antrean
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sinkronisasi Terakhir:</span>
                    <span className="font-semibold text-slate-800">
                      {telemetry?.storage?.lastSyncAt
                        ? `${Math.max(1, Math.floor((Date.now() - telemetry.storage.lastSyncAt) / 60000))} mnt lalu`
                        : 'Belum pernah'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Aksi Cepat:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteRemoteCommand('RESYNC_STORAGE', 'Paksa Sinkronisasi Ulang Database')
                      }
                      className="text-xs font-bold text-black hover:underline cursor-pointer"
                    >
                      Kirim Perintah Resync &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. LIVE ERROR LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Log Pengecualian & Crash Runtime Klien
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar unhandled exception dan log error yang dilaporkan oleh browser kasir
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {tenantLogs.length} Entri Log
                </span>
              </div>

              <div className="space-y-3">
                {tenantLogs.length > 0 ? (
                  tenantLogs.map((l) => (
                    <div
                      key={l.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                        l.resolved
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : l.level === 'fatal'
                          ? 'bg-rose-50 border-rose-300 text-rose-950'
                          : l.level === 'error'
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${
                              l.level === 'fatal'
                                ? 'bg-rose-600 text-white'
                                : l.level === 'error'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {l.level}
                          </span>
                          <span className="font-bold text-xs">{l.sourceModule}</span>
                          {l.outletName && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              · {l.outletName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(l.timestamp).toLocaleTimeString('id-ID')}
                          </span>
                          {!l.resolved && (
                            <button
                              type="button"
                              onClick={() => onResolveLog(l.id)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-black font-bold text-[11px] transition-colors cursor-pointer text-slate-800"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="font-mono text-xs font-semibold leading-relaxed">
                        {l.message}
                      </p>

                      {l.stackTrace && (
                        <details className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto cursor-pointer">
                          <summary className="text-slate-400 font-bold hover:text-white">
                            Lihat Stack Trace &gt;
                          </summary>
                          <pre className="mt-2 text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                            {l.stackTrace}
                          </pre>
                        </details>
                      )}

                      {l.deviceInfo && (
                        <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-200/50">
                          Perangkat: {l.deviceInfo}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
                    <p className="font-bold text-sm text-slate-800">Tidak ada log error</p>
                    <p className="text-xs text-slate-500">Toko ini berjalan tanpa kendala runtime.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. REMOTE REMEDIATION WORKBENCH */}
          {activeTab === 'remediation' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Wrench size={18} className="text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-white">
                    Pusat Eksekusi Remediasi Jarak Jauh (Remote Actions)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Perintah ini dikirimkan langsung ke antrean instance kasir toko klien. Ketika tablet toko aktif atau terhubung, perintah dieksekusi secara otomatis di browser klien tanpa perlu kehadiran fisik staf di toko.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* ACTION 1: FORCE CACHE PURGE */}
                  <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        1. Paksa Pembersihan Cache & Resync
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Menghapus data sampah/cache browser yang korup dan menarik snapshot master data terbaru.
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
                      className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Zap size={14} />
                      <span>Kirim Perintah Purge Cache</span>
                    </button>
                  </div>

                  {/* ACTION 2: UNSTUCK BILLS */}
                  <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        2. Lepaskan Tagihan / Meja yang Macet
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Memperbaiki pesanan yang 'stuck' atau meja yang terkunci akibat browser crash saat checkout.
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
                      className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Wrench size={14} />
                      <span>Lepaskan Tagihan Nyangkut</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* REMOTE CONFIG PATCH FORM */}
              <form
                onSubmit={handleSaveConfigPatch}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs"
              >
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Patch Konfigurasi & Lisensi Klien
                    </h4>
                    <span className="text-xs text-slate-500">
                      Ubah paket, mode pemeliharaan darurat, atau aktifkan modul khusus dari jauh
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Terapkan Perubahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Paket Lisensi SaaS:
                    </label>
                    <select
                      value={patchTier}
                      onChange={(e) => setPatchTier(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white cursor-pointer"
                    >
                      <option value="starter">Paket Starter (Kios / Booth)</option>
                      <option value="pro">Paket Pro (Cafe / Resto)</option>
                      <option value="enterprise">Paket Enterprise (Multi-Cabang & Roastery)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Mode Pemeliharaan Darurat:
                    </label>
                    <select
                      value={patchMaintenance ? 'true' : 'false'}
                      onChange={(e) => setPatchMaintenance(e.target.value === 'true')}
                      className={`w-full p-2.5 rounded-xl border font-bold cursor-pointer ${
                        patchMaintenance
                          ? 'border-rose-400 bg-rose-50 text-rose-900'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <option value="false">Nonaktif (Operasional Berjalan Normal)</option>
                      <option value="true">AKTIF (Kunci Layar Kasir dengan Banner Pemeliharaan)</option>
                    </select>
                  </div>
                </div>

                {/* MODULAR FLAGS TOGGLES */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2 text-xs">
                    Aktifkan / Matikan Modul Granular:
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
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer"
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
                          className="rounded text-black"
                        />
                        <span className="font-medium text-[11px] text-slate-800 truncate">
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
            <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-900 shadow-xs">
                <Eye size={28} />
              </div>

              <div>
                <h3 className="font-black text-base text-slate-900">
                  Luncurkan Toko Klien dalam Shadow Inspector Mode
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Membuka instance website kasir klien dengan token verifikasi resmi Hallo Group. Anda dapat melihat persis tampilan kasir, denah meja, dan antrean KDS klien untuk mereproduksi masalah mereka secara langsung.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-lg mx-auto text-left space-y-1.5 text-xs font-mono">
                <div className="text-slate-400 text-[10px]">URL Akses Diagnostik:</div>
                <div className="font-bold text-slate-900 truncate">
                  {tenant.liveStoreUrl}?shadow_mode=true&tenant_id={tenant.id}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onLaunchShadowMode(tenant)}
                  className="py-3 px-6 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <ExternalLink size={15} />
                  <span>Buka Toko Klien Sekarang di Tab Baru</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="font-mono">
            Dibuat: {new Date(tenant.createdAt).toLocaleDateString('id-ID')} · Pembaruan: {new Date(tenant.updatedAt).toLocaleTimeString('id-ID')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
