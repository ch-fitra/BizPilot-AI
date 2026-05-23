import React, { useState } from 'react';
import {
  FileText, 
  Download, 
  ExternalLink, 
  Check, 
  Copy, 
  Building2, 
  Calendar, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  CheckSquare, 
  ArrowLeft,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { AnalysisHistoryRecord } from '../types/analysis';
import { ReportService } from '../services/reportService';

interface ReportPreviewProps {
  record: AnalysisHistoryRecord;
  onBack?: () => void;
  hideBackButton?: boolean;
}

export default function ReportPreview({ record, onBack, hideBackButton = false }: ReportPreviewProps) {
  const [copied, setCopied] = useState(false);
  const {
    analysis_id,
    business_name,
    business_type,
    created_at,
    health_score,
    risk_level,
    total_sales,
    total_transactions,
    top_products,
    inventory_alerts,
    customer_sentiment,
    customer_reviews_summary,
    action_plan,
  } = record;

  const currency = 'IDR';

  // Format currency
  const formatVal = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Raw Date Formatter
  const formattedDate = new Date(created_at).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCopyLink = async () => {
    try {
      // Build absolute external share link
      const shareUrl = `${window.location.origin}/reports/${analysis_id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleExportPdf = async () => {
    try {
      const { exportReportToPdf } = await import('../utils/exportPdf');
      exportReportToPdf(record);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const handleExportCsv = () => {
    window.open(ReportService.getCsvExportUrl(analysis_id), '_blank');
  };

  // Determine health score pill colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getRiskColor = (risk: string) => {
    const rLower = risk.toLowerCase();
    if (rLower.includes('critical') || rLower.includes('tinggi') || rLower.includes('high')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (rLower.includes('warning') || rLower.includes('sedang') || rLower.includes('caution')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div id={`report-preview-${analysis_id}`} className="space-y-6 max-w-5xl mx-auto animate-fadeIn text-left text-slate-800">
      
      {/* Upper Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-850 rounded-2xl no-print">
        <div className="flex items-center gap-3">
          {!hideBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-930 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200 font-mono">BETA REPORT PREVIEW & TRADE EXPORT</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Copy Share Link */}
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-[#121622] hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Disalin ke Clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                Copy Share Link
              </>
            )}
          </button>

          {/* Export CSV button - talks directly to live API */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#121622] hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export CSV
          </button>

          {/* Native Export PDF using jsPDF */}
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Professional Print-out Template (Light Mode Canvas mimicking paper report) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-10 md:p-12 space-y-8 relative font-sans text-slate-900">
        
        {/* Paper watermark border accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        {/* A. REPORT HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 text-white rounded-xl">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-955 font-sans">BIZPILOT AI</h1>
                <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono">Autonomous MSME Advisor</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-2">
              Audit operasional intelijen dan roadmap mitigasi krisis disusun menggunakan komputasi terstruktur model Gemini.
            </p>
          </div>

          <div className="space-y-1 font-mono text-xs text-left md:text-right text-slate-600">
            <div><span className="font-bold text-slate-800">No. Sertifikat:</span> BP-AUD-${analysis_id.substring(0, 8).toUpperCase()}</div>
            <div><span className="font-bold text-slate-800">Tanggal Analisis:</span> {formattedDate}</div>
            <div><span className="font-bold text-slate-800">Status Database:</span> Live PostgreSQL Sync</div>
            <div><span className="font-bold text-slate-800">Mata Uang Acuan:</span> {currency}</div>
          </div>
        </div>

        {/* Business Identitas block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Nama Bisnis</span>
            <span className="font-bold text-slate-850 mt-0.5 block">{business_name}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Jenis Kategori</span>
            <span className="font-bold text-slate-850 mt-0.5 block capitalize">{business_type}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Sumber Masukan</span>
            <span className="font-bold text-slate-850 mt-0.5 block">
              {record.input_source === 'file' ? '📁 Berkas Unggahan' : '📝 Teks Langsung'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">File Name</span>
            <span className="font-semibold text-slate-600 mt-0.5 block truncate max-w-[150px]">
              {record.uploaded_file_name || 'N/A (Teks Langsung)'}
            </span>
          </div>
        </div>

        {/* B. EXECUTIVE SUMMARY & SCORE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-850 py-1 border-b border-slate-100 font-bold text-base">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2>EVALUASI UTAMA & RINGKASAN EKSEKUTIF</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Score Wheel visualization */}
            <div className="md:col-span-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono">CORE HEALTH INDEX</span>
              
              <div className="relative flex items-center justify-center">
                {/* Score Number wrapper */}
                <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center font-bold ${getScoreColor(health_score)}`}>
                  <span className="text-4xl font-black">{health_score}</span>
                  <span className="text-[10px] font-semibold opacity-75">Sangat Baik</span>
                </div>
              </div>

              <div className={`p-1.5 px-3 rounded-full text-[11px] font-bold border ${getRiskColor(risk_level)}`}>
                Risiko: {risk_level}
              </div>
            </div>

            {/* Explanatory insights in list of strengths & weaknesses */}
            <div className="md:col-span-8 space-y-4">
              <div className="p-5 border border-slate-100 bg-white shadow-inner-sm rounded-2xl space-y-2">
                <span className="text-xs font-bold font-mono text-indigo-650 block">NARASI AUDITI & REKOMENDASI TERSEGMENTASI</span>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{record.raw_input_summary || 'Analysis summary not provided.'}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-800 uppercase font-mono tracking-wider text-[10px]">Identifikasi Kekuatan (Strengths)</span>
                  <p className="text-slate-650 text-[11px]">Sinergi volume sirkulasi kas stabil & dominasi margin unit optimal di produk penopang utama.</p>
                </div>
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                  <span className="font-bold text-rose-800 uppercase font-mono tracking-wider text-[10px]">Identifikasi Ancaman (Risks)</span>
                  <p className="text-slate-650 text-[11px]">Rentetan sediaan kosong pada produk krusial F&B & komplain ulasan logistik lamban.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* C. SALES PERFORMANCE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-850 py-1 border-b border-slate-100 font-bold text-base">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2>KINERJA PENJUALAN & TREN PRODUK</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">OMZET / SALES VOLUME</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{formatVal(total_sales)}</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">VOLUME TRANSAKSI</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{total_transactions} kali belanja</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">AVERAGE BASKET SIZE</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">
                {total_transactions > 0 ? formatVal(Math.round(total_sales / total_transactions)) : formatVal(0)}
              </span>
            </div>
          </div>

          {/* Products table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                  <th className="p-3">Nama Produk</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-center">Tingkat Stok</th>
                  <th className="p-3 text-center">Kuantitas Terjual</th>
                  <th className="p-3 text-right">Volume Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105">
                {top_products && top_products.length > 0 ? (
                  top_products.map((prod: any, idx: number) => {
                    const pName = prod.name || prod.product_name || 'N/A';
                    const pCat = prod.category || 'Food';
                    const pStock = prod.stock ?? prod.stock_level ?? 0;
                    const pSold = prod.sold ?? prod.total_sold ?? 0;
                    const pRev = prod.revenue ?? prod.earnings ?? 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/55 transition text-slate-705">
                        <td className="p-3 font-semibold text-slate-850">{pName}</td>
                        <td className="p-3 text-slate-500 capitalize">{pCat}</td>
                        <td className="p-3 text-center font-mono">{pStock} pcs</td>
                        <td className="p-3 text-center font-mono font-medium text-indigo-650">{pSold}x</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">{formatVal(pRev)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-xs text-slate-400">
                      Tidak ada detail produk untuk ditampilkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* D. INVENTORY & SUPPLY CHAIN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-850 py-1 border-b border-slate-100 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-indigo-600" />
            <h2>LOGISTIK & PERINGATAN KRITIS INVENTORI</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-450 uppercase block font-mono">REKOMENDASI LOGISTIK</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stok bahan baku untuk SKU berulang merupakan jangkar arus produksi. Pastikan pesanan berulang (re-order point) diatur otomatis saat stok menyentuh angka limit aman demi menghindari hilangnya potensi penjualan (opportunity loss).
              </p>
            </div>

            <div className="md:col-span-7 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider block mb-1">NOTIFIKASI STOK LIMIT AMBANG BATAS</span>
              {inventory_alerts && inventory_alerts.length > 0 ? (
                inventory_alerts.map((alert: string, idx: number) => (
                  <div key={idx} className="p-3.5 bg-amber-50 border border-amber-200/50 rounded-xl text-xs text-amber-800 font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{alert}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-dashed border-slate-200 bg-emerald-50/50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                  ✓ Seluruh sediaan inventori berada pada batas aman operasional.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* E. CUSTOMER SENTIMENT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-850 py-1 border-b border-slate-100 font-bold text-base">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2>SENTIMEN & EXPOSURE KONSUMEN</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Sentiment meter overall */}
            <div className="md:col-span-4 p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex flex-col justify-center text-center space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-650 font-mono tracking-widest block uppercase">GLOBAL CUSTOMER OUTLOOK</span>
              <span className="text-lg font-black text-indigo-900 block capitalize">
                {(typeof customer_sentiment === 'string' ? customer_sentiment : (customer_sentiment?.sentiment || 'Neutral')).toUpperCase()}
              </span>
              <p className="text-[11px] text-indigo-700 leading-relaxed pt-1 border-t border-indigo-200/50">
                Respon audiens menunjukkan loyalitas yang solid pada karakteristik cita rasa produk utama, namun memerlukan penyempurnaan pada ketepatan durasi kurir logistik.
              </p>
            </div>

            {/* Custom Reviews Topics */}
            <div className="md:col-span-8 overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-655 font-bold">
                    <th className="p-3">Topik Evaluasi</th>
                    <th className="p-3 text-center">Kuantitas Ulasan</th>
                    <th className="p-3 text-center">Derajat Reaksi</th>
                    <th className="p-3">Ringkasan Narasi Masukan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer_reviews_summary && customer_reviews_summary.length > 0 ? (
                    customer_reviews_summary.map((review: any, idx: number) => {
                      const topic = review.topic || review.aspect || 'N/A';
                      const count = review.count || review.mentions || 0;
                      const satisfaction = review.satisfaction || review.rating || 'N/A';
                      const complaint = review.complaint || review.summary || 'N/A';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition text-slate-700">
                          <td className="p-3 font-semibold text-slate-800">{topic}</td>
                          <td className="p-3 text-center font-mono">{count} ulasan</td>
                          <td className="p-3 text-center font-bold text-indigo-650">{satisfaction}</td>
                          <td className="p-3 text-slate-500 leading-relaxed max-w-xs truncate">{complaint}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-xs text-slate-450">
                        Tidak ada komparasi topik ulasan pelanggan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* F. AI ACTION PLAN & DIVISION MATRIX */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-855 py-1 border-b border-slate-100 font-bold text-base">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h2>MITIGASI OPERASIONAL & ROADMAP ACTION PLAN</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-100 font-bold border-b border-slate-900">
                  <th className="p-3.5 text-center">Prioritas</th>
                  <th className="p-3.5">Fokus Rencana Tindakan Operasional</th>
                  <th className="p-3.5">Divisi Pelaksana</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Estimasi Dampak Usaha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105">
                {action_plan && action_plan.length > 0 ? (
                  action_plan.map((act: any, idx: number) => {
                    const prio = act.priority || 'Medium';
                    const task = act.task || act.description || 'N/A';
                    const cat = act.category || 'Operasional';
                    const status = act.status || 'Pending';
                    const impact = act.impact || 'High Impact';
                    const getPrioPill = (p: string) => {
                      const pLower = p.toLowerCase();
                      if (pLower.includes('high') || pLower.includes('tinggi')) return 'bg-rose-50 border-rose-200 text-rose-700';
                      if (pLower.includes('low') || pLower.includes('rendah')) return 'bg-slate-50 border-slate-200 text-slate-600';
                      return 'bg-amber-50 border-amber-200 text-amber-700';
                    };
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition text-slate-700">
                        <td className="p-3 text-center">
                          <span className={`p-1 px-2.5 rounded-full text-[9px] font-mono tracking-widest font-extrabold uppercase border ${getPrioPill(prio)}`}>
                            {prio}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-850 leading-relaxed max-w-sm">{task}</td>
                        <td className="p-3 font-mono text-slate-500 capitalize">{cat}</td>
                        <td className="p-3 text-center">
                          <span className="p-1 px-2 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-[10px] font-semibold">
                            {status}
                          </span>
                        </td>
                        <td className="p-3 text-indigo-750 font-semibold">{impact}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-xs text-slate-400">
                      Rencana aksi kosong.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* G. FINAL RECOMMENDATION & SIGN-OFF */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-850 py-1 border-b border-slate-100 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2>TAHAPAN EKSEKUSI TAHAN LAMA & SIGN-OFF</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 border border-slate-100 bg-indigo-50/20 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-650 font-mono">SEGERA: 24 JAM PERTAMA</span>
                <p className="text-xs text-slate-605 mt-2 leading-relaxed">
                  Lakukan pemeriksaan fisik inventori untuk SKU kritis berstatus restock segera dan hubungi mitra distributor logistik.
                </p>
              </div>
              <span className="text-[9px] font-semibold font-mono text-indigo-400 mt-2 block">DURASI PRIORITAS TINGGI</span>
            </div>

            <div className="p-5 border border-slate-100 bg-sky-50/20 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-655 font-mono">TAKTIK: 7 HARI KEDEPAN</span>
                <p className="text-xs text-slate-605 mt-2 leading-relaxed">
                  Sosialisasikan standar kompetensi pelayanan sapaan ramah kepada kru kasir dan kurir logistik guna memperbaiki reputasi ulasan.
                </p>
              </div>
              <span className="text-[9px] font-semibold font-mono text-sky-400 mt-2 block">DURASI EVALUASI MINGGUAN</span>
            </div>

            <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">POLA PIKIR: 30 HARI KEDEPAN</span>
                <p className="text-xs text-slate-605 mt-2 leading-relaxed">
                  Tinjau margin kotor unit atas seluruh menu SKU produk penopang serta integrasikan perolehan data ini ke basis data internal.
                </p>
              </div>
              <span className="text-[9px] font-semibold font-mono text-slate-400 mt-2 block">STRATEGI JANGKA MENENGAH</span>
            </div>
          </div>
        </div>

        {/* Cohesively Professional Footer stamp */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-450 font-mono gap-4">
          <div className="flex items-center gap-1.5 font-sans font-semibold text-indigo-600">
            <Coins className="w-4 h-4" />
            <span>BizPilot AI - Autonomised Business Auditor License</span>
          </div>
          <div>Dikeluarkan secara otomatis &bull; Versi Dokumen V1.2 &bull; Jakarta, ID</div>
        </div>

      </div>
    </div>
  );
}
