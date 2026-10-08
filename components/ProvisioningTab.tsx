'use client'

import React, { useState } from 'react'
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  Sparkles,
  Store,
  Phone,
  Mail,
  FileText,
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
    <div className="space-y-8">
      {/* 1. SELF-REGISTRATION APPROVAL QUEUE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-slate-900">
                Antrean Pendaftaran Mandiri (Landing Page Inbound)
              </h2>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendingRequests.length} MENUNGGU PERSETUJUAN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calon klien yang mendaftar via landing page sales & marketing Hallo Group
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900">
                      {req.storeName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 font-bold uppercase">
                      Paket {req.requestedTier} ({req.requestedOutlets} Cabang)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {Math.max(1, Math.floor((Date.now() - req.submittedAt) / 60000))} mnt lalu
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                    <span>Pemilik: <strong>{req.ownerName}</strong></span>
                    <span>·</span>
                    <span>WA: {req.ownerPhone}</span>
                    <span>·</span>
                    <span>Email: {req.ownerEmail}</span>
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      "{req.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRejectRequest(req.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tolak
                  </button>

                  <button
                    type="button"
                    onClick={() => onApproveRequest(req.id)}
                    className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    Setujui & Terbitkan Toko
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
              <p className="font-bold text-sm text-slate-700">Semua pendaftaran telah diproses</p>
              <p className="text-xs text-slate-500">Tidak ada permohonan baru yang menunggu verifikasi saat ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. MANUAL PROVISIONING FORM */}
      <form
        onSubmit={handleManualSubmit}
        className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-extrabold text-sm text-slate-900">
            Formulir Provisioning Klien Baru (Pendaftaran Manual)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan formulir ini untuk membuat instance toko F&B langsung dari tim internal Hallo Group
          </p>
        </div>

        {formSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Nama Usaha / Merek Resto: *
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: Kopi Harapan Bangsa"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Nama Entitas Legal (PT / CV):
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Contoh: PT Harapan Rasa Kuliner"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Nama Pemilik / Contact Person: *
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Contoh: Ibu Rina Sasmita"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Nomor WhatsApp Pemilik: *
            </label>
            <input
              type="text"
              required
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+62 812-XXXX-XXXX"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Alamat Email Pemilik:
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@resto.id"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Paket Lisensi SaaS:
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white cursor-pointer"
            >
              <option value="starter">Starter (Kios / Booth - POS Dasar)</option>
              <option value="pro">Pro (Cafe / Resto - Meja & KDS)</option>
              <option value="enterprise">Enterprise (Multi-Cabang, Roastery, SAK EMKM)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Alokasi Kuota Cabang:
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={outletsCount}
              onChange={(e) => setOutletsCount(Number(e.target.value) || 1)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="py-3 px-6 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            + Terbitkan & Aktifkan Instance Toko
          </button>
        </div>
      </form>
    </div>
  )
}
