import { createClient, SupabaseClient } from '@supabase/supabase-js';

type CircuitState = 'closed' | 'open' | 'half_open';

export interface DatabaseHealthSnapshot {
  configured: boolean;
  healthy: boolean;
  schemaMissing: boolean;
  circuitState: CircuitState;
  failureCount: number;
  openedUntil: string | null;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
}

export class DatabaseUnavailableError extends Error {
  status = 503;
  code = 'DATABASE_UNAVAILABLE';

  constructor(message = 'Database sedang sibuk. Data Anda aman dan dapat dicoba kembali.') {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

export class DatabasePermissionError extends Error {
  status = 403;
  code = 'DATABASE_PERMISSION_DENIED';

  constructor(message = 'Akses database ditolak oleh kebijakan keamanan workspace.') {
    super(message);
    this.name = 'DatabasePermissionError';
  }
}

function cleanEnvValue(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return val.trim().replace(/^['"]|['"]$/g, '');
}

function cleanSupabaseUrl(url: string | undefined): string | undefined {
  const trimmed = cleanEnvValue(url);
  if (!trimmed) return undefined;
  return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseServiceKey = cleanEnvValue(rawKey);

const isPlaceholder = (val: string | undefined): boolean => {
  if (!val) return true;
  const v = val.toLowerCase();
  return (
    v.includes('your-project-id') ||
    v.includes('your_supabase_project_url') ||
    v.includes('your_supabase_service_role_key') ||
    v.includes('your-supabase-service-role-key') ||
    v.includes('your-supabase-anon-key') ||
    v.includes('placeholder')
  );
};

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseServiceKey &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseServiceKey)
);

export let isSchemaMissing = false;

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS || 6000);
const DB_RETRY_ATTEMPTS = Number(process.env.DB_RETRY_ATTEMPTS || 2);
const CIRCUIT_FAILURE_THRESHOLD = Number(process.env.DB_CIRCUIT_FAILURE_THRESHOLD || 3);
const CIRCUIT_OPEN_MS = Number(process.env.DB_CIRCUIT_OPEN_MS || 30000);

let supabaseClientInstance: SupabaseClient | null = null;

const health = {
  failureCount: 0,
  circuitState: 'closed' as CircuitState,
  openedUntil: 0,
  lastCheckedAt: null as string | null,
  lastSuccessAt: null as string | null,
  lastFailureAt: null as string | null,
  lastError: null as string | null,
};

export function isMissingTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('could not find the table') ||
    message.includes('relation "') ||
    message.includes('does not exist') ||
    error?.code === '42P01' ||
    error?.status === 404
  );
}

export function isPermissionError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42501' ||
    error?.code === 'PGRST301' ||
    message.includes('row-level security') ||
    message.includes('violates row-level security policy') ||
    message.includes('permission denied') ||
    message.includes('not authorized') ||
    error?.status === 401 ||
    error?.status === 403
  );
}

export function setSchemaMissing(state: boolean) {
  isSchemaMissing = state;
  if (state) {
    markDatabaseFailure(new DatabaseUnavailableError('Skema database belum lengkap. Jalankan migrasi Supabase sebelum menyimpan data bisnis.'));
  }
}

function markDatabaseSuccess() {
  health.failureCount = 0;
  health.circuitState = 'closed';
  health.openedUntil = 0;
  health.lastSuccessAt = new Date().toISOString();
  health.lastError = null;
  isSchemaMissing = false;
}

function markDatabaseFailure(error: any) {
  health.failureCount += 1;
  health.lastFailureAt = new Date().toISOString();
  health.lastError = error?.message || String(error);

  if (isMissingTableError(error)) {
    isSchemaMissing = true;
  }

  if (health.failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
    health.circuitState = 'open';
    health.openedUntil = Date.now() + CIRCUIT_OPEN_MS;
  }
}

function assertCircuitAllowsRequest() {
  if (health.circuitState !== 'open') return;

  if (Date.now() >= health.openedUntil) {
    health.circuitState = 'half_open';
    return;
  }

  throw new DatabaseUnavailableError();
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch,
      },
    });
    console.log('Supabase PostgreSQL client initialized.');
  }

  return supabaseClientInstance;
}

export function requireSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new DatabaseUnavailableError('Supabase belum dikonfigurasi. Penyimpanan lokal server dinonaktifkan untuk mencegah kehilangan data.');
  }

  assertCircuitAllowsRequest();

  const client = getSupabaseClient();
  if (!client) {
    throw new DatabaseUnavailableError();
  }
  return client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new DatabaseUnavailableError('Permintaan database melewati batas waktu aman.')), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function runSupabaseQuery<T>(
  context: string,
  operation: (supabase: SupabaseClient) => PromiseLike<{ data: T; error: any }>
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= DB_RETRY_ATTEMPTS; attempt += 1) {
    const supabase = requireSupabaseClient();
    health.lastCheckedAt = new Date().toISOString();

    try {
      const result = await withTimeout(operation(supabase), DB_TIMEOUT_MS);
      if (result.error) {
        throw result.error;
      }

      markDatabaseSuccess();
      return result.data;
    } catch (error: any) {
      lastError = error;
      markDatabaseFailure(error);

      if (isMissingTableError(error) || isPermissionError(error)) {
        break;
      }

      if (attempt < DB_RETRY_ATTEMPTS) {
        await sleep(250 * 2 ** attempt);
      }
    }
  }

  console.error(`[DATABASE] ${context} failed safely:`, lastError?.message || lastError);
  if (lastError instanceof DatabaseUnavailableError) {
    throw lastError;
  }

  if (lastError instanceof DatabasePermissionError) {
    throw lastError;
  }

  if (isPermissionError(lastError)) {
    throw new DatabasePermissionError();
  }

  if (isMissingTableError(lastError)) {
    throw new DatabaseUnavailableError('Skema database Supabase belum lengkap. Jalankan migrasi sebelum menyimpan atau membaca data bisnis.');
  }

  throw new DatabaseUnavailableError();
}

export async function verifyDatabaseHealth(): Promise<DatabaseHealthSnapshot> {
  health.lastCheckedAt = new Date().toISOString();

  if (!isSupabaseConfigured) {
    markDatabaseFailure(new DatabaseUnavailableError('Supabase environment variables are not configured.'));
    return getDatabaseHealthSnapshot();
  }

  try {
    await runSupabaseQuery('database-health:business_profiles', (supabase) =>
      supabase.from('business_profiles').select('id').limit(1)
    );
    await runSupabaseQuery('database-health:analysis_histories', (supabase) =>
      supabase.from('analysis_histories').select('id').limit(1)
    );
    markDatabaseSuccess();
  } catch (error) {
    markDatabaseFailure(error);
  }

  return getDatabaseHealthSnapshot();
}

export function getDatabaseHealthSnapshot(): DatabaseHealthSnapshot {
  const openedUntil = health.openedUntil ? new Date(health.openedUntil).toISOString() : null;

  return {
    configured: isSupabaseConfigured,
    healthy: isSupabaseConfigured && !isSchemaMissing && health.circuitState !== 'open',
    schemaMissing: isSchemaMissing,
    circuitState: health.circuitState,
    failureCount: health.failureCount,
    openedUntil,
    lastCheckedAt: health.lastCheckedAt,
    lastSuccessAt: health.lastSuccessAt,
    lastFailureAt: health.lastFailureAt,
    lastError: health.lastError,
  };
}
