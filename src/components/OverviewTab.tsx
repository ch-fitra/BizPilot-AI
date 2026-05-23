import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  PackageCheck, 
  AlertOctagon, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building,
  RefreshCw,
  Clock
} from 'lucide-react';
import { BusinessHealthState } from '../types';
import HealthScoreCard from './HealthScoreCard';

interface OverviewTabProps {
  businessState: BusinessHealthState;
  onReset: () => void;
  setActiveTab: (tab: string) => void;
  businessName: string;
  isUnsavedAnalysis?: boolean;
  onSaveAnalysis?: () => Promise<void>;
  isSavingAnalysis?: boolean;
  isDemoActive?: boolean;
  isEmptyState?: boolean;
  hasProfile?: boolean;
}

export default function OverviewTab({
  businessState,
  onReset,
  setActiveTab,
  businessName,
  isUnsavedAnalysis = false,
  onSaveAnalysis,
  isSavingAnalysis = false,
  isDemoActive = false,
  isEmptyState = false,
  hasProfile = true
}: OverviewTabProps) {
  
  // Format currency to IDR Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  if (!hasProfile) {
    return (
      <div className="p-10 sm:p-20 border border-dashed border-slate-850 rounded-3xl bg-[#121622]/30 text-center flex flex-col items-center justify-center space-y-6 animate-fadeIn">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
          <Building className="w-8 h-8 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">Profil Bisnis Permanen Belum Ada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Isi identitas bisnis Anda terlebih dahulu di Settings agar sistem dapat menyimpan konfigurasi mata uang, nama usaha, serta menautkan analisis secara rapi ke database PostgreSQL / Supabase.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
        >
          Lengkapi Profil Bisnis Sekarang
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="p-10 sm:p-20 border border-dashed border-slate-850 rounded-3xl bg-[#121622]/30 text-center flex flex-col items-center justify-center space-y-6 animate-fadeIn">
        <div className="p-4 rounded-xl bg-indigo-550/10 border border-indigo-500/20 text-indigo-400">
          <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">Belum ada analisis</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Mulai dari AI Analyzer. Unggah data atau berikan masukan teks untuk menjalankan evaluasi otonom robot asisten AI terhadap bisnis Anda.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('ai_analyzer')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
        >
          Mulai Hari Ini
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Fast Demo activator */}
        <div className="pt-6 border-t border-slate-900 w-full max-w-xs text-center space-y-2">
          <span className="text-[10px] text-slate-500 font-mono block">ATAU GUNAKAN DEMO SIMULASI</span>
          <button
            onClick={onReset}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline transition"
          >
            Muat Demo Kopi Selaras Cilandak
          </button>
        </div>
      </div>
    );
  }

  // Compute stats
  const totalSales = businessState.sales_data.reduce((sum, item) => sum + item.sales, 0);
  const totalTransactions = businessState.sales_data.reduce((sum, item) => sum + item.transactions, 0);
  const activeProducts = businessState.top_products.length;
  const alertCount = businessState.alerts.length;

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Save Analysis banner when there is unsaved AI results */}
      {isUnsavedAnalysis && (
        <div className="p-4.5 rounded-3xl bg-indigo-950/25 border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-[30px] pointer-events-none" />
          <div className="text-left space-y-0.5 z-10">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              Sertifikasi Analisis AI Baru Terdeteksi
            </h4>
            <p className="text-xs text-slate-300">
              Hasil audit dari robot asisten Gemini belum dipreservasi ke database log riwayat Anda.
            </p>
          </div>
          <button
            onClick={onSaveAnalysis}
            disabled={isSavingAnalysis}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shrink-0 rounded-xl shadow-md flex items-center justify-center gap-1.5 z-10"
          >
            {isSavingAnalysis && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isSavingAnalysis ? 'Menyimpan ke Log...' : 'Simpan Analisis'}
          </button>
        </div>
      )}

      {/* Upper Profile Greeting Box */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/20 to-slate-900/10 border border-slate-850">
        <div>
          <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest block mb-1">BUSINESS REPORT CONSOLE</span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Building className="w-6 h-6 text-indigo-400" />
            Statistik {businessName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Selamat datang di hub kemudi utama BizPilot AI. Berikut adalah ringkasan hasil audit otonom sistem cerdas berdasarkan analitik log transaksi dan feedback terintegrasi.
          </p>
        </div>
        
        {/* Quick Summary Pill indicator */}
        {isDemoActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-450 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider">DEMO DATA</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-450" />
            <span className="text-[10px] font-mono font-bold tracking-wider">LIVE DATA (TERPRESERVASI)</span>
          </div>
        )}
      </div>

      {/* Grid of 4 Core Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset card */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-[20px] pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-semibold">Total Pendapatan (7-Hari)</span>
              <span className="text-lg font-black text-slate-100 mt-2 block tracking-tight">
                {formatRupiah(totalSales)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-indigo-300 flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rata-rata {formatRupiah(totalSales / 7)} / hari</span>
          </div>
        </div>

        {/* Transaction Volume Card */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-[20px] pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-semibold">Total Transaksi (7-Hari)</span>
              <span className="text-lg font-black text-slate-100 mt-2 block tracking-tight">
                {totalTransactions} Order
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rata-rata {Math.round(totalTransactions / 7)} order / hari</span>
          </div>
        </div>

        {/* Active Products Card */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 hover:border-amber-500/30 transition-all flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-[20px] pointer-events-none group-hover:bg-amber-500/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-semibold">Produk Terpantau</span>
              <span className="text-lg font-black text-slate-100 mt-2 block tracking-tight">
                {activeProducts} Item Aktif
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-amber-300 flex items-center gap-1 font-sans leading-none">
            <span>{businessState.top_products.filter(p => p.stock <= 10).length} produk kritis butuh restock</span>
          </div>
        </div>

        {/* Action Alerts Count Card */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 hover:border-rose-500/30 transition-all flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-[20px] pointer-events-none group-hover:bg-rose-500/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-semibold">Sinyal Peringatan AI</span>
              <span className="text-lg font-black text-slate-100 mt-2 block tracking-tight">
                {alertCount} Notifikasi
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-450 border border-rose-500/20">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-rose-300 flex items-center gap-1 font-sans leading-none">
            <span>Butuh audit strategi segera</span>
          </div>
        </div>

      </div>

      {/* Health Score Panel Widget */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Health Diagnostics & AI Insights
        </h3>
        
        <HealthScoreCard
          score={businessState.health_score}
          summary={businessState.health_summary}
          strengths={businessState.strengths}
          risks={businessState.risks}
          trend={businessState.sales_trend}
          onReset={onReset}
        />
      </div>

      {/* Quick Action Bento Grid */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-semibold">
          Navigasi Pintar Operasional
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Action 1: AI Analyzer */}
          <div 
            onClick={() => setActiveTab('ai_analyzer')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#121622] border border-slate-850 hover:bg-[#151a2a] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/5 text-left flex flex-col justify-between min-h-[160px] relative overflow-hidden"
          >
            <div className="absolute bottom-[-15px] right-[-15px] w-24 h-24 bg-indigo-500/5 rounded-full filter blur-[30px] pointer-events-none group-hover:bg-indigo-500/15" />
            <div className="flex justify-between items-center">
              <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">Analyze Business</h4>
              <p className="text-xs text-slate-450 mt-1">
                Unggah invoice, ulasan, atau chat baru ke generator Gemini AI untuk memproses insight terkini.
              </p>
            </div>
          </div>

          {/* Action 2: Sales */}
          <div 
            onClick={() => setActiveTab('sales')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#121622] border border-slate-850 hover:bg-[#151a2a] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/5 text-left flex flex-col justify-between min-h-[160px] relative overflow-hidden"
          >
            <div className="absolute bottom-[-15px] right-[-15px] w-24 h-24 bg-emerald-500/5 rounded-full filter blur-[30px] pointer-events-none group-hover:bg-emerald-500/15" />
            <div className="flex justify-between items-center">
              <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                <ChevronRight className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">View Financial Report</h4>
              <p className="text-xs text-slate-450 mt-1">
                Tinjau visualisasi diagram omzet harian dan identifikasi pergeseran momentum pendapatan.
              </p>
            </div>
          </div>

          {/* Action 3: Action Plan */}
          <div 
            onClick={() => setActiveTab('action_plan')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#121622] border border-slate-850 hover:bg-[#151a2a] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/5 text-left flex flex-col justify-between min-h-[160px] relative overflow-hidden"
          >
            <div className="absolute bottom-[-15px] right-[-15px] w-24 h-24 bg-amber-500/5 rounded-full filter blur-[30px] pointer-events-none group-hover:bg-amber-500/15" />
            <div className="flex justify-between items-center">
              <div className="p-3 rounded-2xl bg-amber-600/10 text-amber-450 border border-amber-500/20">
                <ChevronRight className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-100 group-hover:text-amber-350 transition-colors">Open Daily Action Plan</h4>
              <p className="text-xs text-slate-450 mt-1">
                Buka daftar prioritas solusi operasional yang dihasilkan oleh robot asisten analisis AI.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
