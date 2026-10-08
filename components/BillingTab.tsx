'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  ExternalLink,
  Receipt,
  RotateCw,
  Search,
  Filter,
} from 'lucide-react'
import type {
  TenantStore,
  TenantInvoice,
  SaaSFinanceOverview,
  SubscriptionTier,
  BillingCycle,
  PaymentMethod,
} from '../types/fleet'

interface BillingTabProps {
  tenants: TenantStore[]
  invoices: TenantInvoice[]
  finance: SaaSFinanceOverview
  onExtendSubscription: (tenantId: string, days: number) => void
  onMarkInvoicePaid: (invoiceId: string, method?: PaymentMethod) => void
  onCreateInvoice: (data: any) => void
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export default function BillingTab({
  tenants,
  invoices,
  finance,
  onExtendSubscription,
  onMarkInvoicePaid,
  onCreateInvoice,
}: BillingTabProps) {
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form State for New Invoice
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || '')
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro')
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly')
  const [extraOutletsCount, setExtraOutletsCount] = useState<number>(0)
  const [invoiceFeedback, setInvoiceFeedback] = useState<string | null>(null)

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter !== 'all' && inv.status !== invoiceFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.tenantName.toLowerCase().includes(q) ||
        inv.planTier.toLowerCase().includes(q)
      )
    }
    return true
  })

  function handleCreateInvoiceSubmit(e: React.FormEvent) {
    e.preventDefault()
    const targetTenant = tenants.find((t) => t.id === selectedTenantId)
    if (!targetTenant) return

    const basePrice =
      selectedTier === 'enterprise'
        ? selectedCycle === 'annually'
          ? 19990000
          : 1999000
        : selectedTier === 'pro'
        ? selectedCycle === 'annually'
          ? 7990000
          : 799000
        : selectedCycle === 'annually'
        ? 2990000
        : 299000

    const extraOutletFee = extraOutletsCount * (selectedCycle === 'annually' ? 1500000 : 150000)
    const totalAmount = basePrice + extraOutletFee

    const items = [
      {
        description: `Paket ${selectedTier.toUpperCase()} (${selectedCycle === 'annually' ? 'Tahunan' : 'Bulanan'})`,
        quantity: 1,
        unitPrice: basePrice,
        subtotal: basePrice,
      },
    ]

    if (extraOutletsCount > 0) {
      items.push({
        description: `Add-on ${extraOutletsCount} Extra Cabang`,
        quantity: extraOutletsCount,
        unitPrice: selectedCycle === 'annually' ? 1500000 : 150000,
        subtotal: extraOutletFee,
      })
    }

    onCreateInvoice({
      tenantId: targetTenant.id,
      tenantName: targetTenant.name,
      planTier: selectedTier,
      billingCycle: selectedCycle,
      amount: totalAmount,
      status: 'pending',
      dueDate: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      paymentMethod: 'qris',
      items,
      notes: `Tagihan perpanjangan lisensi SaaS periode ${selectedCycle}.`,
    })

    setIsCreateModalOpen(false)
    setInvoiceFeedback(`Invoice untuk ${targetTenant.name} berhasil diterbitkan.`)
    setTimeout(() => setInvoiceFeedback(null), 4000)
  }

  function handleSendReminder(inv: TenantInvoice) {
    const tenant = tenants.find((t) => t.id === inv.tenantId)
    const phone = tenant?.ownerPhone?.replace(/[^0-9]/g, '') || '6281200000000'
    const message = encodeURIComponent(
      `Halo ${tenant?.ownerName || 'Kak'}, ini tim billing Hallo Group. Tagihan ${inv.invoiceNumber} sebesar ${formatRupiah(inv.amount)} untuk paket ${inv.planTier.toUpperCase()} jatuh tempo pada ${new Date(inv.dueDate).toLocaleDateString('id-ID')}. Terima kasih.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* 1. EXECUTIVE SAAS FINANCE RIBBON */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        {/* MRR */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>MRR (Monthly Recurring)</span>
            <span className="font-mono text-[10px] text-zinc-400">MRR</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums truncate">
            {formatRupiah(finance.mrr)}
          </div>
          <div className="text-[11px] text-emerald-700 font-mono">
            ARR: {formatRupiah(finance.arr)}
          </div>
        </div>

        {/* COLLECTED REVENUE */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Terkumpul Periode Ini</span>
            <span className="font-mono text-[10px] text-zinc-400">COLLECTED</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-emerald-700 font-mono tabular-nums truncate">
            {formatRupiah(finance.totalCollectedThisMonth)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Settlement Midtrans / VA
          </div>
        </div>

        {/* PENDING RECEIVABLES */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Piutang Menunggu Bayar</span>
            <span className="font-mono text-[10px] text-zinc-400">RECEIVABLES</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-amber-700 font-mono tabular-nums truncate">
            {formatRupiah(finance.pendingReceivables)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {invoices.filter((i) => i.status === 'pending').length} invoice aktif
          </div>
        </div>

        {/* OVERDUE */}
        <div className="p-3.5 space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Tagihan Jatuh Tempo (Overdue)</span>
            <span className="font-mono text-[10px] text-zinc-400">OVERDUE</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-rose-700 font-mono tabular-nums truncate">
            {formatRupiah(finance.overdueAmount)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {invoices.filter((i) => i.status === 'overdue').length > 0 ? (
              <span className="text-rose-600 font-medium">Perlu penagihan segera</span>
            ) : (
              <span>0 tunggakan</span>
            )}
          </div>
        </div>

        {/* ARPU & CONTRACTS */}
        <div className="p-3.5 space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Rata-Rata per Klien (ARPU)</span>
            <span className="font-mono text-[10px] text-zinc-400">ARPU</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-zinc-950 font-mono tabular-nums truncate">
            {formatRupiah(finance.arpu)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {finance.activeSubscriptionsCount} langganan aktif
          </div>
        </div>
      </div>

      {/* FEEDBACK NOTICE */}
      {invoiceFeedback && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono rounded-md flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{invoiceFeedback}</span>
        </div>
      )}

      {/* 2. CLIENT PACKAGE & SUBSCRIPTION MONITORING */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-xs font-semibold text-zinc-900">
              Monitoring Paket Langganan & Masa Aktif Klien
            </h2>
            <p className="text-[11px] text-zinc-500">
              Pelacakan kontrak lisensi, siklus penagihan, status pembayaran, dan perpanjangan otomatis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Terbitkan Invoice Baru</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2 px-3">Toko / Tenant</th>
                <th className="py-2 px-3">Paket & Siklus</th>
                <th className="py-2 px-3 text-right">Tarif / Periode</th>
                <th className="py-2 px-3">Masa Berlaku</th>
                <th className="py-2 px-3 text-center">Status Billing</th>
                <th className="py-2 px-3 text-right">Total Terbayar (LTV)</th>
                <th className="py-2 px-3 text-right">Aksi Penagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
              {tenants.map((t) => {
                const daysLeft = Math.ceil(
                  (t.subscriptionValidUntil - Date.now()) / (1000 * 60 * 60 * 24)
                )
                const isOverdue = daysLeft <= 0
                const isExpiringSoon = daysLeft > 0 && daysLeft <= 14

                return (
                  <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* TENANT */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-zinc-900 leading-tight">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {t.ownerName} · {t.ownerPhone}
                      </div>
                    </td>

                    {/* TIER & CYCLE */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-800">
                          {t.subscriptionTier}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {t.billingCycle === 'annually' ? '1 Tahun' : '1 Bulan'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {t.autoRenew ? 'Auto-Renew: Aktif' : 'Manual Renewal'}
                      </div>
                    </td>

                    {/* MONTHLY FEE */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <div className="font-medium text-zinc-900">
                        {formatRupiah(t.monthlyFee || (t.subscriptionTier === 'enterprise' ? 1999000 : 799000))}
                      </div>
                      <div className="text-[10px] text-zinc-400">/ bulan</div>
                    </td>

                    {/* EXPIRY COUNTDOWN */}
                    <td className="py-2.5 px-3 font-mono">
                      <div
                        className={`text-xs font-medium ${
                          isOverdue
                            ? 'text-rose-700 font-semibold'
                            : isExpiringSoon
                            ? 'text-amber-700'
                            : 'text-zinc-800'
                        }`}
                      >
                        {isOverdue ? `Expired (${Math.abs(daysLeft)}h lalu)` : `${daysLeft} hari lagi`}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        s/d {new Date(t.subscriptionValidUntil).toLocaleDateString('id-ID')}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                          t.billingStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.billingStatus === 'trial'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : t.billingStatus === 'past_due'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {t.billingStatus.toUpperCase()}
                      </span>
                    </td>

                    {/* LTV */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <div className="font-medium text-zinc-900">
                        {formatRupiah(t.lifetimePaid || 0)}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onExtendSubscription(t.id, 30)}
                          className="px-2 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Perpanjang masa aktif +30 hari"
                        >
                          +30 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTenantId(t.id)
                            setSelectedTier(t.subscriptionTier)
                            setSelectedCycle(t.billingCycle || 'monthly')
                            setIsCreateModalOpen(true)
                          }}
                          className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
                          title="Terbitkan faktur pembayaran baru"
                        >
                          Buat Faktur
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. INVOICES & PAYMENT TRANSACTIONS LEDGER */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-50/50">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900">
              Riwayat Faktur & Pembelian Paket Klien ({filteredInvoices.length} Faktur)
            </h3>
            <p className="text-[11px] text-zinc-500">
              Daftar seluruh transaksi perpanjangan lisensi, upgrade paket, dan add-on fitur
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* SEARCH */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. faktur / tenant..."
                className="pl-7 pr-2.5 py-1 rounded border border-zinc-200 text-xs font-normal focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* FILTER CHIPS */}
            <div className="flex items-center gap-1">
              {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInvoiceFilter(st)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    invoiceFilter === st
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {st === 'all'
                    ? 'Semua'
                    : st === 'paid'
                    ? 'Lunas'
                    : st === 'pending'
                    ? 'Menunggu'
                    : 'Overdue'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2 px-3">No. Faktur & Tanggal</th>
                <th className="py-2 px-3">Toko Klien</th>
                <th className="py-2 px-3">Rincian Paket & Add-on</th>
                <th className="py-2 px-3 text-right">Nominal</th>
                <th className="py-2 px-3">Metode Bayar</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/70 transition-colors">
                  {/* INVOICE NUMBER */}
                  <td className="py-2.5 px-3 font-mono">
                    <div className="font-semibold text-zinc-900">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-zinc-400">
                      Terbit: {new Date(inv.issuedAt).toLocaleDateString('id-ID')}
                    </div>
                  </td>

                  {/* TENANT */}
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-zinc-900">{inv.tenantName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{inv.tenantId}</div>
                  </td>

                  {/* ITEMS */}
                  <td className="py-2.5 px-3">
                    <div className="text-[11px] text-zinc-700">
                      {inv.items.map((it) => it.description).join(' + ')}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-zinc-950">
                    {formatRupiah(inv.amount)}
                  </td>

                  {/* METHOD */}
                  <td className="py-2.5 px-3 font-mono text-[11px] uppercase text-zinc-600">
                    {inv.paymentMethod?.replace('_', ' ') || 'QRIS B2B'}
                  </td>

                  {/* STATUS */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status !== 'paid' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onMarkInvoicePaid(inv.id, 'va_bca')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                            title="Tandai lunas manual (Settlement Bank)"
                          >
                            Tandai Lunas
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReminder(inv)}
                            className="p-1 rounded bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 text-[11px] transition-colors cursor-pointer"
                            title="Kirim pengingat WhatsApp ke pemilik"
                          >
                            <Send size={12} />
                          </button>
                        </>
                      )}
                      {inv.status === 'paid' && (
                        <span className="text-[10px] font-mono text-zinc-400">
                          Lunas {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('id-ID') : ''}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">
                    Tidak ada faktur yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL CREATE NEW INVOICE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-lg border border-zinc-200 shadow-xl overflow-hidden space-y-4 p-5">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-zinc-950">
                Terbitkan Faktur Pembelian Paket SaaS
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800 text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-zinc-800 block mb-1">
                  Pilih Klien / Tenant:
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-200 bg-white cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subscriptionTier.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-zinc-800 block mb-1">
                    Pilihan Paket:
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as any)}
                    className="w-full p-2 rounded border border-zinc-200 bg-white cursor-pointer"
                  >
                    <option value="starter">Starter (Rp 299rb)</option>
                    <option value="pro">Pro (Rp 799rb)</option>
                    <option value="enterprise">Enterprise (Rp 1.999rb)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-zinc-800 block mb-1">
                    Siklus Penagihan:
                  </label>
                  <select
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(e.target.value as any)}
                    className="w-full p-2 rounded border border-zinc-200 bg-white cursor-pointer"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="annually">Tahunan (Diskon 2 Bulan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-800 block mb-1">
                  Add-on Cabang Tambahan (+Rp 150rb/bln):
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={extraOutletsCount}
                  onChange={(e) => setExtraOutletsCount(parseInt(e.target.value) || 0)}
                  className="w-full p-2 rounded border border-zinc-200"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="text-[11px] font-mono text-zinc-500">
                  Jatuh tempo default 7 hari
                </div>
                <button
                  type="submit"
                  className="py-1.5 px-3.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Generate Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
