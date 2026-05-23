import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return val.trim().replace(/^['"]|['"]$/g, '');
}

function cleanSupabaseUrl(url: string | undefined): string | undefined {
  const trimmed = cleanEnvValue(url);
  if (!trimmed) return undefined;
  // Remove /rest/v1 etc at the end, and any trailing slashes
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

export function setSchemaMissing(state: boolean) {
  isSchemaMissing = state;
}

export async function initializeDatabasePrecheck(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.log('Database Mode: running under Local JSON server persistence (history.json, business_profile.json).');
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    isSchemaMissing = true;
    return false;
  }

  try {
    const { error } = await supabase
      .from('business_profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      if (
        error.message.includes('Could not find the table') || 
        error.message.includes('relation "') || 
        error.message.includes('does not exist') ||
        error.code === 'P0001' || // SQL custom exceptions
        (error as any).status === 404
      ) {
        setSchemaMissing(true);
        console.log('Database Mode: Supabase is configured but tables do not exist yet. Running on Local JSON fallback.');
        return false;
      }
    }
    
    // Test the second table just in case
    const historyCheck = await supabase
      .from('analysis_histories')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (historyCheck.error) {
      if (
        historyCheck.error.message.includes('Could not find the table') || 
        historyCheck.error.message.includes('relation "') || 
        historyCheck.error.message.includes('does not exist') ||
        (historyCheck.error as any).status === 404
      ) {
        setSchemaMissing(true);
        console.log('Database Mode: Supabase analysis_histories table is missing. Running on Local JSON fallback.');
        return false;
      }
    }

    console.log('✓ Verified: Supabase tables business_profiles and analysis_histories exist and are accessible.');
    isSchemaMissing = false;
    return true;
  } catch (err: any) {
    console.log('⚠️ Supabase connection test/precheck was bypassed (running local JSON fallback):', err.message || err);
    setSchemaMissing(true);
    return false;
  }
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('Successfully connected to Supabase PostgreSQL database.');
    } catch (err) {
      console.error('Failed to instantiate Supabase client:', err);
      return null;
    }
  }

  return supabaseClientInstance;
}
