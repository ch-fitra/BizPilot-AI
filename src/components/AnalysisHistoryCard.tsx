import React from 'react';
import { Calendar, Trash2, Eye, Building2, Flame, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { AnalysisHistoryRecord } from '../types/analysis';

interface AnalysisHistoryCardProps {
  record: AnalysisHistoryRecord;
  onViewDetail: (record: AnalysisHistoryRecord) => void;
  onDelete: (id: string) => void;
}

export default function AnalysisHistoryCard({
  record,
  onViewDetail,
  onDelete
}: AnalysisHistoryCardProps) {
  
  // Risk index mapping
  const getRiskDetails = (score: number) => {
    if (score >= 90) {
      return {
        label: 'Excellent',
        class: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        text: 'Sangat Sehat',
        icon: CheckCircle2
      };
    } else if (score >= 75) {
      return {
        label: 'Good',
        class: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
        text: 'Sehat / Stabil',
        icon: Sparkles
      };
    } else if (score >= 55) {
      return {
        label: 'Warning',
        class: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        text: 'Perlu Perhatian',
        icon: AlertCircle
      };
    } else {
      return {
        label: 'Critical',
        class: 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse',
        text: 'Resiko Rawan',
        icon: Flame
      };
    }
  };

  const risk = getRiskDetails(record.health_score);
  const RiskIcon = risk.icon;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
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

  return (
    <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden group">
      
      {/* Absolute glow design detail */}
      <div className={`absolute top-[-10px] right-[-10px] w-20 h-20 rounded-full filter blur-[35px] opacity-10 ${
        record.health_score >= 90 ? 'bg-emerald-500' : record.health_score >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
      }`} />

      {/* Left Column: Core Audit summary */}
      <div className="space-y-3 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#0a0d16] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-350">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-xs">{record.business_name}</span>
          </div>

          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-md capitalize">
            {record.business_type}
          </span>

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold ${risk.class}`}>
            <RiskIcon className="w-3 h-3" />
            {risk.label.toUpperCase()} ({risk.text})
          </span>
        </div>

        {/* AI summary sentence block */}
        <div>
          <p className="text-xs text-slate-350 leading-relaxed font-sans line-clamp-2">
            {record.ai_result.health_summary || record.raw_input_summary}
          </p>
        </div>

        {/* Sales & Alert snapshot row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-600" /> {formatDate(record.created_at)}
          </span>
          <span>&bull;</span>
          <span>Omset: <span className="text-slate-300 font-bold">{formatRupiah(record.total_sales)}</span></span>
          <span>&bull;</span>
          <span>Transaksi: <span className="text-slate-350 font-bold">{record.total_transactions} orders</span></span>
          {record.inventory_alerts.length > 0 && (
            <>
              <span>&bull;</span>
              <span className="text-amber-400 font-semibold">{record.inventory_alerts.length} Alert Pasokan</span>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Score badge and Action Buttons */}
      <div className="flex md:flex-col items-center justify-between md:justify-end gap-3.5 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-850/60">
        
        {/* Big Health Score Indicator Circle */}
        <div className="flex items-center gap-3 md:self-end">
          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">INDEKS SEHAT</span>
            <span className="text-sm font-bold text-slate-300 font-mono">Score</span>
          </div>
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono font-black text-sm relative shadow-md ${
            record.health_score >= 90 
              ? 'bg-emerald-500/10 border-emerald-500/45 text-emerald-400' 
              : record.health_score >= 75 
                ? 'bg-indigo-500/10 border-indigo-500/45 text-indigo-400' 
                : 'bg-rose-500/10 border-rose-500/45 text-rose-455 text-rose-400'
          }`}>
            {record.health_score}
          </div>
        </div>

        {/* Call to buttons UI */}
        <div className="flex items-center gap-2 md:self-end">
          
          <button
            onClick={() => onViewDetail(record)}
            className="px-4 py-2 bg-[#0d101a] hover:bg-indigo-650 hover:bg-indigo-600 hover:text-white border border-slate-800 text-slate-400 transition-all font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
            title="Muat Ulang Detail Di Dasbor"
          >
            <Eye className="w-4 h-4" />
            Buka Detail
          </button>

          <button
            onClick={() => onDelete(record.analysis_id)}
            className="p-2 bg-[#0d101a] hover:bg-rose-950/20 hover:text-rose-450 border border-slate-800 text-slate-500 hover:border-slate-750 hover:border-rose-500/30 rounded-xl transition"
            title="Hapus Dari Riwayat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
