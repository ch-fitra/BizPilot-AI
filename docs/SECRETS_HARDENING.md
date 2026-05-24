# Secrets Hardening Guide (Production)

## 1) Mandatory Rules
- Never commit `.env` files.
- Keep server secrets only in Secret Manager / CI secrets.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `WHATSAPP_API_TOKEN`, or `JWT_SECRET` to frontend code.
- Use least-privilege keys where possible.

## 2) Secret Rotation Checklist
Rotate immediately if secret exposure is suspected.

1. Rotate `GEMINI_API_KEY`
2. Rotate `SUPABASE_SERVICE_ROLE_KEY`
3. Rotate `JWT_SECRET`
4. Rotate `WHATSAPP_API_TOKEN`
5. Invalidate old keys/tokens in each provider dashboard
6. Redeploy Cloud Run with new secrets
7. Verify app health:
   - `npm run security:scan`
   - `npm run security:rls`
   - `npm run build`

## 3) Cloud Run Secret Recommendations
- Use Google Secret Manager for all production secrets.
- Mount/inject secrets as environment variables at runtime.
- Do not store plaintext secrets in Dockerfile, repo, or CI logs.
- Restrict IAM access:
  - Only runtime service account can access production secrets.
  - Separate dev/staging/prod secret sets.

## 4) Production Environment Setup
Use `.env.example` as template only.

Required server secrets:
- `GEMINI_API_KEY`
- `JWT_SECRET` (minimum 32 chars random)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (if WhatsApp enabled):
- `WHATSAPP_PROVIDER`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_WEBHOOK_SECRET`
- `WHATSAPP_API_URL`
- `WHATSAPP_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`

## 5) Git History Cleanup (If Secret Was Committed Previously)
If any real secret was ever committed:

1. Rotate compromised credentials first.
2. Rewrite history (example with `git filter-repo`) to remove secret-bearing files/values.
3. Force-push cleaned history.
4. Instruct all collaborators to re-clone.
5. Re-run repository scan and security checks.

Example high-level command pattern:
- `git filter-repo --path .env --invert-paths`

Then:
- `git push --force --all`
- `git push --force --tags`

## 6) Public Demo Safety
- Keep `.env` absent from repository.
- Commit only `.env.example` placeholders.
- Verify no secrets in docs, screenshots, or logs.
