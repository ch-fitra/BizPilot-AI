import React from 'react';
import { AlertTriangle, CheckCircle2, MessageSquare, Mic, Receipt, Sparkles } from 'lucide-react';
import DashboardSkeleton from './skeletons/DashboardSkeleton';
import { PassiveIntelligenceClient } from '../services/passiveIntelligenceService';

interface OverviewTabProps {
  setActiveTab: (tab: string) => void;
  hasProfile?: boolean;
}

function rupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0));
}

export default function OverviewTab({ setActiveTab, hasProfile = true }: OverviewTabProps) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-dashboard/summary');
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (hasProfile) void load();
  }, [hasProfile]);

  const runNow = async () => {
    setRunning(true);
    try {
      await PassiveIntelligenceClient.runAnalysis();
      await load();
    } finally {
      setRunning(false);
    }
  };

  if (!hasProfile) return <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">Lengkapi profil bisnis dulu di Settings.</div>;
  if (loading) return <DashboardSkeleton />;
  if (!data) return <div className="p-6 rounded-2xl border border-slate-800 text-xs text-slate-400">Belum ada data hari ini.</div>;

  const health = data.businessHealthScore;
  const statusColor = health.status === 'healthy' ? 'text-emerald-400' : health.status === 'warning' ? 'text-amber-400' : health.status === 'critical' ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-[#121622] border border-slate-850">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Business Health Score</p>
        <div className="mt-2 flex items-center justify-between">
          <p className={`text-3xl font-black ${statusColor}`}>{health.score ?? '--'}</p>
          <span className={`text-[10px] font-mono uppercase ${statusColor}`}>{health.status}</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">{(health.factors || []).join(' • ') || 'Belum ada data'}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850"><p className="text-[10px] text-slate-500">Pendapatan Hari Ini</p><p className="text-sm font-bold text-slate-100 mt-1">{rupiah(data.today.revenue)}</p></div>
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850"><p className="text-[10px] text-slate-500">Pengeluaran Hari Ini</p><p className="text-sm font-bold text-slate-100 mt-1">{rupiah(data.today.expenses)}</p></div>
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850"><p className="text-[10px] text-slate-500">Estimasi Profit</p><p className="text-sm font-bold text-slate-100 mt-1">{rupiah(data.today.profit)}</p></div>
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850"><p className="text-[10px] text-slate-500">Jumlah Transaksi</p><p className="text-sm font-bold text-slate-100 mt-1">{data.today.transactionCount}</p></div>
      </div>

      <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850">
        <p className="text-[10px] font-mono uppercase text-slate-500">Passive Intelligence Alerts</p>
        <div className="mt-2 space-y-2">
          {(data.alerts || []).slice(0, 4).map((a: any) => (
            <div key={a.id} className="text-xs text-slate-300 flex items-start gap-2">
              {a.severity === 'critical' || a.severity === 'high' ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5" />}
              <span>{a.message}</span>
            </div>
          ))}
          {(data.alerts || []).length === 0 && <p className="text-xs text-slate-500">Belum ada alert aktif.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850 text-xs text-slate-300">
          OCR Quality: {data.ocrQuality.totalScans === 0 ? 'Upload nota pertama Anda' : `Confidence ${(Number(data.ocrQuality.averageConfidence || 0) * 100).toFixed(0)}% • Low ${data.ocrQuality.lowConfidenceCount}`}
        </div>
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850 text-xs text-slate-300">
          WhatsApp: {data.whatsapp.linked ? `Terhubung (${data.whatsapp.linkedPhoneLast4 || '****'})` : 'Belum terhubung'} • Pending {data.whatsapp.pendingActions}
        </div>
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850 text-xs text-slate-300">
          Warung Mode hari ini: {data.warungMode.todayTransactions} transaksi
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850">
        <p className="text-[10px] font-mono uppercase text-slate-500">Business Memory Highlights</p>
        <div className="mt-2 space-y-1">
          {(data.memoryHighlights || []).map((m: any) => <p key={m.id} className="text-xs text-slate-300">{m.title}</p>)}
          {(data.memoryHighlights || []).length === 0 && <p className="text-xs text-slate-500">Belum ada memory bisnis.</p>}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850">
        <p className="text-[10px] font-mono uppercase text-slate-500">Recommended Next Actions</p>
        <div className="mt-2 space-y-1">
          {(data.recommendedActions || []).map((r: any, i: number) => <p key={i} className="text-xs text-slate-300">{r.text}</p>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setActiveTab('ocr_nota')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1"><Receipt className="w-3.5 h-3.5" />Upload Nota</button>
        <button onClick={() => setActiveTab('warung_mode')} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1"><Mic className="w-3.5 h-3.5" />Warung Mode</button>
        <button onClick={runNow} disabled={running} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1"><Sparkles className="w-3.5 h-3.5" />{running ? 'Memproses...' : 'Analisis Sekarang'}</button>
        <button onClick={() => setActiveTab('business_memory')} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Business Memory</button>
      </div>
    </div>
  );
}
