# BizPilot AI 🚀

**AI-powered MSME Business Operating System for Indonesian SMEs**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-8b5cf6?logo=google)](https://deepmind.google/technologies/gemini/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange?logo=googlechrome)](https://web.dev/progressive-web-apps/)
[![Cloud Run](https://img.shields.io/badge/Cloud%20Run-Ready-4285f4?logo=googlecloud)](https://cloud.google.com/run)

---

## 🚀 Live Demo

- 🌐 Live Application: [BizPilot AI](https://bizpilot-ai-483259123956.asia-southeast2.run.app)
- 📦 GitHub Repository: [BizPilot-AI](https://github.com/ch-fitra/BizPilot-AI)

---

## 🔴 Problem Statement

Banyak UMKM Indonesia menghadapi tantangan operasional yang serius:

| Masalah | Dampak |
|---------|--------|
| Data penjualan, stok, pelanggan tersebar di berbagai tempat | Owner tidak punya gambaran bisnis yang utuh |
| Laporan masih manual (Excel/kertas) | Butuh waktu lama, sering terlambat, tidak akurat |
| Follow-up pelanggan sering terlewat | Kehilangan potensi penjualan ulang |
| Stok kritis baru diketahui setelah kehabisan | Kehilangan omzet dan kepercayaan pelanggan |
| Keputusan bisnis berdasarkan intuisi, bukan data | Risiko salah strategi dan pemborosan |
| Tidak ada alert otomatis untuk risiko bisnis | Masalah baru diketahui setelah terlanjur parah |

**BizPilot AI hadir sebagai solusi: satu sistem operasi bisnis berbasis AI yang menyatukan semua data dan keputusan bisnis UMKM.**

---

## ✅ Solution

BizPilot AI adalah **AI-powered Business Operating System** yang dirancang khusus untuk UMKM Indonesia:

- 🤖 **AI Business Analyzer** — Upload foto struk, CSV, atau ketik data manual. Dapatkan analisis mendalam dari Gemini AI.
- 📊 **Business Dashboard** — Health score, alerts prioritas, trend penjualan, dan top produk dalam satu layar.
- 🔮 **Forecasting & Risk AI** — Proyeksi revenue, risk radar, dan deteksi stockout sebelum terjadi.
- 👥 **CRM & Sales Pipeline** — Kelola leads, pipeline penjualan, dan follow-up overdue.
- 📱 **WhatsApp Automation** — Kirim pesan follow-up, notifikasi stok, dan promosi otomatis via WhatsApp.
- 💬 **AI Business Chat** — Tanya AI tentang prioritas bisnis hari ini, strategi, atau analisis custom.
- 📄 **Reports PDF/CSV** — Ekspor laporan bisnis profesional kapan saja.
- 🏢 **Multi-Tenant SaaS** — Satu platform, banyak workspace bisnis dengan isolasi data penuh.
- 📶 **PWA + Offline Mode** — Bisa diinstal dan bekerja saat internet tidak stabil.
- 🎯 **Judge Demo Mode** — Mode presentasi dengan data dummy siap pakai untuk demo cepat.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                  │
│  React 19 · TypeScript · Vite · Tailwind CSS · Recharts │
│  PWA (Service Worker · Offline Page · Web Manifest)      │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JWT Auth)
┌────────────────────────▼────────────────────────────────┐
│                   BACKEND (Node.js/Express)              │
│  Express Router · Auth Middleware · Tenant Middleware    │
│  Repository Pattern · Error Handler · Request Logger     │
│  Env Validator · Security Scanner                        │
└──────────┬────────────────────────────┬─────────────────┘
           │                            │
┌──────────▼──────────┐    ┌────────────▼────────────────┐
│   Google Gemini AI  │    │   Database Layer             │
│   (via Backend)     │    │   Supabase/PostgreSQL        │
│   Guardrail +       │    │   OR Local JSON Fallback     │
│   Context Builder   │    │   (auto-detect at startup)   │
└─────────────────────┘    └─────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    DEPLOYMENT                            │
│  Docker · Google Cloud Run · HTTPS · Health Check       │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4 |
| **UI Components** | Lucide React, Motion (Framer), custom design system |
| **Charts** | Recharts + custom visualization |
| **Backend** | Node.js 20, Express 4, TypeScript |
| **AI Engine** | Google Gemini API (via backend, key never exposed to client) |
| **Database** | Supabase/PostgreSQL (primary) · Local JSON (fallback) |
| **Auth** | JWT, bcryptjs, multi-tenant session |
| **Export** | jsPDF, html2canvas, CSV native |
| **PWA** | Service Worker, Web Manifest, Offline Page |
| **Deployment** | Docker, Google Cloud Run |
| **Security** | Env validator, secret scanner, tenant isolation, RBAC |

---

## 🎯 Key Features

### 🤖 AI Business Analyzer
- Upload gambar, CSV, atau input teks manual
- Analisis Gemini AI: health score, strengths, risks, alerts
- Sales trend 7 hari, top products, customer review summary
- Action plan prioritas berbasis AI

### 📊 Business Dashboard
- Health score visual
- Inventory alerts real-time
- Sales & revenue trend chart
- Top product performance

### 📈 Analysis History
- Riwayat semua analisis tersimpan
- Bisa dibuka ulang dan dibandingkan

### 🔮 Forecasting & Risk AI
- Revenue projection 30/60/90 hari
- Stockout risk detection
- Risk radar chart
- Scenario planning

### 👥 CRM & Sales Pipeline
- Lead management (Hot/Warm/Cold)
- Pipeline Kanban view
- Follow-up overdue alerts
- Search & filter leads

### 📱 WhatsApp Automation
- Template pesan otomatis
- Trigger: stok kritis, follow-up overdue, promo
- Simulation mode (tanpa API key)
- AI-generated message content

### 💬 AI Business Chat
- Chat dengan AI yang mengenal bisnis Anda
- Context: profile, history, CRM, forecast
- Guardrail anti-hallucination
- Memori sesi bisnis

### 📄 Reports PDF/CSV
- Laporan bisnis lengkap
- Ekspor PDF dan CSV
- Preview sebelum ekspor

### 🏢 Multi-Tenant Workspace
- Banyak workspace per user
- Isolasi data antar tenant
- RBAC: Owner/Admin/Staff/Viewer

### 📶 PWA + Offline Mode
- Install seperti aplikasi native
- Offline banner & offline page
- Cache app shell

### 🎯 Judge Demo Mode
- Seed data dummy per skenario
- Skenario: Kedai Kopi, Laundry, Fashion UMKM, Warung Makan
- Guided demo overlay
- Reset tanpa merusak data lain

### 🔐 Security & Fallback
- JWT auth dengan tenant isolation
- Automatic fallback: AI/WhatsApp/Storage
- Secret scanner built-in
- `/api/system/security-status` endpoint

---

## 🎬 Demo Mode — Untuk Juri

**Cara cepat memulai demo:**

1. Buka aplikasi dan login/register
2. Klik tombol **"Start Judge Demo"** (floating button di dashboard)
3. Pilih skenario bisnis:
   - ☕ **Kedai Kopi** — F&B cafe dengan data penjualan dan inventory
   - 👔 **Laundry** — Jasa laundry dengan CRM dan notifikasi
   - 👗 **Fashion UMKM** — Toko fashion dengan leads pipeline
   - 🍜 **Warung Makan** — Warung dengan risiko stok dan forecasting
4. Data dummy langsung ter-seed ke workspace aktif
5. Ikuti guided overlay untuk tour semua fitur

> **Catatan:** Demo mode aman — hanya mengisi workspace aktif Anda, tidak menyentuh tenant lain.

Lihat panduan lengkap di [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md).

---

## 📸 Screenshots

| Feature | Preview |
|---------|---------|
| Overview Dashboard | `docs/screenshots/overview.png` |
| AI Analyzer | `docs/screenshots/ai_analyzer.png` |
| Forecasting | `docs/screenshots/forecasting.png` |
| CRM Pipeline | `docs/screenshots/crm.png` |
| WhatsApp Automation | `docs/screenshots/whatsapp.png` |
| AI Business Chat | `docs/screenshots/ai_chat.png` |
| Reports | `docs/screenshots/reports.png` |
| Judge Demo Mode | `docs/screenshots/judge_demo.png` |
| PWA Install | `docs/screenshots/pwa.png` |

> Screenshots dapat ditambahkan ke folder `docs/screenshots/`. Jalankan aplikasi untuk melihat tampilan langsung.

---

## ⚡ Local Setup

```bash
# 1. Clone repository
git clone https://github.com/ch-fitra/BizPilot-AI.git
cd BizPilot-AI

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env — isi minimal GEMINI_API_KEY dan JWT_SECRET

# 4. Run development server
npm run dev
# Buka http://localhost:3000

# 5. (Optional) Production build
npm run build
npm run start
```

**Fallback Mode** — Jika env belum lengkap, aplikasi tetap berjalan:
- Tanpa `GEMINI_API_KEY` → **AI Disabled mode** (analisis tidak tersedia)
- Tanpa Supabase keys → **Local JSON Storage mode** (data tersimpan di file lokal)
- Tanpa WhatsApp keys → **Simulation mode** (pesan tidak dikirim, hanya ditampilkan)

---

## 🔐 Environment Variables

| Variable | Keterangan | Wajib |
|----------|-----------|-------|
| `GEMINI_API_KEY` | Google Gemini API key untuk fitur AI | Opsional (AI Disabled jika kosong) |
| `JWT_SECRET` | Secret JWT auth, minimal 32 karakter random | Disarankan untuk production |
| `APP_URL` | URL publik aplikasi | Opsional |
| `SUPABASE_URL` | URL project Supabase | Opsional (Local JSON jika kosong) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase | Opsional |
| `VITE_SUPABASE_URL` | Supabase URL untuk frontend client | Opsional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key untuk frontend | Opsional |
| `WHATSAPP_API_URL` | Endpoint WhatsApp provider (Fonnte) | Opsional (Simulation jika kosong) |
| `WHATSAPP_API_TOKEN` | Token WhatsApp provider | Opsional |
| `WHATSAPP_PHONE_NUMBER` | Nomor pengirim WhatsApp | Opsional |
| `PORT` | Port server (default: 8080) | Opsional |

> ⚠️ **Jangan pernah commit file `.env` ke Git.** Gunakan `.env.example` sebagai template.

---

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t bizpilot-ai .

# Run container
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  bizpilot-ai
```

### Google Cloud Run

```bash
# Build & push ke Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/bizpilot-ai

# Deploy ke Cloud Run
gcloud run deploy bizpilot-ai \
  --image gcr.io/YOUR_PROJECT/bizpilot-ai \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=...,JWT_SECRET=...

# Verify health
curl https://YOUR_URL/api/health
```

### Supabase Database Setup

```bash
# Jalankan migrasi di Supabase SQL Editor
# File: supabase/migrations/001_initial_bizpilot_schema.sql
```

Lihat panduan lengkap di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 🔧 Quality Scripts

```bash
npm run lint          # TypeScript type check
npm run typecheck     # TypeScript type check (alias)
npm run build         # Production build (Vite + esbuild server)
npm run security:scan # Secret & env safety scan
npm run qa:check      # Full QA: lint + typecheck + build + security scan
npm run analyze       # Bundle analysis → dist/stats.html
```

### Health Endpoints

| Endpoint | Keterangan |
|----------|-----------|
| `GET /api/health` | Server health check |
| `GET /api/system/security-status` | Mode AI/WhatsApp/Storage saat ini |
| `GET /api/system/pwa-status` | PWA & offline support status |

---

## 🗺️ Roadmap

- [ ] **Payment Integration** — Midtrans/Xendit untuk subscription SaaS
- [ ] **WhatsApp Cloud API** — Integrasi webhook resmi Meta WhatsApp Business
- [ ] **POS Integration** — Sinkronisasi dengan sistem kasir populer
- [ ] **Marketplace Sync** — Tokopedia/Shopee order sync
- [ ] **Advanced Forecasting** — ML model untuk prediksi lebih akurat
- [ ] **Mobile App** — React Native wrapper atau Capacitor
- [ ] **Multi-language** — Dukungan bahasa Inggris penuh
- [ ] **Audit Log** — Log lengkap semua aksi user per tenant

---

## 📋 Documentation

| Dokumen | Deskripsi |
|---------|----------|
| [DEMO_GUIDE.md](docs/DEMO_GUIDE.md) | Panduan demo untuk juri — script 5 menit |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Panduan deployment Docker & Cloud Run |
| [SECURITY.md](docs/SECURITY.md) | Secret handling, tenant isolation, RBAC |
| [PERFORMANCE.md](docs/PERFORMANCE.md) | Bundle optimization, lazy loading, PWA cache |
| [PITCH_SCRIPT.md](docs/PITCH_SCRIPT.md) | Script pitch 3 menit untuk presentasi |
| [FINAL_CHECKLIST.md](docs/FINAL_CHECKLIST.md) | Checklist final sebelum submit |

---

## 👨‍💻 Creator

Built and developed independently by **[Chairul Fitra Ramadhan](https://github.com/ch-fitra)**.

*Independent Developer | AI Engineer | Builder of BizPilot AI*

Powered by:
- 🤖 [Google Gemini AI](https://deepmind.google/technologies/gemini/) — Intelligence layer
- 🗄️ [Supabase](https://supabase.com/) — Database & auth infrastructure
- ⚛️ [React](https://react.dev/) — UI framework
- ☁️ [Google Cloud Run](https://cloud.google.com/run) — Serverless deployment

---

*BizPilot AI — Empowering Indonesian UMKM with AI-driven business intelligence.*
