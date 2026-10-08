import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nusantara Fleet Ops | Hallo Group Internal Platform Console',
  description: 'Internal operations, multi-tenant diagnostics, live telemetry & remote remediation console for Hallo Group F&B SaaS platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F8F9FA] text-[#0F172A] antialiased">
        {children}
      </body>
    </html>
  )
}
