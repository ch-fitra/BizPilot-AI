import React, { useEffect } from 'react';
import { 
  X, 
  Building, 
  Award, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Heart, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Zap, 
  ShieldAlert,
  BarChart,
  ClipboardList,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { AnalysisHistoryRecord } from '../types/analysis';
import { exportReportToPdf } from '../utils/exportPdf';
import { ReportService } from '../services/reportService';

interface AnalysisDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AnalysisHistoryRecord | null;
  onApplyToDashboard: (record: AnalysisHistoryRecord) => void;
  onConsultAI?: () => void;
}

export default function AnalysisDetailModal({
  isOpen,
  onClose,
  record,
  onApplyToDashboard,
  onConsultAI
}: AnalysisDetailModalProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const getPriorityStyle = (prio: string) => {
    switch (prio) {
      case 'high':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default:
        return 'bg-indigo-500/10 border-indigo-505/20 text-indigo-300';
    }
  };

  const getHealthLevel = (score: number) => {
    if (score >= 90) return { label: 'Sangat Sehat (Excellent)', color: 'text-emerald-400', bar: 'bg-emerald-500' };
    if (score >= 75) return { label: 'Sehat (Good)', color: 'text-indigo-400', bar: 'bg-indigo-500' };
    if (score >= 55) return { label: 'Kurang Sehat (Warning)', color: 'text-amber-400', bar: 'bg-amber-500' };
    return { label: 'Kritis (Critical)', color: 'text-rose-450 text-rose-450', bar: 'bg-rose-500 animate-pulse' };
  };

  const health = getHealthLevel(record.health_score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="bg-[#0a0d17] border border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl z-10 relative animate-fadeIn">
        
        {/* Upper Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-550 via-indigo-500 to-rose-500" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-850 bg-[#0c101d] flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">DETAIL DEKROMSI AUDIT</span>
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              Laporan Analisis: {record.business_name}
            </h3>
            <span className="text-[10px] text-slate-500 block leading-none font-sans font-medium">
              Dibuat pada {formatDate(record.created_at)} &bull; Divisi {record.business_type}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-1 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-left bg-[#070912]">
          
          {/* Top segment: Profile & Score layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Score Big Meter (5 cols) */}
            <div className="md:col-span-5 bg-[#121622] border border-slate-850 rounded-2xl p-5 flex flex-col justify-between items-center text-center">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-505 text-slate-400 block mb-1">HEALTH MONITOR</span>
                <span className={`text-sm font-bold block ${health.color}`}>{health.label}</span>
              </div>

              {/* Huge circular dial */}
              <div className="my-4 relative flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center font-mono font-black text-3xl text-slate-100">
                  {record.health_score} <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
                {/* Visual ring bar indicator */}
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 pointer-events-none scale-105" />
              </div>

              <div className="w-full space-y-2">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${record.health_score}%` }} className={`h-full rounded-full ${health.bar}`} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Tingkat kelayakan ketahanan operasional</span>
              </div>
            </div>

            {/* AI Summary Text description (7 cols) */}
            <div className="md:col-span-12 lg:col-span-7 bg-[#121622] border border-slate-850 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  AI Executive Insight
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {record.ai_result.health_summary}
                </p>
              </div>

              {/* Upload metadata summary */}
              <div className="mt-4 pt-4 border-t border-slate-850 flex items-center gap-3 text-xs text-slate-400">
                <FileText className="w-4 h-4 text-slate-550 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">SUMBER DOKUMEN INPUT</span>
                  <span className="font-semibold text-slate-300">
                    {record.input_source === 'file' ? `File: ${record.uploaded_file_name || 'raw_data.csv'}` : record.input_source === 'text' ? 'Komentar / Text Input' : 'Multimodality Hub / Screenshot'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Segment 2: Financial & Volume snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Sales Volume Snapshot */}
            <div className="bg-[#121622] border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-505/10 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-left font-sans">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Omset Log Terinput</span>
                <span className="text-base font-extrabold text-slate-200 block">{formatRupiah(record.total_sales)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Rata-rata: {formatRupiah(record.total_sales / 7)} / hari</span>
              </div>
            </div>

            {/* Transactions count */}
            <div className="bg-[#121622] border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left font-sans">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Total Transaksi Sensus</span>
                <span className="text-base font-extrabold text-slate-200 block">{record.total_transactions} orders</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Rata-rata: {Math.round(record.total_transactions / 7)} pesanan / hari</span>
              </div>
            </div>

          </div>

          {/* Segment 3: Strengths & Risks bullet points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Strengths */}
            <div className="bg-[#121622] border border-slate-850 rounded-2xl p-5 space-y-3.5">
              <h4 className="text-xs font-mono font-bold text-emerald-405 text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Kekuatan Operasional
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-350 leading-relaxed list-none">
                {record.ai_result.strengths?.map((str: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-500 text-xs font-bold mt-0.5 shrink-0">&bull;</span>
                    <span>{str}</span>
                  </li>
                )) || <li className="italic text-slate-500">Tidak ada pengamatan kekuatan khusus.</li>}
              </ul>
            </div>

            {/* Risks */}
            <div className="bg-[#121622] border border-slate-850 rounded-2xl p-5 space-y-3.5">
              <h4 className="text-xs font-mono font-bold text-rose-450 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Sinyal Hambatan & Resiko
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-355 leading-relaxed list-none">
                {record.ai_result.risks?.map((r: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-rose-500 text-xs font-bold mt-0.5 shrink-0">&bull;</span>
                    <span>{r}</span>
                  </li>
                )) || <li className="italic text-slate-500">Tidak ada resiko atau anomali kritis yang terdeteksi.</li>}
              </ul>
            </div>

          </div>

          {/* Segment 4: Inventory Alerts */}
          {record.inventory_alerts.length > 0 && (
            <div className="bg-[#181216]/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-400" /> Notifikasi Kritis Logistik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {record.inventory_alerts.map((al: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-amber-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="text-slate-300 font-sans">{al}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segment 5: Products, review sentiments, and planning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Products breakdown */}
            <div className="bg-[#121622]/80 border border-slate-850 rounded-2xl p-5">
              <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-indigo-400" />
                Log Mutasi Volume Produk
              </h4>
              <div className="space-y-3">
                {record.top_products.map((p: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-950/40 border border-slate-900 leading-normal">
                    <div className="text-left font-semibold text-slate-205 text-slate-200">
                      {p.name}
                    </div>
                    <div className="text-right font-mono flex items-center gap-4 text-slate-400">
                      <span>Jual: <span className="text-slate-300 font-bold">{p.sales} pcs</span></span>
                      <span>Sisa: <span className="text-indigo-400 font-bold">{p.stock} pcs</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer review topics */}
            <div className="bg-[#121622]/80 border border-slate-850 rounded-2xl p-5">
              <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-450" />
                Cluster Sentimen Konsumen
              </h4>
              <div className="space-y-3 font-sans text-xs">
                {record.customer_reviews_summary?.map((rev: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-slate-900 leading-normal">
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">{rev.topic}</span>
                    <span className="font-mono text-[11px] text-[#fbbf24] flex items-center gap-1">
                      ★ {rev.rating.toFixed(1)}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[9px] font-bold border capitalize leading-none ${
                      rev.sentiment === 'positive' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : rev.sentiment === 'negative' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-450'
                    }`}>
                      {rev.sentiment}
                    </span>
                  </div>
                )) || <p className="italic text-slate-500">Ulasan sentimen belum dikategorisasi.</p>}
              </div>
            </div>

          </div>

          {/* Segment 6: Action Plan Roadmap */}
          <div className="space-y-3.5 bg-[#121622] border border-slate-850 rounded-2xl p-6">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-indigo-400" /> Peta Jalan Rencana Aksi AI (AI Action Plan)
            </h4>
            <div className="space-y-4">
              {record.action_plan.map((act: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-850/60 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-y-2 text-[10px] font-mono font-bold">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                      Divisi: {act.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded uppercase border leading-none ${getPriorityStyle(act.priority)}`}>
                      Urgensi: {act.priority}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-100 text-sm leading-relaxed">
                    {act.task}
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed pl-3 border-l border-slate-800">
                    <span className="text-[10px] text-indigo-400 font-bold block mb-0.5 font-mono">MITIGASI & REKOMENDASI AI:</span>
                    {act.reasoning}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Original source data text placeholder summary */}
          {record.raw_input_summary && (
            <div className="bg-[#121622]/40 border border-slate-900 rounded-2xl p-5 space-y-1 text-xs">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">RINGKASAN INPUT ASLI (AUDITED TEXT)</span>
              <p className="text-slate-400 leading-relaxed font-sans line-clamp-4">
                {record.raw_input_summary}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-850 bg-[#0c101d] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium text-left">
            * Memuat analisis ini akan memperbarui dashboard secara langsung.
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
            {/* Export CSV */}
            <button
              onClick={() => window.open(ReportService.getCsvExportUrl(record.analysis_id), '_blank')}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              CSV
            </button>

            {/* Export PDF */}
            <button
              onClick={() => exportReportToPdf(record)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-slate-400" />
              PDF
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition font-bold text-xs"
            >
              Kembali Ke Riwayat
            </button>

            {onConsultAI && (
              <button
                onClick={onConsultAI}
                className="px-5 py-2.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/25 text-violet-400 hover:text-violet-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                Tanya Konsultan AI
              </button>
            )}

            <button
              onClick={() => {
                onApplyToDashboard(record);
                onClose();
              }}
              className="px-5 py-2.5 bg-[#6366f1] hover:bg-indigo-500 text-white rounded-xl transition font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/40"
            >
              <Zap className="w-4 h-4" />
              Terapkan Sebagai Analisis Aktif
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
