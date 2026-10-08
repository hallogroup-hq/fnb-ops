# Nusantara Fleet Ops (`fnb-ops`) - Hallo Group SaaS Control Plane

Enterprise-grade Multi-Tenant Fleet Operations, Deep Diagnostics, Live Telemetry & Remote Remediation Console for Hallo Group F&B SaaS platform (`fnb-erp`).

---

## 🚀 Overview

`fnb-ops` is the dedicated internal operations platform for Hallo Group engineering and support staff. It enables full remote visibility and control over all client stores without requiring on-site visits:

- **Fleet Health & SLA Monitoring**: Real-time status across all client stores (`healthy`, `warning`, `critical`, `offline`).
- **Deep Hardware & Device Telemetry**:
  - Live cashier tablet OS, browser, screen size, battery level, network latency.
  - Thermal ESC/POS printer status (Bluetooth, USB, Network LAN, Paper status sensor).
- **Storage & Database Health**:
  - Browser LocalStorage / IndexedDB quota usage and integrity verification.
  - Offline un-synced dirty transaction queue detection (identifies stuck checkout bills).
- **Live Error Log Stream & Stack Traces**:
  - Intercepts uncaught runtime errors from client stores with structured JSON context.
- **Remote Remediation Workbench**:
  - **Force Cache & State Resync**: Remote command to purge corrupted client cache.
  - **Unstuck Broken Order / Clear Ghost Bill**: Force release locked tables or checkout locks.
  - **Emergency Maintenance Mode Toggle**: Remotely lock client POS with a support notice.
  - **Remote Config & License Patch**: Remotely modify SaaS tiers, active modules, or tax rates.
- **1-Click Shadow Mode**: Tokenized URL generation to launch client store in isolated inspector mode.
- **Dual Provisioning**:
  - Manual store provisioning by internal staff.
  - Self-registration approval queue for inbound marketing leads.
- **Immutable Audit Trail**: Full log of internal staff actions.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Security**: Internal Auth Gate with Master Passcode

---

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Run development server on port 3034
npm run dev

# Build for production
npm run build
npm run start
```

---

## 📄 License
Private & Proprietary - Hallo Group. All rights reserved.
