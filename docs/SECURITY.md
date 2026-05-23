# 🔐 Security Guide — BizPilot AI

> Panduan keamanan, secret handling, tenant isolation, dan RBAC.

---

## 1. Secret Handling

### Prinsip Utama
- **Tidak ada API key, token, atau secret yang boleh di-commit ke Git.**
- Semua secret dikelola melalui environment variables (`.env` lokal atau Cloud Run env vars).
- File `.env.example` hanya berisi placeholder — tidak pernah berisi nilai asli.

### Environment Variables yang Sensitif

| Variable | Risiko jika Bocor | Penanganan |
|----------|-------------------|------------|
| `GEMINI_API_KEY` | Penyalahgunaan API, billing fraud | Server-side only, tidak pernah dikirim ke browser |
| `JWT_SECRET` | Token forgery, unauthorized access | Minimal 32 karakter random, rotate secara berkala |
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access tanpa RLS | Server-side only, jangan gunakan di frontend |
| `WHATSAPP_API_TOKEN` | Spam message, reputasi nomor rusak | Server-side only, jangan expose ke client |

### Jika Secret Bocor
1. **Rotate segera** — generate key/token baru dari provider.
2. Hapus key lama dari semua environment.
3. Periksa Git history: `git log --all -p -- .env` untuk memastikan tidak ada commit yang berisi secret.
4. Jika sudah ter-commit, gunakan `git filter-branch` atau BFG Repo-Cleaner.

---

## 2. JWT Authentication

### Implementasi
- User login → server generate JWT token dengan payload `{userId, email, workspaceId}`.
- Token dikirim sebagai `Authorization: Bearer <token>` header di setiap request.
- `authMiddleware` mem-verify token di setiap protected route.

### JWT_SECRET
- **Development:** Jika `JWT_SECRET` tidak diset, server menggunakan runtime-only fallback. Sesi akan reset setiap kali server restart.
- **Production:** **WAJIB** menggunakan `JWT_SECRET` yang kuat (minimal 32 karakter random).
- Generate dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Best Practice
- Jangan simpan JWT di `localStorage` untuk production high-security (pertimbangkan `httpOnly` cookie di masa depan).
- Token memiliki expiry time — user harus re-login setelah expired.

---

## 3. Supabase Service Role Safety

### Risiko
`SUPABASE_SERVICE_ROLE_KEY` memiliki akses penuh ke database — **melewati Row Level Security (RLS)**. Jika bocor, attacker bisa membaca/menulis semua data di database.

### Penanganan
- **Hanya digunakan di backend** (`server/db/supabaseClient.ts`).
- **Tidak pernah** dikirim ke frontend atau dimasukkan ke Vite env (`VITE_*`).
- Frontend menggunakan `VITE_SUPABASE_ANON_KEY` yang dibatasi oleh RLS policies.

---

## 4. Tenant Isolation

### Multi-Tenant Architecture
- Setiap user bisa memiliki banyak workspace (tenant).
- Setiap request diverifikasi: user → workspace membership → role check.

### Enforcement
1. **Auth Middleware** — Verifikasi JWT token dan extract userId.
2. **Tenant Middleware** — Verifikasi bahwa user adalah anggota workspace yang diminta.
3. **Server-side Override** — Client-supplied `business_id` di-override oleh verified session workspace. Client tidak bisa mengakses data tenant lain.
4. **Demo Isolation** — Demo seeding dan reset hanya beroperasi di workspace aktif.

### Scope per Tenant
Data berikut ter-isolasi per workspace:
- Business profiles
- Analysis histories
- Chat messages
- CRM leads
- Notifications & automation rules
- Forecast snapshots

---

## 5. Role-Based Access Control (RBAC)

| Role | Read | Write | Delete | Manage Team | Admin Actions |
|------|------|-------|--------|-------------|---------------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Staff** | ✅ | ✅ | Limited | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | Limited |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |

- Viewer: read-only, tidak bisa menghapus atau trigger operasi privileged.
- Staff: akses edit operasional, tidak bisa manage team atau hapus data protected.
- Admin: management access operasional.
- Owner: full access termasuk delete workspace.

---

## 6. Local JSON Fallback — Limitasi Keamanan

Jika Supabase tidak dikonfigurasi, aplikasi menggunakan **Local JSON Storage**:

| Aspek | Supabase Mode | Local JSON Mode |
|-------|---------------|-----------------|
| Data persistence | PostgreSQL (cloud) | File JSON di server |
| Multi-user | ✅ Full support | ⚠️ Single server only |
| Data encryption at rest | ✅ Supabase managed | ❌ Plain JSON files |
| Backup | ✅ Supabase automated | ❌ Manual only |
| RLS policies | ✅ Database-level | ❌ App-level only |

> **Rekomendasi:** Gunakan Local JSON mode hanya untuk development dan demo. Production **harus** menggunakan Supabase PostgreSQL.

---

## 7. WhatsApp Token Safety

### Risiko
`WHATSAPP_API_TOKEN` memberikan akses untuk mengirim pesan atas nama nomor yang terdaftar. Jika bocor, attacker bisa mengirim spam.

### Penanganan
- Token hanya digunakan di backend (`server/routes/notifications.ts`).
- Tidak pernah dikirim ke frontend.
- Jika token tidak diset → **Simulation Mode** aktif otomatis (pesan dibuat tapi tidak dikirim).
- Rate limiting dan validasi pesan dilakukan di backend sebelum pengiriman.

---

## 8. Security Scan

### Menjalankan Scan

```bash
npm run security:scan
```

### Apa yang Diperiksa

Scanner memeriksa seluruh source code untuk:
- File `.env` yang ter-commit (bukan `.env.example`)
- Pola Gemini API key (`AIzaSy...`)
- JWT token / secret patterns
- Supabase service role key patterns
- WhatsApp API token patterns
- Private key / certificate patterns

### Kapan Harus Dijalankan
- Sebelum setiap commit
- Sebelum deployment
- Setelah menambahkan dependency baru
- Sebagai bagian dari `npm run qa:check`

---

## 9. AI Guardrails

### Prinsip
- AI responses **harus** menggunakan business context yang tersedia (profil, history, CRM, forecast).
- AI **tidak boleh** mengarang angka atau data yang tidak ada.
- AI **harus** mengungkapkan *low confidence* jika data yang tersedia terbatas.
- AI **tidak boleh** menjanjikan:
  - Profit pasti
  - Growth rate spesifik tanpa data
  - Closing deal yang guaranteed
  - Hasil investasi tertentu

### Implementasi
- System prompt meng-enforce guardrail di setiap AI call.
- Gemini temperature diset rendah (0.2) untuk respons faktual.
- Structured JSON output schema memaksa format yang konsisten.

---

## 10. Security Status Endpoint

```
GET /api/system/security-status
```

Response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": [],
    "warnings": [],
    "modes": {
      "ai": "enabled",
      "whatsapp": "simulation",
      "storage": "local-json"
    }
  }
}
```

Gunakan endpoint ini untuk memverifikasi status keamanan sistem setelah deployment.

---

*Untuk deployment, lihat [DEPLOYMENT.md](DEPLOYMENT.md). Untuk performance, lihat [PERFORMANCE.md](PERFORMANCE.md).*
