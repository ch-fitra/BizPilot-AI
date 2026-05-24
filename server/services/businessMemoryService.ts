import { GoogleGenAI } from '@google/genai';
import { runSupabaseQuery } from '../db/supabaseClient';

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIM = Number(process.env.GEMINI_EMBEDDING_DIM || 768);
const MAX_MEMORIES_CONTEXT = 5;

type MemoryType = 'weekly_summary' | 'monthly_summary';

interface RetrieveOptions {
  limit?: number;
}

function toIsoDate(input: Date): string {
  return input.toISOString().split('T')[0];
}

function sanitizeText(value: string, max = 3000): string {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function embedText(text: string): Promise<number[] | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const response: any = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [{ parts: [{ text }] }],
    });
    const values = response?.embeddings?.[0]?.values;
    return Array.isArray(values) && values.length > 0 ? values : null;
  } catch {
    return null;
  }
}

function validateEmbeddingDimension(embedding: number[] | null): { usable: number[] | null; status: 'ok' | 'failed' | 'dimension_mismatch'; actualDim: number | null } {
  if (!embedding || embedding.length === 0) {
    return { usable: null, status: 'failed', actualDim: null };
  }

  if (embedding.length !== EMBEDDING_DIM) {
    const safeMessage = `Embedding dimension mismatch model=${EMBEDDING_MODEL} expected=${EMBEDDING_DIM} actual=${embedding.length}`;
    console.warn(`[BUSINESS-MEMORY] ${safeMessage}`);
    return { usable: null, status: 'dimension_mismatch', actualDim: embedding.length };
  }

  return { usable: embedding, status: 'ok', actualDim: embedding.length };
}

function computeImportance(avgRevenue: number, avgProfit: number, avgExpenses: number, warningCount: number): number {
  const volatility = avgRevenue === 0 ? 0 : Math.min(100, Math.abs(avgProfit) / Math.max(1, avgRevenue) * 100);
  const expensePressure = avgRevenue === 0 ? 0 : Math.min(100, avgExpenses / Math.max(1, avgRevenue) * 100);
  return Number((volatility * 0.5 + expensePressure * 0.3 + warningCount * 5 * 0.2).toFixed(2));
}

