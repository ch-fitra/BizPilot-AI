import { Router } from 'express';
import { runSupabaseQuery } from '../db/supabaseClient';

const router = Router();

function healthLabel(score: number | null): 'healthy' | 'warning' | 'critical' | 'no_data' {
  if (score === null) return 'no_data';
  if (score >= 75) return 'healthy';
  if (score >= 45) return 'warning';
  return 'critical';
}

router.get('/founder-dashboard/summary', async (req, res) => {
  try {
    const businessId = req.businessId as string | undefined;
    if (!businessId) return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });

    const today = new Date().toISOString().split('T')[0];
    const metric = await runSupabaseQuery<any | null>('founder.metric.today', (supabase) =>
      supabase.from('business_daily_metrics').select('*').eq('business_id', businessId).eq('metric_date', today).maybeSingle()
    );
    const baselineMetrics = await runSupabaseQuery<any[]>('founder.metric.baseline', (supabase) =>
      supabase.from('business_daily_metrics').select('revenue,expenses,profit,transaction_count').eq('business_id', businessId).lt('metric_date', today).order('metric_date', { ascending: false }).limit(7)
    );
    const alerts = await runSupabaseQuery<any[]>('founder.alerts', (supabase) =>
      supabase.from('business_alerts').select('*').eq('business_id', businessId).eq('status', 'active').order('created_at', { ascending: false }).limit(10)
    );
    const scans = await runSupabaseQuery<any[]>('founder.scans', (supabase) =>
      supabase.from('nota_scans').select('confidence,scan_date').eq('business_id', businessId).gte('scan_date', `${today}T00:00:00.000Z`).lte('scan_date', `${today}T23:59:59.999Z`)
    );
    const voiceTx = await runSupabaseQuery<any[]>('founder.voice', (supabase) =>
      supabase.from('voice_transactions').select('created_at').eq('business_id', businessId).gte('created_at', `${today}T00:00:00.000Z`).lte('created_at', `${today}T23:59:59.999Z`).order('created_at', { ascending: false })
    );
    const memories = await runSupabaseQuery<any[]>('founder.memories', (supabase) =>
      supabase.from('business_memories').select('id,memory_type,title,importance_score,period_start,period_end,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(3)
    );
    const link = await runSupabaseQuery<any | null>('founder.wa.link', (supabase) =>
      supabase.from('whatsapp_business_links').select('id,phone_last4').eq('business_id', businessId).eq('status', 'active').maybeSingle()
    );
    const waInbound = await runSupabaseQuery<any | null>('founder.wa.last.inbound', (supabase) =>
      supabase.from('whatsapp_logs').select('sent_at').eq('business_id', businessId).eq('direction', 'inbound').order('sent_at', { ascending: false }).limit(1).maybeSingle()
    );
    const waPending = await runSupabaseQuery<any[]>('founder.wa.pending', (supabase) =>
      supabase.from('whatsapp_pending_actions').select('id').eq('business_id', businessId).eq('status', 'pending').gt('expires_at', new Date().toISOString())
    );

    const avgConfidence = scans.length > 0 ? scans.reduce((s, r) => s + Number(r.confidence || 0), 0) / scans.length : null;
    const lowConfidenceCount = scans.filter((s) => Number(s.confidence || 0) < 0.6).length;
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
    const highAlerts = alerts.filter((a) => a.severity === 'high').length;

    const hasData = !!metric || scans.length > 0 || voiceTx.length > 0 || alerts.length > 0;
    const hasBaseline = (baselineMetrics || []).length >= 4;
    let score: number | null = null;
    const factors: string[] = [];
    
    const revenue = Number(metric?.revenue || 0);
    const profit = Number(metric?.profit || 0);
    const transactionCount = Number(metric?.transaction_count || 0);
    
    // Cegah "early-stage low score" jika data belum memadai
    const isSufficientData = hasBaseline || revenue > 0 || transactionCount >= 3;

    if (hasData && isSufficientData) {
      const avgBaseRevenue = hasBaseline ? (baselineMetrics.reduce((s, m) => s + Number(m.revenue || 0), 0) / baselineMetrics.length) : 0;
      score = 0;
      score += hasBaseline ? (revenue >= avgBaseRevenue * 0.8 ? 25 : revenue > 0 ? 12 : 5) : (revenue > 0 ? 18 : 5);
      score += profit >= 0 ? 20 : 5;
      score += Math.max(0, 25 - (criticalAlerts * 12 + highAlerts * 6));
      score += avgConfidence === null ? 7 : Math.round(avgConfidence * 15);
      score += (transactionCount > 0 || scans.length > 0 || voiceTx.length > 0) ? 15 : 3;
      score = Math.max(0, Math.min(100, score));
      if (revenue <= 0) factors.push('Belum ada pendapatan hari ini');
      if (profit < 0) factors.push('Profit hari ini negatif');
      if (criticalAlerts > 0) factors.push(`${criticalAlerts} alert kritis aktif`);
      if (avgConfidence !== null && avgConfidence < 0.65) factors.push('Kualitas OCR masih rendah');
      if (!hasBaseline) factors.push('Data historis belum cukup, skor masih fase awal');
    } else if (hasData) {
      factors.push('Data operasional masih terlalu sedikit untuk diukur skor kesehatannya.');
    }

    const recommendedActions = [
      ...(alerts.slice(0, 2).map((a) => ({ text: a.message, source: a.type }))),
      ...(Number(metric?.transaction_count || 0) === 0 ? [{ text: 'Coba Warung Mode untuk input cepat hari ini.', source: 'activity' }] : []),
      ...(scans.length === 0 ? [{ text: 'Upload nota pertama Anda agar laporan harian lebih akurat.', source: 'ocr' }] : []),
    ].slice(0, 4);

    return res.json({
      success: true,
      businessHealthScore: { score, status: healthLabel(score), factors },
      today: {
        revenue: Number(metric?.revenue || 0),
        expenses: Number(metric?.expenses || 0),
        profit: Number(metric?.profit || 0),
        transactionCount: Number(metric?.transaction_count || 0),
        averageTransactionValue: Number(metric?.average_transaction_value || 0),
      },
      alerts,
      ocrQuality: { averageConfidence: avgConfidence, lowConfidenceCount, totalScans: scans.length },
      warungMode: { todayTransactions: voiceTx.length, lastTransactionAt: voiceTx[0]?.created_at || null },
      whatsapp: { linked: !!link, linkedPhoneLast4: link?.phone_last4 || null, lastInboundAt: waInbound?.sent_at || null, pendingActions: waPending.length },
      memoryHighlights: memories || [],
      recommendedActions,
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal memuat founder dashboard summary.' });
  }
});

export default router;
