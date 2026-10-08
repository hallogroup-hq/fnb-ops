'use client'

import React, { useState } from 'react'
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Tablet,
  Radio,
  Send,
  Zap,
} from 'lucide-react'
import type { ClientAppRolloutStatus, TenantStore } from '../types/fleet'

interface RolloutTabProps {
  rollouts: ClientAppRolloutStatus[]
  tenants: TenantStore[]
  onBroadcastRollout: (version: string, channel: 'production' | 'canary') => void
}

export default function RolloutTab({
  rollouts,
  tenants,
  onBroadcastRollout,
}: RolloutTabProps) {
  const [selectedVersion, setSelectedVersion] = useState('v2.5.0-prod')
  const [selectedChannel, setSelectedChannel] = useState<'production' | 'canary'>('production')
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  // Aggregate terminal versions from tenants
  const devices = tenants.flatMap((t) => t.latestTelemetry?.devices || [])
  const totalTerminals = devices.length
  const updatedTerminals = devices.filter((d) => d.appVersion === 'v2.5.0-prod').length
  const legacyTerminals = totalTerminals - updatedTerminals
  const globalAdoption = totalTerminals > 0 ? Math.round((updatedTerminals / totalTerminals) * 100) : 100

  function handleTriggerBroadcast() {
    setIsBroadcasting(true)
    setTimeout(() => {
      onBroadcastRollout(selectedVersion, selectedChannel)
      setIsBroadcasting(false)
      setFeedbackNotice(`Perintah OTA reload ${selectedVersion} disiarkan ke seluruh armada terminal kasir klien.`)
      setTimeout(() => setFeedbackNotice(null), 4000)
    }, 600)
  }

  return (
    <div className="space-y-4">
      {/* 1. ROLLOUT TELEMETRY STRIP */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Versi Rilis Terkini</span>
            <span className="font-mono text-[10px] text-zinc-400">VERSION</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
            v2.5.0-prod
          </div>
          <div className="text-[11px] text-emerald-700 font-mono">
            Saluran: Production
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Tingkat Adopsi Armada</span>
            <span className="font-mono text-[10px] text-zinc-400">ADOPTION</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
            {globalAdoption}%
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {updatedTerminals} dari {totalTerminals} terminal aktif
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Terminal Tertinggal (Legacy)</span>
            <span className="font-mono text-[10px] text-zinc-400">LEGACY</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-amber-700 font-mono tabular-nums">
            {legacyTerminals} Perangkat
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Memerlukan reload browser
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Saluran Rilis Aktif</span>
            <span className="font-mono text-[10px] text-zinc-400">CHANNELS</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums">
            2 Saluran
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Prod (Default) & Canary
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono rounded-md flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 2. BROADCAST OTA CONTROLLER */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-medium text-zinc-700">
            Target Rilis OTA:
          </span>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="p-1.5 rounded border border-zinc-200 text-xs font-mono bg-white cursor-pointer"
          >
            <option value="v2.5.0-prod">v2.5.0-prod (Production Stable)</option>
            <option value="v2.5.1-canary">v2.5.1-canary (Pre-release Patch)</option>
          </select>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as any)}
            className="p-1.5 rounded border border-zinc-200 text-xs font-medium bg-white cursor-pointer"
          >
            <option value="production">Saluran Production</option>
            <option value="canary">Saluran Canary</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleTriggerBroadcast}
          disabled={isBroadcasting}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <Zap size={13} className={isBroadcasting ? 'animate-spin' : ''} />
          <span>{isBroadcasting ? 'Memancarkan Sinyal...' : 'Siarkan Force-OTA Reload'}</span>
        </button>
      </div>

      {/* 3. RELEASE VERSIONS TABLE */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900">
              Katalog Versi & Distribusi Tablet Kasir
            </h3>
            <p className="text-[11px] text-zinc-500">
              Pelacakan versi build kode frontend kasir yang saat ini aktif di browser toko klien
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2 px-3">Versi Build</th>
                <th className="py-2 px-3">Saluran</th>
                <th className="py-2 px-3">Tanggal Rilis</th>
                <th className="py-2 px-3 text-right">Adopsi Terminal</th>
                <th className="py-2 px-3">Catatan Rilis</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
              {rollouts.map((r) => (
                <tr key={r.version} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-zinc-900">
                    {r.version}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                      {r.releaseChannel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">
                    {r.releaseDate}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {r.activeTerminalsCount} terminal ({r.adoptionPct}%)
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-zinc-600 font-mono">
                    {r.notes}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                        r.isLatest
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {r.isLatest ? 'LATEST ACTIVE' : 'SUPERSEDED'}
                    </span>
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
