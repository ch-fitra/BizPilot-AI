<<<<<<< HEAD
﻿# BizPilot AI
=======
# BizPilot AI
>>>>>>> e6eadcf (update)

AI-native business assistant for Indonesian MSMEs (UMKM), focused on fast operations and safer decisions.

Live app URL: https://bizpilot-ai-483259123956.asia-southeast2.run.app

## Why BizPilot AI
UMKM owners often run sales, stock, expenses, and follow-ups manually. BizPilot AI helps by turning daily activity into actionable guidance without ERP complexity.

## Core Features
1. OCR Nota (strict extraction + validation)
2. Passive AI Business Intelligence (deterministic metrics + alerts)
3. Founder Dashboard (health, alerts, today summary)
4. Business Memory (RAG with pgvector)
5. Warung Mode (voice/text to transaction draft)
6. WhatsApp Assistant (webhook + confirmation flow)
7. Offline-first PWA (IndexedDB queue + sync)

## Architecture (High-Level)
- Frontend: React + Vite + Tailwind + PWA
- Backend: Node.js + Express
- Database: Supabase PostgreSQL
- AI: Gemini (server-side only)
- Hosting: Google Cloud Run
- RAG: pgvector

Design principle: deterministic business numbers come from backend/database logic; AI is used for extraction/interpretation only.

## Demo Flow (Judge-Friendly)
1. Open Founder Dashboard
2. Upload receipt in OCR Nota
3. Run Passive Intelligence
4. Open Business Memory highlight
5. Try Warung Mode quick input
6. Show WhatsApp assistant status/logs

## Local Setup
```bash
git clone https://github.com/ch-fitra/BizPilot-AI.git
cd BizPilot-AI
npm install
cp .env.example .env
npm run dev
```

## Deployment (Cloud Run)
```bash
npm run build
gcloud builds submit --tag gcr.io/YOUR_PROJECT/bizpilot-ai
gcloud run deploy bizpilot-ai \
  --image gcr.io/YOUR_PROJECT/bizpilot-ai \
  --region asia-southeast1 \
  --platform managed
```

See full deployment details in `docs/DEPLOYMENT.md`.

## Security Model
- Multi-tenant protection via Supabase RLS + FORCE RLS
- Backend business scoping via auth middleware
- Service-role secret never exposed to frontend
- Secret scanning script: `npm run security:scan`
- RLS verification script: `npm run security:rls`

## Known Limitations
- WhatsApp media fetch flow depends on provider-specific setup.
- New businesses with very little data may show early-stage dashboard score.
- Some UI modules still need incremental typing cleanup.

## Quality Commands
```bash
npm run typecheck
npm run build
npm run security:scan
npm run security:rls
```

## Creator
Created by Chairul Fitra Ramadhan

## License
Proprietary / project-owner controlled (update as needed before public open-source release).
