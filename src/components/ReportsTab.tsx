import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  ShieldAlert, 
  ChevronRight, 
  Download, 
  Copy, 
  Check, 
  RotateCw, 
  Sparkles,
  Inbox,
  Activity,
  User,
  MapPin,
  FileSpreadsheet,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { AnalysisHistoryRecord } from '../types/analysis';
import { ReportService } from '../services/reportService';
import ReportPreview from './ReportPreview';
import { useDebouncedValue } from '../utils/performance';

interface ReportsTabProps {
  setActiveTab: (tab: string) => void;
}

export default function ReportsTab({ setActiveTab }: ReportsTabProps) {
  // Report state
  const [reports, setReports] = useState<AnalysisHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [crmStats, setCrmStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/crm/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setCrmStats(data.stats);
        }
      })
      .catch(err => console.error('Error loading CRM stats inside ReportsTab:', err));
  }, []);

  // Filter terms state
  const [searchName, setSearchName] = useState<string>('');
  const debouncedSearchName = useDebouncedValue(searchName, 250);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, week, month, custom
  const [customDateValue, setCustomDateValue] = useState<string>('');

  // Selected report for Preview screen
  const [selectedReport, setSelectedReport] = useState<AnalysisHistoryRecord | null>(null);

  // Copy shareable link state tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await ReportService.getAllReports();
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setErrorMsg('Gagal mengambil inventaris laporan dari database.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading report collection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCopyLink = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid triggering list clicks
    try {
      const shareUrl = `${window.location.origin}/reports/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.error('Failed to copy share url:', err);
    }
  };

  const handleExportPdf = async (e: React.MouseEvent, record: AnalysisHistoryRecord) => {
    e.stopPropagation();
    const { exportReportToPdf } = await import('../utils/exportPdf');
    exportReportToPdf(record);
  };

  const handleExportCsv = (e: React.MouseEvent, record: AnalysisHistoryRecord) => {
    e.stopPropagation();
    window.open(ReportService.getCsvExportUrl(record.analysis_id), '_blank');
  };

  // Filter application calculation logic
  const filteredReports = useMemo(() => reports.filter(rep => {
    // 1. Filter by business name / owner name
    const matchesName = rep.business_name.toLowerCase().includes(debouncedSearchName.toLowerCase());

    // 2. Filter by operational risk levels
    let matchesRisk = true;
    if (riskFilter !== 'all') {
      matchesRisk = rep.risk_level.toLowerCase().includes(riskFilter.toLowerCase());
    }

    // 3. Filter by date logic
    let matchesDate = true;
    const itemDate = new Date(rep.created_at);
    const today = new Date();
    
    if (dateFilter === 'today') {
      matchesDate = itemDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = itemDate >= sevenDaysAgo;
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = itemDate >= thirtyDaysAgo;
    } else if (dateFilter === 'custom' && customDateValue) {
      matchesDate = itemDate.toISOString().split('T')[0] === customDateValue;
    }

    return matchesName && matchesRisk && matchesDate;
  }), [reports, debouncedSearchName, riskFilter, dateFilter, customDateValue]);

  // Render report preview screen if a selection is active
  if (selectedReport) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ReportPreview 
          record={selectedReport} 
          onBack={() => setSelectedReport(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-indigo-400" />
            Laporan Bisnis Otonom
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekspor dan salin tautan ringkasan sertifikasi operasional untuk diajukan ke mentor UMKM atau perwakilan keuangan.
          </p>
        </div>
        
        <button
          onClick={fetchReports}
          className="p-2 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 font-mono shrink-0"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* CRM Sales Funnel Report Summary */}
      {crmStats && (
        <div className="p-5 rounded-2xl bg-[#121622]/90 border border-slate-850 flex flex-col md:flex-row items-stretch justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              Sertifikasi Omzet & CRM Leads
            </h3>
            <p className="text-[11.5px] text-slate-400 leading-relaxed">
              Ringkasan konversi prospek UMKM terbaru yang tercatat di database CRM BizPilot AI sebagai asisten operasional utama Anda.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 flex-1 max-w-xl text-left font-mono">
            
            <div className="p-3 bg-[#0b0e16] rounded-xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[8.5px] uppercase text-slate-500 font-bold block">Total Prospek</span>
              <span className="text-sm font-black text-slate-200 mt-1 block">{crmStats.totalLeads} Leads</span>
            </div>

            <div className="p-3 bg-[#0b0e16] rounded-xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[8.5px] uppercase text-slate-500 font-bold block">Hot Leads 🔥</span>
              <span className="text-sm font-black text-rose-400 mt-1 block">{crmStats.hotLeads} Prospek</span>
            </div>

            <div className="p-3 bg-[#0b0e16] rounded-xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[8.5px] uppercase text-slate-500 font-bold block">Potensi Omzet</span>
              <span className="text-xs font-black text-cyan-400 mt-1 block">IDR {crmStats.totalEstimatedRevenue.toLocaleString('id-ID')}</span>
            </div>

          </div>
        </div>
      )}

      {/* Filter and query controller panel */}
      <div className="bg-[#121622]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Business name matched searching */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama bisnis..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-930 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-650 transition"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          {/* Risk Dropdown */}
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 bg-slate-930 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-650 transition appearance-none cursor-pointer"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">Semua Derajat Risiko</option>
              <option value="low">Risiko Rendah / Aman</option>
              <option value="medium">Risiko Sedang / Warning</option>
              <option value="high">Risiko Tinggi / Kritis</option>
            </select>
          </div>

          {/* Date presets */}
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 bg-slate-930 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-650 transition appearance-none cursor-pointer"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Semua Waktu Pembuatan</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
              <option value="custom">Hari Spesifik...</option>
            </select>
          </div>

          {/* Custom Date Picker inputs */}
          {dateFilter === 'custom' ? (
            <div className="relative">
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-slate-930 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-650 transition cursor-pointer"
                value={customDateValue}
                onChange={(e) => setCustomDateValue(e.target.value)}
              />
            </div>
          ) : (
            <div className="hidden md:block opacity-35 border border-dashed border-slate-800 rounded-xl p-2.5 text-[10px] text-center text-slate-600 font-mono flex items-center justify-center">
              * Filter waktu aktif otomatis
            </div>
          )}

        </div>
      </div>

      {/* Reports collection block */}
      {isLoading ? (
        <div className="p-16 border border-slate-850 rounded-2xl bg-[#121622]/20 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
          <p className="text-xs text-slate-400 font-mono">Menyelaraskan data instrumen audit...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-10 border border-rose-950/35 bg-rose-955/5 rounded-2xl text-center text-rose-300 space-y-3">
          <p className="text-xs font-semibold">{errorMsg}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-600/30 transition"
          >
            Hubungkan Kembali
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-14 border border-dashed border-slate-850 rounded-2xl bg-[#121622]/20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-slate-900 border border-slate-850 text-slate-500 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200">Tidak Ada Laporan Ditemukan</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Kami tidak mendeteksi laporan tersimpan dalam filter saat ini. Jalankan komputasi data baru di asisten aslinya untuk memproduksi laporan otomatis.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('ai_analyzer')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mulai AI Analyzer Hari Ini
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const dateStr = new Date(report.created_at).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const score = report.health_score;

            return (
              <div
                key={report.analysis_id}
                onClick={() => setSelectedReport(report)}
                className="group relative p-5 border border-slate-850 hover:border-indigo-500/30 rounded-2xl bg-[#0b0e1a]/80 hover:bg-[#121629]/50 transition-all duration-300 cursor-pointer text-left flex flex-col justify-between gap-4"
              >
                {/* Upper row: Name & score badge */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 text-slate-100 font-bold text-sm tracking-wide group-hover:text-indigo-300 transition-colors">
                        <span className="truncate">{report.business_name}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block capitalize">
                        {report.business_type}
                      </p>
                    </div>

                    {/* Numeric circular Health index */}
                    <div className={`p-2 px-3 border rounded-xl text-xs font-mono font-bold shrink-0 ${
                      score >= 80 
                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                        : score >= 60 
                          ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' 
                          : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
                    }`}>
                      Score: {score}
                    </div>
                  </div>

                  {/* Summary summary text excerpt */}
                  <div className="p-3 rounded-xl bg-slate-930 border border-slate-900/60 text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                    &ldquo;{report.raw_input_summary || 'Analsis data multimodal komprehensif.'}&rdquo;
                  </div>

                  {/* Metadata labels */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-500 border-t border-slate-900/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-right">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                      <span className="capitalize">{report.risk_level} Risk</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Tool Actions */}
                <div className="grid grid-cols-4 gap-1.5 border-t border-slate-900/60 pt-3.5 no-print">
                  {/* Tanya AI shortcut */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('chat');
                    }}
                    className="p-2 py-1.5 bg-violet-650/10 hover:bg-violet-650/20 border border-violet-500/25 text-violet-400 hover:text-violet-300 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
                    Tanya AI
                  </button>

                  {/* Share link button */}
                  <button
                    onClick={(e) => handleCopyLink(e, report.analysis_id)}
                    className="p-2 py-1.5 bg-slate-930 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    {copiedId === report.analysis_id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Disalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-450" />
                        Salin Link
                      </>
                    )}
                  </button>

                  {/* Export CSV actions */}
                  <button
                    onClick={(e) => handleExportCsv(e, report)}
                    className="p-2 py-1.5 bg-slate-930 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-slate-450" />
                    CSV
                  </button>

                  {/* Export PDF actions */}
                  <button
                    onClick={(e) => handleExportPdf(e, report)}
                    className="p-2 py-1.5 bg-indigo-650/10 hover:bg-indigo-650/20 border border-indigo-500/25 text-indigo-400 hover:text-indigo-300 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
