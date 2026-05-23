# 🎬 Demo Guide — BizPilot AI

> Panduan lengkap demo 5 menit untuk juri lomba.

---

## 🎯 Tujuan Demo

Menunjukkan bahwa BizPilot AI adalah **AI-powered Business Operating System** yang benar-benar fungsional — bukan sekadar mockup. Demo mencakup: dashboard, AI analysis, forecasting, CRM, WhatsApp automation, AI chat, report export, PWA, dan security.

---

## 🔑 Cara Masuk

### Opsi 1: Register Akun Baru
1. Buka aplikasi (lokal: `http://localhost:3000` atau URL live).
2. Klik **Register**.
3. Isi nama, email, dan password.
4. Login dengan akun yang baru dibuat.

### Opsi 2: Akun Demo (jika disediakan)
- Gunakan kredensial demo yang diberikan penyelenggara.

---

## 🚀 Flow Demo 5 Menit — Step by Step

### Step 1 — Login & Start Demo (0:00–0:30)

1. Buka aplikasi dan login.
2. Klik tombol floating **"🎯 Start Judge Demo"** di dashboard.
3. Pilih skenario bisnis:
   - ☕ **Kedai Kopi Nusantara** — F&B cafe (rekomendasi untuk demo)
   - 👔 **Fresh Laundry Express** — Jasa laundry
   - 👗 **Batik Chic Fashion** — Toko fashion UMKM
   - 🍜 **Warung Bahari** — Warung makan
4. Klik **"Mulai Demo"** — data dummy langsung ter-seed ke workspace aktif.

> **💡 Catatan:** Demo mode aman — data hanya mengisi workspace Anda, tidak menyentuh tenant lain.

---

### Step 2 — Overview Dashboard (0:30–1:00)

**Apa yang ditunjukkan:**
- **Health Score** — skor kesehatan bisnis (0–100) dengan visual card
- **Priority Alerts** — notifikasi penting (stok habis, follow-up overdue, dll)
- **Sales Trend** — grafik penjualan 7 hari terakhir
- **Top Products** — performa produk terlaris

**Narasi:**
> "Ini adalah dashboard utama. Owner langsung melihat health score bisnisnya — saat ini 72/100. Ada 3 alert yang perlu perhatian segera: stok kritis, follow-up customer yang overdue, dan penurunan penjualan."

---

### Step 3 — AI Analyzer (1:00–1:30)

**Apa yang ditunjukkan:**
- Input multimodal: bisa upload **foto struk**, **file CSV**, atau **ketik teks manual**
- AI menganalisis dan menghasilkan: health score, strengths, risks, action plan
- Riwayat analisis tersimpan

**Narasi:**
> "AI Analyzer adalah fitur andalan kami. Owner bisa upload foto struk dari kasir, file CSV penjualan, atau cukup mengetik data manual. AI Gemini akan menganalisis dan memberikan health score, strengths, risks, dan action plan yang actionable."

---

### Step 4 — Forecasting & Risk AI (1:30–2:00)

**Apa yang ditunjukkan:**
- **Revenue Projection** — grafik proyeksi 30/60/90 hari
- **Stockout Risk** — deteksi produk yang berisiko kehabisan stok
- **Risk Radar Chart** — visualisasi risiko multi-dimensi
- **Scenario Simulator** — simulasi skenario bisnis

**Narasi:**
> "Di Forecasting, AI memprediksi revenue ke depan dan mendeteksi risiko stok sebelum terjadi. Risk radar menunjukkan area bisnis yang perlu perhatian. Owner bisa simulasi skenario: 'Bagaimana jika harga bahan naik 20%?'"

---

### Step 5 — CRM & Sales Pipeline (2:00–2:30)

**Apa yang ditunjukkan:**
- **Lead cards** dengan status Hot/Warm/Cold
- **Pipeline Kanban view** — drag & drop stages
- **Follow-up overdue** — leads yang terlewat
- **Search & filter** — cari leads berdasarkan nama/status

**Narasi:**
> "CRM ringan ini membantu owner tidak kehilangan pelanggan potensial. Lihat — ada 2 hot leads yang belum di-follow-up lebih dari 3 hari. Tanpa sistem ini, mereka pasti terlewat."

---

### Step 6 — WhatsApp Automation (2:30–3:00)

**Apa yang ditunjukkan:**
- Template pesan otomatis (follow-up, stok kritis, promo)
- **Simulation mode** — pesan ditampilkan, tidak dikirim sungguhan
- AI-generated message content
- Notification engine dengan trigger rules

