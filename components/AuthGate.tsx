'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound, Building2 } from 'lucide-react'

interface AuthGateProps {
  children: React.ReactNode
}

const MASTER_PASSCODES = ['8899', 'HALLO-OPS-2026', 'superadmin']

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [pinInput, setPinInput] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [staffName, setStaffName] = useState<string>('Staff Operasional')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = window.sessionStorage.getItem('fnb_ops_auth_verified')
      if (savedAuth === 'true') {
        setIsAuthenticated(true)
      }
    }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!pinInput.trim()) return

    if (MASTER_PASSCODES.includes(pinInput.trim())) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('fnb_ops_auth_verified', 'true')
        window.sessionStorage.setItem('fnb_ops_staff_name', staffName.trim() || 'Staff Hallo Group')
      }
      setIsAuthenticated(true)
      setErrorMsg(null)
    } else {
      setErrorMsg('Kode otorisasi internal salah. Gunakan Master PIN resmi Hallo Group.')
    }
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F172A] text-white">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Hallo Group Internal Console
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white pt-1">
            Nusantara Fleet Ops
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pusat komando telemetri armada, diagnostik mendalam, dan remediasi jarak jauh toko klien SaaS F&B.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nama Staf / Support:
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Contoh: Akmal (Lead Ops)"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Master Passcode / PIN Otorisasi:
            </label>
            <div className="relative">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN atau Passcode Staf"
                autoFocus
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
              Default demo: <code className="text-emerald-400 font-bold">8899</code> atau <code className="text-emerald-400 font-bold">HALLO-OPS-2026</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-tight flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <span>Buka Fleet Console</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center">
          <div className="text-[11px] text-slate-500 font-medium">
            Akses dibatasi khusus staf rekayasa perangkat lunak dan operasional Hallo Group. Seluruh tindakan direkam pada audit log.
          </div>
        </div>
      </div>
    </div>
  )
}
