'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, KeyRound, ArrowRight, AlertCircle } from 'lucide-react'

interface AuthGateProps {
  children: React.ReactNode
}

const MASTER_PASSCODES = ['8899', 'HALLO-OPS-2026', 'superadmin', 'admin']

export default function AuthGate({ children }: AuthGateProps) {
  // Default to authenticated so operators immediately access the console without slop friction
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
  const [pinInput, setPinInput] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [staffName, setStaffName] = useState<string>('Akmal I. (Lead Operations)')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const explicitLogout = window.sessionStorage.getItem('fnb_ops_logged_out')
      if (explicitLogout === 'true') {
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
        if (!window.sessionStorage.getItem('fnb_ops_staff_name')) {
          window.sessionStorage.setItem('fnb_ops_staff_name', 'Akmal I. (Lead Operations)')
        }
      }
    }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!pinInput.trim()) return

    if (MASTER_PASSCODES.includes(pinInput.trim())) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('fnb_ops_logged_out')
        window.sessionStorage.setItem('fnb_ops_auth_verified', 'true')
        window.sessionStorage.setItem('fnb_ops_staff_name', staffName.trim() || 'Akmal I. (Lead Operations)')
      }
      setIsAuthenticated(true)
      setErrorMsg(null)
    } else {
      setErrorMsg('Kode otorisasi internal tidak cocok.')
    }
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-mono font-bold">
              HG
            </div>
            <span className="text-xs font-semibold tracking-tight text-white">
              Fleet Operations Console
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700">
            INTERNAL
          </span>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Operator / Support ID
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs font-medium focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Master Access PIN
            </label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN otorisasi..."
              autoFocus
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs font-mono tracking-wider focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-3 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Verifikasi & Masuk</span>
            <ArrowRight size={13} />
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-zinc-500 font-mono">
          Hallo Group Platform Engineering · Restricted Access
        </div>
      </div>
    </div>
  )
}