**Narasi:**
> "WhatsApp Automation mengirim pesan follow-up otomatis ke pelanggan. Saat ini berjalan dalam simulation mode — pesan ditampilkan tapi tidak dikirim. Di production, ini terhubung ke Fonnte API untuk pengiriman real."

> ⚠️ **Jika WhatsApp token tidak diset:** Mode simulation aktif otomatis. Pesan tetap dibuat dan ditampilkan — hanya pengiriman yang disimulasikan.

---

### Step 7 — AI Business Chat (3:00–3:30)

**Apa yang ditunjukkan:**
- Chat interface dengan AI
- AI mengenal konteks bisnis (profil, history, CRM, forecast)
- Contoh pertanyaan: *"Apa prioritas bisnis hari ini?"*
- Guardrail anti-hallucination

**Narasi:**
> "AI Business Chat adalah asisten yang memahami bisnis Anda. Tanya: 'Apa prioritas bisnis hari ini?' — dan AI akan menjawab berdasarkan data aktual: analisis terakhir, leads CRM, forecast, dan stok."

> ⚠️ **Jika Gemini API key tidak diset:** AI Chat dan Analyzer tidak tersedia. Fitur lain (CRM, Reports, Dashboard) tetap berfungsi penuh.

---

### Step 8 — Reports PDF/CSV (3:30–4:00)

**Apa yang ditunjukkan:**
- Preview laporan bisnis lengkap
- Export ke **PDF** — laporan profesional
- Export ke **CSV** — data mentah untuk analisis lanjutan

**Narasi:**
> "Reports menghasilkan laporan bisnis profesional. Preview dulu, lalu ekspor ke PDF atau CSV. Owner bisa pakai ini untuk laporan ke investor, bank, atau internal review."

---

### Step 9 — PWA & Offline Mode (4:00–4:30)

**Apa yang ditunjukkan:**
- **Install prompt** — tombol install aplikasi
- **Offline banner** — indikator saat internet mati
- App bisa dibuka dari home screen seperti native app

**Narasi:**
> "BizPilot AI adalah PWA — bisa diinstal seperti aplikasi native. Saat internet mati, offline banner muncul dan fitur-fitur yang sudah di-cache tetap bisa diakses."

---

### Step 10 — Settings & Security (4:30–5:00)

**Apa yang ditunjukkan:**
- **Storage mode** — Supabase PostgreSQL atau Local JSON
- **AI mode** — Enabled atau Disabled
- **WhatsApp mode** — Live atau Simulation
- **Security status** — endpoint `/api/system/security-status`

**Narasi:**
> "Di Settings, owner bisa melihat status semua sistem. Aplikasi ini punya graceful degradation: tanpa Supabase → Local JSON, tanpa Gemini key → AI disabled, tanpa WhatsApp token → Simulation. Semua fallback terjadi otomatis."

---

## 🔄 Reset Demo

1. Buka Judge Demo panel.
2. Klik **"Reset Demo"**.
3. Data demo dibersihkan dari workspace aktif tanpa menyentuh tenant lain.

---

## ⚡ What the Seeder Fills

Setiap skenario mengisi workspace aktif dengan:

| Data | Keterangan |
|------|-----------|
| Business Profile | Profil bisnis lengkap sesuai skenario |
| Analysis History | Riwayat analisis AI dengan health score |
| CRM Leads | Lead cards dengan berbagai status |
| Inventory Alerts | Alert stok kritis dan peringatan |
| Forecast Snapshot | Data proyeksi revenue dan risiko |
| Notifications | Notifikasi dan automation rules |
| Report Data | Data siap ekspor ke PDF/CSV |
| Action Plan | Rencana aksi prioritas dari AI |
| Chat Context | Konteks bisnis untuk AI Chat |

---

## 🆘 Troubleshooting Demo

| Masalah | Solusi |
|---------|--------|
| AI Analyzer tidak merespons | Periksa `GEMINI_API_KEY` di environment |
| WhatsApp tidak mengirim | Normal — simulation mode aktif jika token kosong |
| Data tidak muncul setelah demo start | Refresh halaman, periksa console browser |
| Login gagal | Coba register akun baru |
| Halaman kosong | Periksa `npm run build` berhasil, cek console error |
| Export PDF gagal | Coba browser berbeda (Chrome direkomendasikan) |

---

*Panduan ini dirancang untuk demo juri. Untuk deployment teknis, lihat [DEPLOYMENT.md](DEPLOYMENT.md).*
