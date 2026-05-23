import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Flag, Sparkles } from 'lucide-react';
import { logClientEvent } from '../utils/errorHandler';

interface GuidedDemoOverlayProps {
  open: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export const GuidedDemoOverlay: React.FC<GuidedDemoOverlayProps> = ({
  open,
  onClose,
  setActiveTab
}) => {
  const [index, setIndex] = useState(0);

  const steps = useMemo(() => [
    {
      title: 'Business Health Overview',
      tab: 'overview',
      body: 'Mulai dari ringkasan kondisi bisnis, health score, sinyal risiko, dan peluang omzet tujuh hari.'
    },
    {
      title: 'AI Analyzer',
      tab: 'ai_analyzer',
      body: 'Tunjukkan bagaimana BizPilot AI menerima data manual, file, atau gambar untuk menghasilkan insight operasional.'
    },
    {
      title: 'Forecasting Risk',
      tab: 'forecasting_risk',
      body: 'Buka prediksi omzet, risiko stok habis, confidence forecast, dan rekomendasi taktis berbasis data.'
    },
    {
      title: 'CRM Leads',
      tab: 'crm',
      body: 'Perlihatkan pipeline prospek, hot leads, estimasi nilai deal, dan tindak lanjut yang terlambat.'
    },
    {
      title: 'WhatsApp Automation',
      tab: 'notifications_automation',
      body: 'Demo mode memakai simulasi WhatsApp bila token belum tersedia, aman untuk presentasi tanpa secret live.'
    },
    {
      title: 'Reports Export',
      tab: 'reports',
      body: 'Tunjukkan ekspor PDF, CSV, dan share link laporan meskipun data kosong atau masih berupa demo.'
    },
    {
      title: 'AI Business Chat',
      tab: 'chat',
      body: 'Akhiri dengan tanya jawab strategi bisnis berbasis konteks workspace aktif dan guardrail angka.'
    }
  ], []);

  const current = steps[index];

  useEffect(() => {
    if (!open) return;
    setActiveTab(current.tab);
    logClientEvent('guided_demo_step_viewed', { step: current.title, tab: current.tab });
  }, [current, open, setActiveTab]);

  if (!open) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const finish = () => {
    logClientEvent('guided_demo_finished', { totalSteps: steps.length });
    setIndex(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
      <section className="pointer-events-auto fixed left-1/2 bottom-4 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-indigo-500/25 bg-[#0b0f1d]/95 shadow-2xl shadow-black/50 p-4 sm:p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">
                Demo Step {index + 1} dari {steps.length}
              </p>
              <h3 className="text-sm font-black text-slate-100 mt-1">{current.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{current.body}</p>
            </div>
          </div>
          <button
            onClick={finish}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition"
            title="Skip demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {steps.map((step, stepIndex) => (
              <span
                key={step.title}
                className={`h-1.5 rounded-full transition-all ${stepIndex === index ? 'w-8 bg-indigo-400' : 'w-2 bg-slate-700'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={isFirst}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={() => (isLast ? finish() : setIndex(index + 1))}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {isLast ? (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  Finish Demo
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
