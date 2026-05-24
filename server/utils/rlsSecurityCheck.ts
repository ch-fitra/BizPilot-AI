import fs from 'fs';
import path from 'path';

const migrationPaths = [
  path.join(process.cwd(), 'supabase', 'migrations', '008_rls_multi_tenant_security.sql'),
  path.join(process.cwd(), 'supabase', 'migrations', '010_passive_intelligence_tables.sql'),
  path.join(process.cwd(), 'supabase', 'migrations', '011_business_memory_pgvector.sql'),
  path.join(process.cwd(), 'supabase', 'migrations', '012_warung_mode_voice_transactions.sql'),
  path.join(process.cwd(), 'supabase', 'migrations', '013_whatsapp_assistant_tables.sql'),
];

const securedTables = [
  'user_profiles',
  'business_profiles',
  'business_members',
  'analysis_histories',
  'business_settings',
  'business_chat_messages',
  'crm_leads',
  'notifications',
  'automation_rules',
  'whatsapp_logs',
  'forecast_snapshots',
  'cashflow_entries',
  'nota_scans',
  'business_alerts',
  'business_daily_metrics',
  'insight_runs',
  'business_memories',
  'memory_retrieval_logs',
  'voice_transactions',
  'whatsapp_business_links',
  'whatsapp_pending_actions',
];

const businessScopedTables = [
  'analysis_histories',
  'business_settings',
  'business_chat_messages',
  'crm_leads',
  'notifications',
  'automation_rules',
  'whatsapp_logs',
  'forecast_snapshots',
  'cashflow_entries',
  'nota_scans',
  'business_alerts',
  'business_daily_metrics',
  'insight_runs',
  'business_memories',
  'memory_retrieval_logs',
  'voice_transactions',
  'whatsapp_pending_actions',
];

function assertContains(source: string, expected: string, label: string) {
  if (!source.includes(expected.toLowerCase())) {
    throw new Error(`Missing RLS guard: ${label}`);
  }
}

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return fullPath;
  });
}

function assertServiceRoleNotInFrontend() {
  const frontendFiles = walkFiles(path.join(process.cwd(), 'src')).filter((filePath) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|html)$/.test(filePath)
  );

  const offenders = frontendFiles.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return (
      /import\.meta\.env\.[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*/.test(content) ||
      /process\.env\.[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*/.test(content) ||
      /VITE_[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*/.test(content)
    );
  });

  if (offenders.length > 0) {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY referenced in frontend files: ${offenders.join(', ')}`);
  }
}

function main() {
  const missing = migrationPaths.find((migrationPath) => !fs.existsSync(migrationPath));
  if (missing) {
    throw new Error(`RLS migration not found at ${missing}`);
  }

  const sql = migrationPaths
    .map((migrationPath) => fs.readFileSync(migrationPath, 'utf-8'))
    .join('\n')
    .toLowerCase();

  assertContains(sql, 'create or replace function public.current_app_user_id()', 'auth.uid helper');
  assertContains(sql, 'create or replace function public.is_business_member', 'business member helper');
  assertContains(sql, 'create or replace function public.is_business_owner', 'business owner helper');
  assertContains(sql, 'revoke all on function public.is_business_member(uuid) from public', 'helper execute revoked from public');
  assertContains(sql, 'revoke all on function public.is_business_owner(uuid) from public', 'owner helper execute revoked from public');

  for (const table of securedTables) {
    assertContains(sql, `alter table public.${table} enable row level security`, `${table} RLS enabled`);
    assertContains(sql, `alter table public.${table} force row level security`, `${table} RLS forced`);
    assertContains(sql, `public.${table}`, `${table} is present in grants/revokes`);
  }

  assertContains(sql, 'from anon', 'anonymous table access revoked');

  for (const table of businessScopedTables) {
    assertContains(sql, `${table}_select_`, `${table} SELECT policy`);
    assertContains(sql, `${table}_insert_`, `${table} INSERT policy`);
    assertContains(sql, `${table}_update_`, `${table} UPDATE policy`);
    assertContains(sql, `${table}_delete_`, `${table} DELETE policy`);
  }

  assertServiceRoleNotInFrontend();

  console.log('RLS security check passed.');
  console.log(`Secured tables: ${securedTables.join(', ')}`);
}

main();
