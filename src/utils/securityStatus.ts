export interface SecurityStatus {
  valid: boolean;
  criticalMissing: boolean;
  issues: string[];
  warnings: string[];
  modes: {
    ai: 'enabled' | 'disabled';
    whatsapp: 'live' | 'simulation';
    storage: 'supabase-postgres' | 'unavailable';
  };
}

export async function fetchSecurityStatus(): Promise<SecurityStatus> {
  const response = await fetch('/api/system/security-status');
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload?.error?.message || 'Gagal memuat status keamanan sistem.');
  }

  return payload.data as SecurityStatus;
}
