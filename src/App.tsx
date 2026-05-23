import React, { useState } from 'react';
import { Compass, Sparkles, Building2, HelpCircle, RefreshCw, Star, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessHealthState } from './types';
import { DEFAULT_BUSINESS_STATE } from './utils/defaultData';
import UploadZone from './components/UploadZone';
import ThinkingFeed from './components/ThinkingFeed';
import HealthScoreCard from './components/HealthScoreCard';
import DashboardCharts from './components/DashboardCharts';
import ActionPlans from './components/ActionPlans';

export default function App() {
  const [businessState, setBusinessState] = useState<BusinessHealthState>(DEFAULT_BUSINESS_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'info' | 'error'>('info');
  const [showStatus, setShowStatus] = useState(false);

  const handleResetDemo = () => {
    setBusinessState(DEFAULT_BUSINESS_STATE);
    setErrorBanner(null);
    setBannerType('info');
  };

  const handleAnalyzeData = async (payload: {
    fileData?: string;
    fileName?: string;
    fileType?: string;
    textInput?: string;
    businessType: string;
  }) => {
    setIsLoading(true);
    setErrorBanner(null);
    
    try {
      // Trigger a network payload request to the Express API backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setBusinessState(result.data);
        setBannerType('info');
        setErrorBanner(`Co-Pilot sukses menganalisis data untuk bisnis ${payload.businessType}! Dasbor & Rencana Aksi Harian diperbarui secara otomatis.`);
        
        // Auto fade success informational prompt
        setTimeout(() => {
          setErrorBanner(null);
        }, 6000);
      } else {
        setBannerType('error');
        setErrorBanner(result.error || 'Server-side analysis error encountered. Please check credentials or payload length.');
      }
    } catch (err: any) {
      console.error(err);
      setBannerType('error');
      setErrorBanner(
        err?.message || 'Gagal terhubung ke modul analitik backend. Mohon pastikan Server sedang berjalan.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Glow decorative graphics */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Primary Top Navigation bar */}
      <header className="border-b border-slate-900 bg-[#070913]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand Group */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-2xl bg-[#090b16] flex items-center justify-center">
                <Compass className="w-5 h-5 text-indigo-400 shrink-0" />
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-sans font-black tracking-tight text-lg text-slate-100 uppercase">
                  BizPilot<span className="text-indigo-400">.AI</span>
                </span>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold uppercase">
                  Copilot
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Autonomous Intelligent COO
              </span>
            </div>
          </div>

          {/* Quick-Stats status block */}
          <div className="hidden md:flex items-center gap-5">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block">LOKASI UMKM</span>
              <span className="text-xs font-semibold text-slate-300">Jakarta, Indonesia</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block">HARI ANALISIS AI</span>
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Real-time / 2026
              </span>
            </div>
            
            <a
              href="#bizpilot-upload-panel"
              className="text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-indigo-400 transition px-3.5 py-2 rounded-xl"
            >
              Analyze Data
            </a>
          </div>

        </div>
      </header>

      {/* Main Content Layout grid container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        
        {/* Futuristic Platform Pitch / Branding Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold"
          >
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            The Autonomous Business Copilot for Indonesian MSMEs
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 leading-tight"
          >
            Ubah Data Berantakan Menjadi <br/>
            Kecerdasan Bisnis Operasional.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm md:text-base text-slate-400 leading-relaxed font-sans"
          >
            BizPilot AI bertindak seperti COO (Chief Operating Officer) otonom Anda. Unggah riwayat penjualan, foto struk kasir, ulasan Google Maps, atau screenshot whatsapp ojek online. AI kami akan memproses data tersebut seketika dan mengkalibrasinya menjadi strategi operasional harian.
          </motion.p>
        </div>

        {/* Dynamic Toast / Alerts Banner Block */}
        <AnimatePresence>
          {errorBanner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`border p-4.5 rounded-3xl backdrop-blur-md shadow-lg flex items-start gap-3.5 max-w-4xl mx-auto text-left relative overflow-hidden ${
                bannerType === 'error'
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {bannerType === 'error' ? (
                  <AlertCircle className="w-5.5 h-5.5 text-rose-400" />
                ) : (
                  <CheckCircle className="w-5.5 h-5.5 text-emerald-400" />
                )}
              </div>
              
              <div className="flex-grow space-y-1 pr-6">
                <h4 className="font-semibold text-sm">
                  {bannerType === 'error' ? 'Sistem Terkendala' : 'Informasi Co-Pilot'}
                </h4>
                <p className="text-xs leading-relaxed opacity-90 font-sans">
                  {errorBanner}
                </p>
                {bannerType === 'error' && errorBanner.includes('GEMINI_API_KEY') && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-black/40 border border-slate-800 text-slate-350 text-[11px] font-mono leading-relaxed">
                    <span className="text-[#6366f1] font-bold">Langkah Pemulihan:</span> Buka panel <span className="font-semibold text-slate-100">Settings &gt; Secrets</span> di bagian pojok kanan atas layar AI Studio Anda. Tambahkan variabel dengan nama <span className="text-slate-100 bg-slate-820 px-1 py-0.5 rounded">GEMINI_API_KEY</span> lalu masukkan kunci API Gemini gratis Anda. Sistem akan langsung memulihkan secara otomatis.
                  </div>
                )}
              </div>

              {/* Close Button element */}
              <button
                onClick={() => setErrorBanner(null)}
                className="absolute top-4 right-4 text-xs font-mono opacity-60 hover:opacity-100 hover:text-indigo-400 transition"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Multimodal Upload Workspace Zone Component */}
        <UploadZone onAnalyze={handleAnalyzeData} isLoading={isLoading} />

        {/* 2. Interactive AI Reasoning Log component */}
        <ThinkingFeed isVisible={isLoading} />

        {/* 3. Render Dashboard blocks only when loader completes */}
        {!isLoading && (
          <div className="space-y-8">
            
            {/* Health Score Segment header */}
            <div className="flex items-center gap-2 pt-6">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg md:text-xl font-bold text-slate-200 font-sans">
                Status Diagnostik Bisnis Anda (Indeks Kesehatan)
              </h2>
            </div>

            {/* Health Score Gauge and Bento summaries */}
            <HealthScoreCard
              score={businessState.health_score}
              summary={businessState.health_summary}
              strengths={businessState.strengths}
              risks={businessState.risks}
              trend={businessState.sales_trend}
              onReset={handleResetDemo}
            />

            {/* Graphics segment Header */}
            <div className="flex items-center gap-2 pt-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg md:text-xl font-bold text-slate-200 font-sans">
                Dasbor Kontrol Keuangan & Peringatan Logistik
              </h2>
            </div>

            {/* Charts, Tables, Alerts, Sentiment Topic Ratings */}
            <DashboardCharts
              salesData={businessState.sales_data}
              topProducts={businessState.top_products}
              reviewsSummary={businessState.customer_reviews_summary}
              alerts={businessState.alerts}
            />

            {/* Action Plans segment */}
            <ActionPlans actionItems={businessState.action_plan} />

          </div>
        )}

      </main>

      {/* Platform Professional Footer */}
      <footer className="border-t border-slate-900 bg-[#04060e] py-10 mt-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 mb-1.5 opacity-65">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span className="font-bold tracking-widest text-[#6366f1] uppercase">BizPilot AI</span>
        </div>
        <p className="font-sans max-w-md opacity-85 leading-relaxed">
          The Autonomous Business Chief Operating Officer platform for Indonesian UMKM (Mikro, Kecil, dan Menengah).
        </p>
        <p className="font-mono mt-4 opacity-50">
          © 2026 BizPilot AI. All rights reserved. Precision-engineered for operational intelligence.
        </p>
      </footer>
    </div>
  );
}
