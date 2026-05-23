import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Play, RotateCcw, Sparkles } from 'lucide-react';
import { DemoScenarioCard } from './DemoScenarioCard';

interface JudgeDemoLauncherProps {
  onScenarioLoaded: () => void;
}

const scenarios = [
  {
    id: 'kopi',
    title: 'Kedai Kopi Selaras',
    type: 'F&B Cafe',
    desc: 'Stok biji kopi Arabika Gayo kritis dan antrean kasir mulai menekan rating layanan.'
  },
  {
    id: 'laundry',
    title: 'Bersih Kilat Laundry',
    type: 'Jasa Laundry',
    desc: 'Heater mesin pengering No. 3 bermasalah dan parfum premium hampir habis.'
  },
  {
    id: 'fashion',
    title: 'Batik Kirana Collection',
    type: 'Retail Fashion',
    desc: 'Cart abandonment e-commerce tinggi dan follow-up WhatsApp perlu diotomatisasi.'
  },
  {
    id: 'warung',
    title: 'Warung Makan Bu Djoko',
    type: 'Warung Makan',
    desc: 'Food waste menu bersantan malam hari dan kenaikan harga bahan pokok.'
  }
];

export const JudgeDemoLauncher: React.FC<JudgeDemoLauncherProps> = ({ onScenarioLoaded }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('kopi');
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('bizpilot_token');
    const activeBizId = localStorage.getItem('bizpilot_active_business_id');

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeBizId ? { 'x-business-id': activeBizId } : {})
    };
  };

  const handleStartDemo = async () => {
    setLoading(true);
    setErr(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/demo/start', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scenarioId: selectedScenario })
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error?.message || 'Gagal menyiapkan data demo juri.');
      }

      const label = scenarios.find((scenario) => scenario.id === selectedScenario)?.title || selectedScenario;
      setSuccessMsg(`Skenario "${label}" berhasil dimuat. Dashboard sedang disinkronkan.`);
      setTimeout(() => {
        onScenarioLoaded();
        setSuccessMsg(null);
      }, 1200);
    } catch (e: any) {
      setErr(e.message || 'Error jaringan menghubungi modul seeder.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    setErr(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error?.message || 'Gagal mereset data demo juri.');
      }

      setSuccessMsg('Demo reset berhasil. Workspace aktif dikembalikan ke template awal.');
      setTimeout(() => {
        onScenarioLoaded();
        setSuccessMsg(null);
      }, 1200);
    } catch (e: any) {
      setErr(e.message || 'Error jaringan menghubungi modul seeder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0f1322]/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden font-sans text-left">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">Judge Demo Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-2xl">
              Pilih skenario UMKM siap presentasi. Sistem akan mengisi business profile, history, CRM, forecast,
              notifikasi, report, action plan, dan saran chat untuk workspace aktif.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
        {scenarios.map((scenario) => (
          <DemoScenarioCard
            key={scenario.id}
            title={scenario.title}
            type={scenario.type}
            description={scenario.desc}
            selected={selectedScenario === scenario.id}
            onSelect={() => setSelectedScenario(scenario.id)}
          />
        ))}
      </div>

      {err && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex items-start gap-2 text-xs text-rose-300 mb-4">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-start gap-2 text-xs text-emerald-300 mb-4">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={handleStartDemo}
          disabled={loading}
          className="flex-1 min-h-11 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {loading ? 'Menyiapkan...' : 'Start Judge Demo'}
        </button>
        <button
          type="button"
          onClick={handleResetDemo}
          disabled={loading}
          className="min-h-11 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          title="Reset data demo workspace aktif"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo
        </button>
      </div>
    </section>
  );
};
