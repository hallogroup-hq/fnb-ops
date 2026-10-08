'use client'

import React, { useState } from 'react'
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react'
import type { ProvisioningRequest, TenantStore } from '../types/fleet'

interface ProvisioningTabProps {
  requests: ProvisioningRequest[]
  onApproveRequest: (requestId: string) => void
  onRejectRequest: (requestId: string, reason?: string) => void
  onCreateTenant: (newTenant: Partial<TenantStore>) => void
}

export default function ProvisioningTab({
  requests,
  onApproveRequest,
  onRejectRequest,
  onCreateTenant,
}: ProvisioningTabProps) {
  // FORM STATE
  const [storeName, setStoreName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [tier, setTier] = useState<'starter' | 'pro' | 'enterprise'>('pro')
  const [outletsCount, setOutletsCount] = useState<number>(2)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const pendingRequests = requests.filter((r) => r.status === 'pending_review')

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!storeName.trim() || !ownerName.trim()) return

    const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const tenantId = `org-${slug}-${Date.now().toString(36).slice(-4)}`

    onCreateTenant({
      id: tenantId,
      slug,
      name: storeName.trim(),
      legalName: legalName.trim() || storeName.trim(),
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim() || '+62 812-0000-0000',
      ownerEmail: ownerEmail.trim() || 'owner@resto.id',
      subscriptionTier: tier,
      billingStatus: 'active',
      subscriptionValidUntil: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
      maxOutlets: outletsCount,
      maxTerminals: outletsCount * 2,
    })

    setFormSuccess(`Instance toko "${storeName}" berhasil didaftarkan dan diaktifkan.`)
    setStoreName('')
    setLegalName('')
    setOwnerName('')
    setOwnerPhone('')
    setOwnerEmail('')

    setTimeout(() => {
      setFormSuccess(null)
    }, 4000)
  }

  return (
    <div className="space-y-4">
      {/* 1. SELF-REGISTRATION APPROVAL QUEUE */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-xs text-zinc-900">
                Antrean Pendaftaran Mandiri (Inbound Onboarding)
              </h2>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {pendingRequests.length} PENDING
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Permohonan lisensi baru yang masuk melalui landing page atau formulir penjualan
            </p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900">
                      {req.storeName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 font-medium uppercase text-zinc-700">
                      Paket {req.requestedTier} ({req.requestedOutlets} Cabang)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {Math.max(1, Math.floor((Date.now() - req.submittedAt) / 60000))} mnt lalu
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-600 flex items-center gap-2 flex-wrap">
                    <span>Pemilik: {req.ownerName}</span>
                    <span>·</span>
                    <span>WA: {req.ownerPhone}</span>
                    <span>·</span>
                    <span>Email: {req.ownerEmail}</span>
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-zinc-500 italic bg-zinc-50 p-1.5 rounded border border-zinc-100 font-mono">
                      "{req.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRejectRequest(req.id)}
                    className="px-2.5 py-1.5 rounded border border-zinc-200 hover:border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Tolak
                  </button>

                  <button
                    type="button"
                    onClick={() => onApproveRequest(req.id)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Setujui & Buat Tenant
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-zinc-400">
              <CheckCircle2 size={20} className="mx-auto mb-1 text-emerald-600" />
              <p className="font-medium text-xs text-zinc-700">Semua pendaftaran telah diproses</p>
              <p className="text-[11px] text-zinc-500">Tidak ada antrean tertunda saat ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. MANUAL PROVISIONING FORM */}
      <form
        onSubmit={handleManualSubmit}
        className="bg-white rounded-lg border border-zinc-200 p-4 space-y-4"
      >
        <div className="border-b border-zinc-100 pb-2.5">
          <h2 className="font-semibold text-xs text-zinc-900">
            Formulir Pembuatan Tenant Baru (Manual Provisioning)
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Daftarkan instance toko F&B langsung dari tim internal Hallo Group
          </p>
        </div>

        {formSuccess && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-medium text-zinc-800 block mb-1">
              Nama Usaha / Merek Resto: *
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: Kopi Harapan Bangsa"
              className="w-full px-2.5 py-1.5 rounded border border-zinc-200 font-normal focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="font-medium text-zinc-800 block mb-1">
              Nama Entitas Legal (PT / CV):
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Contoh: PT Harapan Rasa Kuliner"
              className="w-full px-2.5 py-1.5 rounded border border-zinc-200 font-normal focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="font-medium text-zinc-800 block mb-1">
              Nama Pemilik / Pengelola: *
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Contoh: Ibu Rina Sasmita"
              className="w-full px-2.5 py-1.5 rounded border border-zinc-200 font-normal focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="font-medium text-zinc-800 block mb-1">
              Nomor WhatsApp Pemilik: *
            </label>
            <input
              type="text"
              required
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+62 812-XXXX-XXXX"
              className="w-full px-2.5 py-1.5 rounded border border-zinc-200 font-normal focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="font-medium text-zinc-800 block mb-1">
              Alamat Email Pemilik:
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@resto.id"
              className="w-full px-2.5 py-1.5 rounded border border-zinc-200 font-normal focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="font-medium text-zinc-800 block mb-1">
              Paket Lisensi Awal:
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded border border-zinc-200 font-normal bg-white cursor-pointer"
            >
              <option value="starter">Paket Starter (1-2 Outlet / Kios)</option>
              <option value="pro">Paket Pro (Multi-Outlet & KDS)</option>
              <option value="enterprise">Paket Enterprise (Roastery & Full ERP)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="py-1.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Terbitkan Instance Tenant
          </button>
        </div>
      </form>
    </div>
  )
}
