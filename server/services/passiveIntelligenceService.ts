import { GoogleGenAI } from '@google/genai';
import { isMissingTableError, runSupabaseQuery } from '../db/supabaseClient';
import { BusinessMemoryService } from './businessMemoryService';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

interface DailyMetric {
  metric_date: string;
  revenue: number;
  expenses: number;
  profit: number;
  transaction_count: number;
  average_transaction_value: number;
  top_products: any[];
  warnings: string[];
}

interface PendingAlert {
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric_snapshot: Record<string, any>;
  dedupe_key: string;
}

const AI_MESSAGE_MAX_LEN = 400;

function sanitizeMessage(message: string): string {
  return message.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, AI_MESSAGE_MAX_LEN);
}

function formatPct(n: number): string {
  return `${Math.round(n)}%`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function toIsoDate(input: Date): string {
  return input.toISOString().split('T')[0];
}

async function maybeInterpretWithAI(businessId: string, baseMessage: string, metricSnapshot: Record<string, any>): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return baseMessage;

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const memories = await BusinessMemoryService.retrieveRelevantMemories(
      businessId,
      `${baseMessage} ${JSON.stringify(metricSnapshot)}`,
      { limit: 3 }
    );
    const prompt = [
      'Tulis ulang pesan alert bisnis berikut dalam Bahasa Indonesia yang ringkas, jelas, dan operasional.',
      'JANGAN menambah angka baru. Gunakan angka yang sudah tersedia saja.',
      `Pesan dasar: ${baseMessage}`,
      `Data metrik: ${JSON.stringify(metricSnapshot)}`,
      `Konteks historis (hanya referensi): ${JSON.stringify(memories.map((m) => ({ title: m.title, period_start: m.period_start, period_end: m.period_end, content: m.content })))}`,
      'Output hanya satu kalimat.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.1 },
    });

    const text = sanitizeMessage(String(response.text || ''));
    return text || baseMessage;
  } catch {
    return baseMessage;
  }
}

export class PassiveIntelligenceService {
  static async runForBusiness(businessId: string): Promise<{ created: number; skippedInventory: boolean; alerts: PendingAlert[] }> {
    const startedRun = await runSupabaseQuery<any>('insight_runs.create', (supabase) =>
      supabase
        .from('insight_runs')
        .insert({
          business_id: businessId,
          run_type: 'manual_trigger',
          run_status: 'running',
          metrics: {},
        })
        .select('*')
        .single()
    );

    try {
      const todayMetric = await this.aggregateDailyMetric(businessId, new Date());
      await this.upsertDailyMetric(businessId, todayMetric);

      const history = await this.getPreviousMetrics(businessId, 7);
      const alerts = await this.detectAlerts(businessId, todayMetric, history);
      const created = await this.persistAlerts(businessId, alerts);

      await runSupabaseQuery<any>('insight_runs.complete', (supabase) =>
        supabase
          .from('insight_runs')
          .update({
            run_status: 'success',
            finished_at: new Date().toISOString(),
            metrics: {
              metric_date: todayMetric.metric_date,
              alerts_created: created,
              warning_count: todayMetric.warnings.length,
            },
          })
          .eq('id', startedRun.id)
          .eq('business_id', businessId)
          .select('*')
          .single()
      );

      return {
        created,
        skippedInventory: todayMetric.warnings.includes('inventory_table_not_available'),
        alerts,
      };
    } catch (error: any) {
      await runSupabaseQuery<any>('insight_runs.fail', (supabase) =>
        supabase
          .from('insight_runs')
          .update({
            run_status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: sanitizeMessage(error?.message || 'Unknown error'),
          })
          .eq('id', startedRun.id)
          .eq('business_id', businessId)
          .select('*')
          .single()
      );
      throw error;
    }
  }

  static async getActiveAlerts(businessId: string): Promise<any[]> {
    const data = await runSupabaseQuery<any[]>('business_alerts.getActive', (supabase) =>
      supabase
        .from('business_alerts')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    );
    return data || [];
  }

