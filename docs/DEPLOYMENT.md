# 🚀 Deployment Guide — BizPilot AI

> Panduan lengkap deployment dari lokal development hingga Google Cloud Run production.

---

## 📋 Prerequisites

- Node.js 20+ dan npm
- Docker (untuk container deployment)
- Google Cloud SDK (untuk Cloud Run)
- Supabase account (opsional — Local JSON fallback tersedia)

---

## 1. Local Development

```bash
# Clone repository
git clone https://github.com/ch-fitra/BizPilot-AI.git
cd BizPilot-AI

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env — isi minimal GEMINI_API_KEY dan JWT_SECRET

# Start development server
npm run dev
# Buka http://localhost:3000
```

---

## 2. Local Production Build

```bash
# Build frontend (Vite) dan backend (esbuild)
npm run build

# Start production server
npm run start
# Server berjalan di http://localhost:8080 (atau PORT dari env)
```

**Verifikasi build:**
```bash
# Cek health endpoint
curl http://localhost:8080/api/health
# Expected: {"status":"ok","serverTime":"..."}

# Cek security status
curl http://localhost:8080/api/system/security-status
# Expected: {"success":true,"data":{...}}
```

---

## 3. Docker Build & Run

### Build Image

```bash
docker build -t bizpilot-ai .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_gemini_api_key \
  -e JWT_SECRET=your_random_32_char_secret \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e WHATSAPP_API_URL=https://api.fonnte.com/send \
  -e WHATSAPP_API_TOKEN=your_whatsapp_token \
  -e WHATSAPP_PHONE_NUMBER=628xxxxxxxxxx \
  bizpilot-ai
```

### Verify Container

```bash
curl http://localhost:8080/api/health
```

---

## 4. Google Cloud Run Deployment

### Step 1: Build & Push Image

```bash
# Menggunakan Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/bizpilot-ai

# Atau dengan Artifact Registry (recommended)
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/bizpilot/bizpilot-ai
```

### Step 2: Deploy ke Cloud Run

```bash
gcloud run deploy bizpilot-ai \
  --image gcr.io/YOUR_PROJECT_ID/bizpilot-ai \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "GEMINI_API_KEY=your_key,JWT_SECRET=your_secret,NODE_ENV=production"
```

### Step 3: Verify Deployment

```bash
# Dapatkan URL
gcloud run services describe bizpilot-ai --region asia-southeast1 --format='value(status.url)'

# Cek health
curl https://YOUR_CLOUD_RUN_URL/api/health

# Cek security status
curl https://YOUR_CLOUD_RUN_URL/api/system/security-status
```

---

## 5. Environment Variables

| Variable | Keterangan | Wajib |
|----------|-----------|-------|
| `GEMINI_API_KEY` | Google Gemini API key | Opsional — AI disabled jika kosong |
| `JWT_SECRET` | JWT auth secret (min 32 char) | Sangat disarankan untuk production |
| `APP_URL` | URL publik aplikasi | Opsional |
| `SUPABASE_URL` | URL project Supabase | Opsional — Local JSON jika kosong |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Opsional |
| `VITE_SUPABASE_URL` | Supabase URL untuk frontend | Opsional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key untuk frontend | Opsional |
| `WHATSAPP_API_URL` | Endpoint WhatsApp provider | Opsional — Simulation jika kosong |
| `WHATSAPP_API_TOKEN` | Token WhatsApp provider | Opsional |
| `WHATSAPP_PHONE_NUMBER` | Nomor pengirim WhatsApp | Opsional |
| `PORT` | Port server (default: 8080) | Opsional |

> ⚠️ **Jangan pernah** commit file `.env` ke Git. Cloud Run meng-inject env vars melalui konfigurasi service.

---

## 6. Supabase Database Migration

### Setup Awal

1. Buat project baru di [Supabase](https://supabase.com/).
2. Buka **SQL Editor**.
3. Jalankan migration files secara berurutan:

```
supabase/migrations/001_initial_bizpilot_schema.sql
supabase/migrations/002_business_chat_messages.sql
supabase/migrations/003_crm_leads.sql
supabase/migrations/004_notifications_and_automation.sql
supabase/migrations/005_forecasting_risk.sql
supabase/migrations/006_auth_multi_tenant.sql
```

### Verifikasi Tabel

Pastikan tabel-tabel berikut ada setelah migrasi:
- `business_profiles`
- `analysis_histories`
- `chat_messages`
- `crm_leads`
- `notifications`
- `automation_rules`
- `forecast_snapshots`
- `users` / `workspaces` / `workspace_members` (dari migration 006)

### Tanpa Supabase

Jika tidak menggunakan Supabase, aplikasi otomatis fallback ke **Local JSON Storage**. Data disimpan di folder `server/data/` sebagai file JSON per tenant. Mode ini cocok untuk development dan demo, tetapi tidak direkomendasikan untuk production multi-user.

---

## 7. Health Check Endpoints

| Endpoint | Method | Keterangan |
|----------|--------|-----------|
| `/api/health` | GET | Server health check — harus return `{"status":"ok"}` |
| `/api/system/security-status` | GET | Mode AI/WhatsApp/Storage saat ini |
| `/api/system/pwa-status` | GET | PWA & offline support status |

Gunakan `/api/health` sebagai Cloud Run health check endpoint.

---

## 8. Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---------|---------------------|--------|
| Blank page di browser | Build gagal atau SPA routing error | Jalankan `npm run build` ulang, cek console |
| API 500 error | Environment variable missing | Cek `.env`, pastikan format benar |
| AI tidak berfungsi | `GEMINI_API_KEY` tidak diset | Set API key atau gunakan AI Disabled mode |
| Database error | Supabase config salah | Cek `SUPABASE_URL` dan `SERVICE_ROLE_KEY` |
| WhatsApp gagal kirim | Token expired atau invalid | Refresh token Fonnte, atau gunakan simulation mode |
| Docker build gagal | Node.js version mismatch | Pastikan Dockerfile menggunakan `node:20-alpine` |
| Port conflict | Port sudah dipakai | Ganti `PORT` di `.env` |
| Cloud Run cold start lambat | Container terlalu besar | Pastikan `.dockerignore` lengkap |

---

## 9. Pre-Deployment Checklist

```bash
# Wajib dijalankan sebelum deploy
npm run lint          # TypeScript check
npm run typecheck     # TypeScript check (alias)
npm run build         # Production build
npm run security:scan # Secret & env scan
npm run qa:check      # Full QA pipeline
```

Semua command harus sukses tanpa error sebelum deploy ke production.

---

*Untuk panduan demo, lihat [DEMO_GUIDE.md](DEMO_GUIDE.md). Untuk security, lihat [SECURITY.md](SECURITY.md).*