export class BusinessMemoryService {
  static async generatePeriodMemory(businessId: string, memoryType: MemoryType): Promise<{ created: boolean; degradedEmbedding: boolean }> {
    const today = new Date();
    const periodEnd = new Date(today);
    periodEnd.setDate(periodEnd.getDate() - 1);
    if (memoryType === 'monthly_summary') periodEnd.setDate(1);

    const periodStart = new Date(periodEnd);
    if (memoryType === 'weekly_summary') periodStart.setDate(periodEnd.getDate() - 6);
    else periodStart.setMonth(periodEnd.getMonth() - 1);

    const startDate = toIsoDate(periodStart);
    const endDate = toIsoDate(periodEnd);

    const metrics = await runSupabaseQuery<any[]>('business_memory.metrics.range', (supabase) =>
      supabase.from('business_daily_metrics').select('*').eq('business_id', businessId).gte('metric_date', startDate).lte('metric_date', endDate).order('metric_date', { ascending: true })
    );

    if (!metrics || metrics.length === 0) return { created: false, degradedEmbedding: true };

    const alerts = await runSupabaseQuery<any[]>('business_memory.alerts.range', (supabase) =>
      supabase.from('business_alerts').select('type,severity,created_at').eq('business_id', businessId).gte('created_at', `${startDate}T00:00:00.000Z`).lte('created_at', `${endDate}T23:59:59.999Z`)
    );

    const avgRevenue = metrics.reduce((s, m) => s + Number(m.revenue || 0), 0) / metrics.length;
    const avgExpenses = metrics.reduce((s, m) => s + Number(m.expenses || 0), 0) / metrics.length;
    const avgProfit = metrics.reduce((s, m) => s + Number(m.profit || 0), 0) / metrics.length;
    const txTotal = metrics.reduce((s, m) => s + Number(m.transaction_count || 0), 0);
    const ocrWarnings = metrics.flatMap((m) => (Array.isArray(m.warnings) ? m.warnings : [])).filter((w) => w === 'ocr_quality_low').length;
    const alertMap = new Map<string, number>();
    for (const a of alerts || []) alertMap.set(a.type, (alertMap.get(a.type) || 0) + 1);
    const topAlert = [...alertMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const topProducts = Array.isArray(metrics[metrics.length - 1]?.top_products) ? metrics[metrics.length - 1].top_products.slice(0, 3) : [];

    const title = memoryType === 'weekly_summary' ? `Ringkasan Mingguan ${startDate} s/d ${endDate}` : `Ringkasan Bulanan sampai ${endDate}`;
    const content = sanitizeText(
      [
        `Periode ${startDate} sampai ${endDate}.`,
        `Rata-rata pendapatan ${Math.round(avgRevenue)} IDR, rata-rata pengeluaran ${Math.round(avgExpenses)} IDR, rata-rata profit ${Math.round(avgProfit)} IDR.`,
        `Total transaksi periode: ${txTotal}.`,
        topProducts.length > 0 ? `Produk menonjol: ${topProducts.map((p: any) => `${p.name} (${Math.round(Number(p.revenue || 0))} IDR)`).join(', ')}.` : 'Produk menonjol: tidak tersedia.',
        topAlert ? `Alert berulang: ${topAlert[0]} sebanyak ${topAlert[1]} kali.` : 'Tidak ada alert berulang signifikan.',
        `Kualitas OCR rendah terdeteksi ${ocrWarnings} kali.`,
      ].join(' ')
    );

    const rawEmbedding = await embedText(content);
    const embeddingState = validateEmbeddingDimension(rawEmbedding);
    const degradedEmbedding = embeddingState.status !== 'ok';
    const importanceScore = computeImportance(avgRevenue, avgProfit, avgExpenses, (alerts || []).length);

    await runSupabaseQuery<any>('business_memory.upsert', (supabase) =>
      supabase.from('business_memories').upsert({
        business_id: businessId,
        memory_type: memoryType,
        title,
        content,
        metric_snapshot: {
          avg_revenue: Math.round(avgRevenue),
          avg_expenses: Math.round(avgExpenses),
          avg_profit: Math.round(avgProfit),
          total_transactions: txTotal,
          ocr_quality_low_count: ocrWarnings,
          top_alert_type: topAlert?.[0] || null,
          top_alert_count: topAlert?.[1] || 0,
          embedding_status: embeddingState.status,
          embedding_model: EMBEDDING_MODEL,
          embedding_dim: embeddingState.actualDim,
        },
        // If changing embedding model with a different dimension, create a new migration to alter vector dimension and rebuild index.
        embedding: embeddingState.usable ? `[${embeddingState.usable.join(',')}]` : null,
        source: 'passive_intelligence',
        period_start: startDate,
        period_end: endDate,
        importance_score: importanceScore,
      }, { onConflict: 'business_id,memory_type,period_start,period_end' }).select('id').single()
    );

    return { created: true, degradedEmbedding };
  }

  static async retrieveRelevantMemories(businessId: string, query: string, options: RetrieveOptions = {}) {
    const limit = Math.min(Math.max(options.limit || 5, 1), MAX_MEMORIES_CONTEXT);
    const cleanQuery = sanitizeText(query, 500);
    const queryEmbeddingRaw = await embedText(cleanQuery);
    const queryEmbeddingState = validateEmbeddingDimension(queryEmbeddingRaw);
    let memories: any[] = [];

    if (queryEmbeddingState.usable) {
      memories = await runSupabaseQuery<any[]>('business_memory.vector.search', (supabase) =>
        supabase.rpc('match_business_memories', {
          p_business_id: businessId,
          p_query_embedding: `[${queryEmbeddingState.usable.join(',')}]`,
          p_match_count: limit,
        })
      );
    }

    if (!memories || memories.length === 0) {
      const keywords = cleanQuery.split(/\s+/).filter((k) => k.length >= 3).slice(0, 5).join(' | ');
      memories = await runSupabaseQuery<any[]>('business_memory.keyword.search', (supabase) =>
        supabase.from('business_memories').select('id,memory_type,title,content,period_start,period_end,importance_score,created_at').eq('business_id', businessId).or(`title.ilike.%${keywords}%,content.ilike.%${keywords}%`).order('created_at', { ascending: false }).limit(limit)
      );
    }

    await runSupabaseQuery<any>('memory_retrieval_logs.insert', (supabase) =>
      supabase.from('memory_retrieval_logs').insert({
        business_id: businessId,
        query_text: cleanQuery,
        matched_memory_ids: (memories || []).map((m) => m.id),
      }).select('id').single()
    );

    return memories || [];
  }

  static async listMemories(businessId: string, page = 1, pageSize = 10) {
    const offset = Math.max(0, (page - 1) * pageSize);
    return runSupabaseQuery<any[]>('business_memory.list', (supabase) =>
      supabase.from('business_memories').select('id,memory_type,title,content,period_start,period_end,importance_score,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)
    );
  }
}