  static async resolveAlert(businessId: string, alertId: string): Promise<any | null> {
    const data = await runSupabaseQuery<any | null>('business_alerts.resolve', (supabase) =>
      supabase
        .from('business_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .eq('business_id', businessId)
        .eq('status', 'active')
        .select('*')
        .maybeSingle()
    );
    return data || null;
  }

  private static async aggregateDailyMetric(businessId: string, date: Date): Promise<DailyMetric> {
    const metricDate = toIsoDate(date);
    const warnings: string[] = [];

    const cashflow = await runSupabaseQuery<any[]>('cashflow_entries.byDay', (supabase) =>
      supabase
        .from('cashflow_entries')
        .select('type,amount')
        .eq('business_id', businessId)
        .eq('entry_date', metricDate)
    );

    const revenue = (cashflow || []).filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount || 0), 0);
    const expenses = (cashflow || []).filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0);

    const scans = await runSupabaseQuery<any[]>('nota_scans.byDay', (supabase) =>
      supabase
        .from('nota_scans')
        .select('id,total_amount,confidence,items,status,warnings')
        .eq('business_id', businessId)
        .gte('scan_date', `${metricDate}T00:00:00.000Z`)
        .lte('scan_date', `${metricDate}T23:59:59.999Z`)
    );

    const transactionCount = scans?.length || 0;
    const avgTx = transactionCount > 0 ? revenue / transactionCount : 0;

    const lowConfidenceCount = (scans || []).filter((s) => Number(s.confidence || 0) < 0.6).length;
    if (transactionCount > 0 && lowConfidenceCount / transactionCount >= 0.4) {
      warnings.push('ocr_quality_low');
    }

    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const scan of scans || []) {
      const items = Array.isArray(scan.items) ? scan.items : [];
      for (const item of items) {
        const name = String(item?.name || 'item').trim();
        const qty = Number(item?.qty || 0);
        const subtotal = Number(item?.subtotal || 0);
        const current = productMap.get(name) || { name, qty: 0, revenue: 0 };
        current.qty += Number.isFinite(qty) ? qty : 0;
        current.revenue += Number.isFinite(subtotal) ? subtotal : 0;
        productMap.set(name, current);
      }
    }

    const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    try {
      await runSupabaseQuery<any[]>('inventory.probe', (supabase) =>
        supabase.from('inventory').select('id').eq('business_id', businessId).limit(1)
      );
    } catch (error: any) {
      if (isMissingTableError(error)) {
        warnings.push('inventory_table_not_available');
      } else {
        throw error;
      }
    }

    return {
      metric_date: metricDate,
      revenue,
      expenses,
      profit: revenue - expenses,
      transaction_count: transactionCount,
      average_transaction_value: avgTx,
      top_products: topProducts,
      warnings,
    };
  }

  private static async upsertDailyMetric(businessId: string, metric: DailyMetric): Promise<void> {
    await runSupabaseQuery<any>('business_daily_metrics.upsert', (supabase) =>
      supabase
        .from('business_daily_metrics')
        .upsert(
          {
            business_id: businessId,
            metric_date: metric.metric_date,
            revenue: metric.revenue,
            expenses: metric.expenses,
            profit: metric.profit,
            transaction_count: metric.transaction_count,
            average_transaction_value: metric.average_transaction_value,
            top_products: metric.top_products,
            warnings: metric.warnings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'business_id,metric_date' }
        )
        .select('*')
        .single()
    );
  }

  private static async getPreviousMetrics(businessId: string, days: number): Promise<DailyMetric[]> {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = toIsoDate(start);
    const today = toIsoDate(new Date());

    const data = await runSupabaseQuery<any[]>('business_daily_metrics.previous', (supabase) =>
      supabase
        .from('business_daily_metrics')
        .select('*')
        .eq('business_id', businessId)
        .gte('metric_date', startDate)
        .lt('metric_date', today)
        .order('metric_date', { ascending: true })
    );
    return (data || []) as DailyMetric[];
  }

  private static async detectAlerts(businessId: string, today: DailyMetric, previous: DailyMetric[]): Promise<PendingAlert[]> {
    const alerts: PendingAlert[] = [];
    const todayKey = today.metric_date;
    const prevRevenueAvg = average(previous.map((m) => Number(m.revenue || 0)));
    const prevExpenseAvg = average(previous.map((m) => Number(m.expenses || 0)));

    if (today.transaction_count === 0) {
      alerts.push({
        type: 'NO_ACTIVITY',
        severity: 'low',
        title: 'Belum ada aktivitas hari ini',
        message: 'Belum ada transaksi atau nota hari ini. Cek operasional dan input data harian.',
        metric_snapshot: { metric_date: today.metric_date, transaction_count: 0 },
        dedupe_key: `NO_ACTIVITY:${todayKey}`,
      });
    }

    if (prevRevenueAvg > 0 && today.revenue < prevRevenueAvg) {
      const dropPct = ((prevRevenueAvg - today.revenue) / prevRevenueAvg) * 100;
      if (dropPct >= 20) {
        alerts.push({
          type: 'REVENUE_DROP',
          severity: dropPct >= 35 ? 'high' : 'medium',
          title: 'Penjualan menurun signifikan',
          message: `Penjualan hari ini turun ${formatPct(dropPct)} dibanding rata-rata 7 hari terakhir.`,
          metric_snapshot: { today_revenue: today.revenue, avg_7d_revenue: prevRevenueAvg, drop_pct: Math.round(dropPct) },
          dedupe_key: `REVENUE_DROP:${todayKey}`,
        });
      }
    }

    if (prevExpenseAvg > 0 && today.expenses > prevExpenseAvg) {
      const spikePct = ((today.expenses - prevExpenseAvg) / prevExpenseAvg) * 100;
      if (spikePct >= 30) {
        alerts.push({
          type: 'EXPENSE_SPIKE',
          severity: spikePct >= 60 ? 'high' : 'medium',
          title: 'Lonjakan pengeluaran terdeteksi',
          message: 'Pengeluaran hari ini naik tidak wajar. Cek transaksi terbaru.',
          metric_snapshot: { today_expenses: today.expenses, avg_7d_expenses: prevExpenseAvg, spike_pct: Math.round(spikePct) },
          dedupe_key: `EXPENSE_SPIKE:${todayKey}`,
        });
      }
    }

    if (today.warnings.includes('ocr_quality_low')) {
      alerts.push({
        type: 'OCR_QUALITY',
        severity: 'medium',
        title: 'Kualitas pembacaan nota rendah',
        message: 'Kualitas baca nota rendah. Periksa kembali data sebelum dijadikan laporan.',
        metric_snapshot: { metric_date: today.metric_date, warning: 'ocr_quality_low' },
        dedupe_key: `OCR_QUALITY:${todayKey}`,
      });
    }

    if (today.warnings.includes('inventory_table_not_available')) {
      alerts.push({
        type: 'LOW_STOCK_SKIPPED',
        severity: 'low',
        title: 'Pemantauan stok belum aktif',
        message: 'Data inventory belum tersedia, deteksi low stock dilewati dengan aman.',
        metric_snapshot: { metric_date: today.metric_date },
        dedupe_key: `LOW_STOCK_SKIPPED:${todayKey}`,
      });
    }

    if (today.top_products.length > 0 && previous.length > 0) {
      const prevProductRevenue = new Map<string, number>();
      for (const metric of previous) {
        const products = Array.isArray(metric.top_products) ? metric.top_products : [];
        for (const p of products) {
          const name = String(p?.name || '');
          const rev = Number(p?.revenue || 0);
          prevProductRevenue.set(name, (prevProductRevenue.get(name) || 0) + rev);
        }
      }
      const candidate = today.top_products[0];
      const prevAvg = (prevProductRevenue.get(candidate.name) || 0) / previous.length;
      if (prevAvg > 0 && candidate.revenue > prevAvg * 1.4) {
        alerts.push({
          type: 'PRODUCT_MOMENTUM',
          severity: 'medium',
          title: `Momentum produk: ${candidate.name}`,
          message: `Produk ${candidate.name} sedang naik. Pertimbangkan tambah stok atau promo bundling.`,
          metric_snapshot: {
            product_name: candidate.name,
            today_revenue: candidate.revenue,
            avg_7d_revenue: prevAvg,
          },
          dedupe_key: `PRODUCT_MOMENTUM:${candidate.name}:${todayKey}`,
        });
      }
    }

    for (const alert of alerts) {
      alert.message = await maybeInterpretWithAI(businessId, alert.message, alert.metric_snapshot);
    }

    return alerts;
  }

  private static async persistAlerts(businessId: string, alerts: PendingAlert[]): Promise<number> {
    let created = 0;
    for (const alert of alerts) {
      const existing = await runSupabaseQuery<any | null>('business_alerts.findDuplicate', (supabase) =>
        supabase
          .from('business_alerts')
          .select('id')
          .eq('business_id', businessId)
          .eq('dedupe_key', alert.dedupe_key)
          .eq('status', 'active')
          .maybeSingle()
      );

      if (existing?.id) continue;

      await runSupabaseQuery<any>('business_alerts.create', (supabase) =>
        supabase
          .from('business_alerts')
          .insert({
            business_id: businessId,
            type: alert.type,
            severity: alert.severity,
            title: sanitizeMessage(alert.title),
            message: sanitizeMessage(alert.message),
            metric_snapshot: alert.metric_snapshot,
            source: 'passive_intelligence',
            status: 'active',
            dedupe_key: alert.dedupe_key,
          })
          .select('*')
          .single()
      );
      created += 1;
    }
    return created;
  }
}
