import { runSupabaseQuery } from '../db/supabaseClient';
import { PassiveIntelligenceService } from '../services/passiveIntelligenceService';
import { BusinessMemoryService } from '../services/businessMemoryService';

interface RunnerResult {
  startedAt: string;
  finishedAt: string;
  processedBusinesses: number;
  succeededBusinesses: number;
  failedBusinesses: number;
  stoppedByRuntimeGuard: boolean;
}

let isRunnerActive = false;
let lastRunStartedAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export class PassiveIntelligenceRunner {
  static isRunning(): boolean {
    return isRunnerActive;
  }

  static getLastRunStartedAt(): number {
    return lastRunStartedAt;
  }

  static async runAllBusinesses(): Promise<RunnerResult> {
    if (isRunnerActive) {
      throw Object.assign(new Error('Passive runner sedang berjalan.'), { status: 429, code: 'RUNNER_ALREADY_ACTIVE' });
    }

    isRunnerActive = true;
    lastRunStartedAt = Date.now();
    const startedAtIso = new Date(lastRunStartedAt).toISOString();

    const batchSize = getIntEnv('PASSIVE_JOB_BATCH_SIZE', 25);
    const maxRuntimeMs = getIntEnv('PASSIVE_JOB_MAX_RUNTIME_MS', 240000);
    const batchDelayMs = getIntEnv('PASSIVE_JOB_BATCH_DELAY_MS', 100);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let stoppedByRuntimeGuard = false;

    try {
      const profiles = await runSupabaseQuery<{ id: string }[]>('business_profiles.runner.list', (supabase) =>
        supabase.from('business_profiles').select('id').order('created_at', { ascending: true })
      );

      const businessIds = (profiles || []).map((p) => p.id).filter(Boolean);

      for (let offset = 0; offset < businessIds.length; offset += batchSize) {
        if (Date.now() - lastRunStartedAt > maxRuntimeMs) {
          stoppedByRuntimeGuard = true;
          break;
        }

        const batch = businessIds.slice(offset, offset + batchSize);
        for (const businessId of batch) {
          if (Date.now() - lastRunStartedAt > maxRuntimeMs) {
            stoppedByRuntimeGuard = true;
            break;
          }
          processed += 1;
          try {
            await PassiveIntelligenceService.runForBusiness(businessId);
            const day = new Date().getDay();
            if (day === 1) await BusinessMemoryService.generatePeriodMemory(businessId, 'weekly_summary');
            if (new Date().getDate() === 1) await BusinessMemoryService.generatePeriodMemory(businessId, 'monthly_summary');
            succeeded += 1;
            console.log(`[PASSIVE-JOB] business=${businessId} status=success`);
          } catch (error: any) {
            failed += 1;
            const sanitized = String(error?.message || 'unknown error').replace(/[\r\n\t]/g, ' ').slice(0, 240);
            console.error(`[PASSIVE-JOB] business=${businessId} status=failed message="${sanitized}"`);
          }
        }

        if (stoppedByRuntimeGuard) break;
        if (batchDelayMs > 0) await sleep(batchDelayMs);
      }
    } finally {
      isRunnerActive = false;
    }

    return {
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      processedBusinesses: processed,
      succeededBusinesses: succeeded,
      failedBusinesses: failed,
      stoppedByRuntimeGuard,
    };
  }
}
