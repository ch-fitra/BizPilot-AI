# BizPilot AI

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

## ðŸš€ Live Demo

- ðŸŒ Live Application: [BizPilot AI](https://bizpilot-ai-483259123956.asia-southeast2.run.app)
- ðŸ“¦ GitHub Repository: [BizPilot-AI](https://github.com/ch-fitra/BizPilot-AI)

---

## ðŸ”´ Problem Statement

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

## âœ… Solution

BizPilot AI adalah **AI-powered Business Operating System** yang dirancang khusus untuk UMKM Indonesia:

- ðŸ¤– **AI Business Analyzer** â€” Upload foto struk, CSV, atau ketik data manual. Dapatkan analisis mendalam dari Gemini AI.
- ðŸ“Š **Business Dashboard** â€” Health score, alerts prioritas, trend penjualan, dan top produk dalam satu layar.
- ðŸ”® **Forecasting & Risk AI** â€” Proyeksi revenue, risk radar, dan deteksi stockout sebelum terjadi.
- ðŸ‘¥ **CRM & Sales Pipeline** â€” Kelola leads, pipeline penjualan, dan follow-up overdue.
- ðŸ“± **WhatsApp Automation** â€” Kirim pesan follow-up, notifikasi stok, dan promosi otomatis via WhatsApp.
- ðŸ’¬ **AI Business Chat** â€” Tanya AI tentang prioritas bisnis hari ini, strategi, atau analisis custom.
- ðŸ“„ **Reports PDF/CSV** â€” Ekspor laporan bisnis profesional kapan saja.
- ðŸ¢ **Multi-Tenant SaaS** â€” Satu platform, banyak workspace bisnis dengan isolasi data penuh.
- ðŸ“¶ **PWA + Offline Mode** â€” Bisa diinstal dan bekerja saat internet tidak stabil.
- ðŸŽ¯ **Judge Demo Mode** â€” Mode presentasi dengan data dummy siap pakai untuk demo cepat.

---

## ðŸ—ï¸ Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    FRONTEND (React SPA)                  â”‚
â”‚  React 19 Â· TypeScript Â· Vite Â· Tailwind CSS Â· Recharts â”‚
â”‚  PWA (Service Worker Â· Offline Page Â· Web Manifest)      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â”‚ REST API (JWT Auth)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   BACKEND (Node.js/Express)              â”‚
â”‚  Express Router Â· Auth Middleware Â· Tenant Middleware    â”‚
â”‚  Repository Pattern Â· Error Handler Â· Request Logger     â”‚
â”‚  Env Validator Â· Security Scanner                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           â”‚                            â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Google Gemini AI  â”‚    â”‚   Database Layer             â”‚
â”‚   (via Backend)     â”‚    â”‚   Supabase/PostgreSQL        â”‚
â”‚   Guardrail +       â”‚    â”‚   DB health checker     â”‚
â”‚   Context Builder   â”‚    â”‚   (retry + circuit breaker)   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    DEPLOYMENT                            â”‚
â”‚  Docker Â· Google Cloud Run Â· HTTPS Â· Health Check       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ› ï¸ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4 |
| **UI Components** | Lucide React, Motion (Framer), custom design system |
| **Charts** | Recharts + custom visualization |
| **Backend** | Node.js 20, Express 4, TypeScript |
| **AI Engine** | Google Gemini API (via backend, key never exposed to client) |
| **Database** | Supabase/PostgreSQL (required for business data) |
| **Auth** | JWT, bcryptjs, multi-tenant session |
| **Export** | jsPDF, html2canvas, CSV native |
| **PWA** | Service Worker, Web Manifest, Offline Page |
| **Deployment** | Docker, Google Cloud Run |
| **Security** | Env validator, secret scanner, tenant isolation, RBAC |

---

## ðŸŽ¯ Key Features

### ðŸ¤– AI Business Analyzer
- Upload gambar, CSV, atau input teks manual
- Analisis Gemini AI: health score, strengths, risks, alerts
- Sales trend 7 hari, top products, customer review summary
- Action plan prioritas berbasis AI

### ðŸ“Š Business Dashboard
- Health score visual
- Inventory alerts real-time
- Sales & revenue trend chart
- Top product performance

### ðŸ“ˆ Analysis History
- Riwayat semua analisis tersimpan
- Bisa dibuka ulang dan dibandingkan

### ðŸ”® Forecasting & Risk AI
- Revenue projection 30/60/90 hari
- Stockout risk detection
- Risk radar chart
- Scenario planning

### ðŸ‘¥ CRM & Sales Pipeline
- Lead management (Hot/Warm/Cold)
- Pipeline Kanban view
- Follow-up overdue alerts
- Search & filter leads

### ðŸ“± WhatsApp Automation
- Template pesan otomatis
- Trigger: stok kritis, follow-up overdue, promo
- Simulation mode (tanpa API key)
- AI-generated message content

### ðŸ’¬ AI Business Chat
- Chat dengan AI yang mengenal bisnis Anda
- Context: profile, history, CRM, forecast
- Guardrail anti-hallucination
- Memori sesi bisnis

### ðŸ“„ Reports PDF/CSV
- Laporan bisnis lengkap
- Ekspor PDF dan CSV
- Preview sebelum ekspor

### ðŸ¢ Multi-Tenant Workspace
- Banyak workspace per user
- Isolasi data antar tenant
- RBAC: Owner/Admin/Staff/Viewer

### ðŸ“¶ PWA + Offline Mode
- Install seperti aplikasi native
- Offline banner & offline page
- Cache app shell

### ðŸŽ¯ Judge Demo Mode
- Seed data dummy per skenario
- Skenario: Kedai Kopi, Laundry, Fashion UMKM, Warung Makan
- Guided demo overlay
- Reset tanpa merusak data lain

### ðŸ” Security & Fallback
- JWT auth dengan tenant isolation
- Automatic fallback: AI/WhatsApp/Storage
- Secret scanner built-in
- `/api/system/security-status` endpoint

---

## ðŸŽ¬ Demo Mode â€” Untuk Juri

**Cara cepat memulai demo:**

1. Buka aplikasi dan login/register
2. Klik tombol **"Start Judge Demo"** (floating button di dashboard)
3. Pilih skenario bisnis:
   - â˜• **Kedai Kopi** â€” F&B cafe dengan data penjualan dan inventory
   - ðŸ‘” **Laundry** â€” Jasa laundry dengan CRM dan notifikasi
   - ðŸ‘— **Fashion UMKM** â€” Toko fashion dengan leads pipeline
   - ðŸœ **Warung Makan** â€” Warung dengan risiko stok dan forecasting
4. Data dummy langsung ter-seed ke workspace aktif
5. Ikuti guided overlay untuk tour semua fitur

> **Catatan:** Demo mode aman â€” hanya mengisi workspace aktif Anda, tidak menyentuh tenant lain.

Lihat panduan lengkap di [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md).

---

## ðŸ“¸ Screenshots

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

## âš¡ Local Setup

```bash
# 1. Clone repository
git clone https://github.com/ch-fitra/BizPilot-AI.git
cd BizPilot-AI

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env â€” isi minimal GEMINI_API_KEY dan JWT_SECRET

# 4. Run development server
npm run dev
# Buka http://localhost:3000

# 5. (Optional) Production build
npm run build
npm run start
```

**Fallback Mode** â€” Jika env belum lengkap, aplikasi tetap berjalan:
- Tanpa `GEMINI_API_KEY` â†’ **AI Disabled mode** (analisis tidak tersedia)
- Tanpa Supabase keys â†’ **Database unavailable mode** (backend gagal aman, frontend queue retry via IndexedDB)
- Tanpa WhatsApp keys â†’ **Simulation mode** (pesan tidak dikirim, hanya ditampilkan)

---

## ðŸ” Environment Variables

| Variable | Keterangan | Wajib |
|----------|-----------|-------|
| `GEMINI_API_KEY` | Google Gemini API key untuk fitur AI | Opsional (AI Disabled jika kosong) |
| `JWT_SECRET` | Secret JWT auth, minimal 32 karakter random | Disarankan untuk production |
| `APP_URL` | URL publik aplikasi | Opsional |
| `SUPABASE_URL` | URL project Supabase | Wajib untuk data bisnis |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase | Wajib untuk data bisnis |
| `VITE_SUPABASE_URL` | Supabase URL untuk frontend client | Opsional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key untuk frontend | Opsional |
| `WHATSAPP_API_URL` | Endpoint WhatsApp provider (Fonnte) | Opsional (Simulation jika kosong) |
| `WHATSAPP_API_TOKEN` | Token WhatsApp provider | Opsional |
| `WHATSAPP_PHONE_NUMBER` | Nomor pengirim WhatsApp | Opsional |
| `PORT` | Port server (default: 8080) | Opsional |

> âš ï¸ **Jangan pernah commit file `.env` ke Git.** Gunakan `.env.example` sebagai template.

---

## ðŸš€ Deployment

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

## ðŸ”§ Quality Scripts

```bash
npm run lint          # TypeScript type check
npm run typecheck     # TypeScript type check (alias)
npm run build         # Production build (Vite + esbuild server)
npm run security:scan # Secret & env safety scan
npm run qa:check      # Full QA: lint + typecheck + build + security scan
npm run analyze       # Bundle analysis â†’ dist/stats.html
```

### Health Endpoints

| Endpoint | Keterangan |
|----------|-----------|
| `GET /api/health` | Server health check |
| `GET /api/system/security-status` | Mode AI/WhatsApp/Storage saat ini |
| `GET /api/system/pwa-status` | PWA & offline support status |

---

## ðŸ—ºï¸ Roadmap

- [ ] **Payment Integration** â€” Midtrans/Xendit untuk subscription SaaS
- [ ] **WhatsApp Cloud API** â€” Integrasi webhook resmi Meta WhatsApp Business
- [ ] **POS Integration** â€” Sinkronisasi dengan sistem kasir populer
- [ ] **Marketplace Sync** â€” Tokopedia/Shopee order sync
- [ ] **Advanced Forecasting** â€” ML model untuk prediksi lebih akurat
- [ ] **Mobile App** â€” React Native wrapper atau Capacitor
- [ ] **Multi-language** â€” Dukungan bahasa Inggris penuh
- [ ] **Audit Log** â€” Log lengkap semua aksi user per tenant

---

## ðŸ“‹ Documentation

| Dokumen | Deskripsi |
|---------|----------|
| [DEMO_GUIDE.md](docs/DEMO_GUIDE.md) | Panduan demo untuk juri â€” script 5 menit |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Panduan deployment Docker & Cloud Run |
| [SECURITY.md](docs/SECURITY.md) | Secret handling, tenant isolation, RBAC |
| [PERFORMANCE.md](docs/PERFORMANCE.md) | Bundle optimization, lazy loading, PWA cache |
| [PITCH_SCRIPT.md](docs/PITCH_SCRIPT.md) | Script pitch 3 menit untuk presentasi |
| [FINAL_CHECKLIST.md](docs/FINAL_CHECKLIST.md) | Checklist final sebelum submit |

---

## ðŸ‘¨â€ðŸ’» Creator

Built and developed independently by **[Chairul Fitra Ramadhan](https://github.com/ch-fitra)**.

*Independent Developer | AI Engineer | Builder of BizPilot AI*

Powered by:
- ðŸ¤– [Google Gemini AI](https://deepmind.google/technologies/gemini/) â€” Intelligence layer
- ðŸ—„ï¸ [Supabase](https://supabase.com/) â€” Database & auth infrastructure
- âš›ï¸ [React](https://react.dev/) â€” UI framework
- â˜ï¸ [Google Cloud Run](https://cloud.google.com/run) â€” Serverless deployment

---

*BizPilot AI â€” Empowering Indonesian UMKM with AI-driven business intelligence.*

