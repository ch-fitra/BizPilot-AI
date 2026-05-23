import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, Calendar, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ForecastSnapshot } from '../types/forecast';
import { ForecastService } from '../services/forecastService';
import ForecastConfidenceBadge from './ForecastConfidenceBadge';
import ForecastOverviewCards from './ForecastOverviewCards';
import SalesForecastChart from './SalesForecastChart';
import InventoryStockoutForecast from './InventoryStockoutForecast';
import CRMClosingForecast from './CRMClosingForecast';
import BusinessRiskRadar from './BusinessRiskRadar';
import ForecastScenarioSimulator from './ForecastScenarioSimulator';
import ChartSkeleton from './skeletons/ChartSkeleton';

interface ForecastingTabProps {
  businessState: any; // BusinessHealthState type passed down in index/App
  setActiveTab: (tab: string) => void;
}

export default function ForecastingTab({ businessState, setActiveTab }: ForecastingTabProps) {
  const [selectedRange, setSelectedRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [snapshot, setSnapshot] = useState<ForecastSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currency = businessState?.profile?.currency || 'IDR';

  // Fetch the latest snapshot profile on tab selection
  const fetchLatestForecast = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const latest = await ForecastService.getLatestSnapshot();
      if (latest) {
        setSnapshot(latest);
        setSelectedRange(latest.forecast_range);
      } else {
        // Trigger default initial 7d on demand if server returned empty
        const defaultFresh = await ForecastService.generateSnapshot('7d');
        setSnapshot(defaultFresh);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Sistem gagal memuat modul prediksi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestForecast();
  }, []);

  // Handle manual trigger run
  const handleGenerateNew = async (range: '7d' | '14d' | '30d') => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const fresh = await ForecastService.generateSnapshot(range);
      if (fresh) {
        setSnapshot(fresh);
        setSelectedRange(range);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal memperbaharui peramalan kecerdasan prediktif: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH RANGE CONFIGS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/20 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 font-bold tracking-wider uppercase">MODUL INTEL-AI</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 flex-none" />
              <span>Diperbarui {snapshot ? new Date(snapshot.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}</span>
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-sans text-white tracking-tight mt-1">Forecasting & Risk AI Pro</h2>
          <p className="text-xs text-slate-400 mt-1">Gunakan analisis prediktif berbasis machine learning dan rule-based de-escalation untuk memproyeksikan omzet, stockout, dan CRM deal</p>
        </div>

        {/* TIME RANGE SELECTOR BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-1">
            <button 
              onClick={() => handleGenerateNew('7d')}
              disabled={isGenerating || isLoading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${selectedRange === '7d' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              7 Hari
            </button>
            <button 
              onClick={() => handleGenerateNew('14d')}
              disabled={isGenerating || isLoading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${selectedRange === '14d' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              14 Hari
            </button>
            <button 
              onClick={() => handleGenerateNew('30d')}
              disabled={isGenerating || isLoading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${selectedRange === '30d' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              30 Hari
            </button>
          </div>

          <button 
            onClick={() => handleGenerateNew(selectedRange)}
            disabled={isGenerating || isLoading}
            className="p-2.5 rounded-xl border border-slate-850 bg-slate-900 text-indigo-200 hover:bg-slate-800 hover:text-white transition-all duration-200 relative group shrink-0"
            title="Hitung ulang proyeksi"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-all duration-500'}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Galat Sistem Terjadi:</span>
            <p className="mt-1 text-slate-300 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <ChartSkeleton />
      ) : snapshot ? (
        <div className="space-y-6">
          {/* CONFIDENCE ACCURACY CARD */}
          <ForecastConfidenceBadge level={snapshot.confidence_level} />

          {/* OVERVIEW STATS GRID CARDS */}
          <ForecastOverviewCards snapshot={snapshot} currency={currency} />

          {/* PRIMARY TREND LINE CHART */}
          <SalesForecastChart data={snapshot.sales_forecast} currency={currency} />

          {/* PARALLEL FORECASTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryStockoutForecast items={snapshot.inventory_forecast} />
            <CRMClosingForecast leads={snapshot.crm_forecast} currency={currency} />
          </div>

          {/* FIVE PILAR THREAT SHIELDS MAP CARD */}
          <BusinessRiskRadar radar={snapshot.risk_radar} />

          {/* AI NARRATIVE RISK INTERPRETATIVE PANEL */}
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-850">
              <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase">AI Risk Interpretation & Mitigation Action Plans</h3>
                <p className="text-xs text-slate-400">Rangkuman naratif dan rekomendasi prioritas tindakan penurunan indeks risiko dari BizPilot AI</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Why Matters & Causes */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block mb-1">MENGAPA INI PENTING</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    "{snapshot.ai_recommendations.whyMatters}"
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block mb-2">IDENTIFIKASI PENYEBAB UTAMA</span>
                  <ul className="space-y-2">
                    {snapshot.ai_recommendations.causes.map((cause, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-slate-400 items-start font-medium">
                        <span className="text-rose-400 mt-0.5">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Steps to execute */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 24 Hours step */}
                <div className="p-4.5 rounded-xl border border-rose-500/10 bg-rose-500/5 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider mb-2">SEGERA: 24 Jam Pertama</span>
                    <ul className="space-y-2.5">
                      {snapshot.ai_recommendations.shortTerm.map((st, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start font-medium leading-relaxed">
                          <span className="font-bold text-rose-400 flex-none">{idx + 1}.</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => setActiveTab('actionPlan')}
                    className="mt-4 flex items-center justify-end text-[10px] text-rose-400 hover:text-rose-300 font-bold tracking-wider gap-1"
                  >
                    Eksploitasi Aksi Kerja <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 7 Days step */}
                <div className="p-4.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-2">TAKTIK: Rentang 7 Hari</span>
                    <ul className="space-y-2.5">
                      {snapshot.ai_recommendations.mediumTerm.map((mt, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start font-medium leading-relaxed">
                          <span className="font-bold text-indigo-400 flex-none">{idx + 1}.</span>
                          <span>{mt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 text-[9px] text-slate-500 font-mono">MITIGASI OPERASION CONTEXT: ACTIVE</div>
                </div>
              </div>
            </div>
          </div>

          {/* FUTURE SCENARIO SIMULATOR dials */}
          <ForecastScenarioSimulator snapshot={snapshot} currency={currency} />
        </div>
      ) : (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <p className="text-xs text-slate-400">Data prediksi belum terbentuk. Klik "7 Hari", "14 Hari" atau "30 Hari" di pojok kanan atas untuk memicu proses inisiasi AI.</p>
        </div>
      )}
    </div>
  );
}
