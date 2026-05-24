import dotenv from 'dotenv';
dotenv.config();

export interface EnvValidationResult {
  valid: boolean;
  issues: string[];
  criticalMissing: boolean;
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let criticalMissing = false;

  const criticalVars = ['GEMINI_API_KEY', 'JWT_SECRET'];
  const optionalVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'WHATSAPP_API_URL',
    'WHATSAPP_API_TOKEN',
    'CRON_SECRET',
    'PASSIVE_JOB_BATCH_SIZE',
    'PASSIVE_JOB_MAX_RUNTIME_MS',
    'GEMINI_EMBEDDING_MODEL',
    'GEMINI_EMBEDDING_DIM'
  ];

  const isMissingOrPlaceholder = (name: string, val?: string) => {
    if (!val || val.trim() === '') return true;
    const lowered = val.toLowerCase();
    return (
      lowered.includes('your-') ||
      lowered.includes('placeholder') ||
      lowered.includes('my_') ||
      lowered.includes('generate-a-safe') ||
      lowered.includes('change-me')
    );
  };

  criticalVars.forEach((name) => {
    const val = process.env[name];
    if (isMissingOrPlaceholder(name, val)) {
      issues.push(`Critical variable missing/placeholder: ${name}`);
      criticalMissing = true;
      return;
    }

    if (name === 'JWT_SECRET' && val && val.trim().length < 32) {
      issues.push('Critical variable too weak: JWT_SECRET must be at least 32 characters.');
      criticalMissing = true;
    }
  });

  optionalVars.forEach((name) => {
    const val = process.env[name];
    if (isMissingOrPlaceholder(name, val)) {
      warnings.push(`Optional variable missing/unset: ${name} (server-side local JSON persistence is disabled; affected features fail safely)`);
    }
  });

  const embeddingDimRaw = process.env.GEMINI_EMBEDDING_DIM;
  if (embeddingDimRaw && embeddingDimRaw.trim() !== '') {
    const embeddingDim = Number(embeddingDimRaw);
    if (!Number.isFinite(embeddingDim) || embeddingDim <= 0 || !Number.isInteger(embeddingDim)) {
      issues.push('Optional variable invalid: GEMINI_EMBEDDING_DIM must be a positive integer.');
    }
  }

  return {
    valid: !criticalMissing,
    issues,
    criticalMissing,
    warnings
  };
}
