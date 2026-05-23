import React, { useState, useEffect } from 'react';
import { 
  History, 
  Sparkles, 
  AlertCircle, 
  Trash2, 
  ArrowRight,
  Database,
  Search,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { AnalysisHistoryRecord } from '../types/analysis';
import { AnalysisHistoryService } from '../services/analysisHistoryService';
import AnalysisHistoryCard from '../components/AnalysisHistoryCard';
import AnalysisDetailModal from '../components/AnalysisDetailModal';

interface AnalysisHistoryPageProps {
  onApplyToDashboard: (record: AnalysisHistoryRecord) => void;
  setActiveTab: (tab: string) => void;
}

export default function AnalysisHistoryPage({
  onApplyToDashboard,
  setActiveTab
}: AnalysisHistoryPageProps) {
  
  const [history, setHistory] = useState<AnalysisHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected item details modal states
  const [selectedRecord, setSelectedRecord] = useState<AnalysisHistoryRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Deletion confirm modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Success notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const data = await AnalysisHistoryService.getAll();
      setHistory(data);
    } catch (err: any) {
      setErrorText('Gagal memuat riwayat analisis dari database backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Open Details Modal
  const handleOpenDetail = (record: AnalysisHistoryRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  // Initiate Delete flow
  const handleRequestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const ok = await AnalysisHistoryService.delete(deleteTargetId);
      if (ok) {
        setHistory(prev => prev.filter(item => item.analysis_id !== deleteTargetId));
        triggerToast('✓ Riwayat berhasil dihapus secara permanen.');
      } else {
        triggerToast('⚠ Gagal menghapus riwayat dari sistem.');
      }
    } catch {
      triggerToast('⚠ Terjadi error saat menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  // Filters logic
  const filteredRecords = history.filter(rec => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      rec.business_name.toLowerCase().includes(term) ||
      rec.business_type.toLowerCase().includes(term) ||
      (rec.ai_result.health_summary && rec.ai_result.health_summary.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#090b16] border border-indigo-500/35 text-indigo-300 text-xs font-sans font-bold flex items-center gap-2.5 shadow-xl shadow-indigo-505/15">
          <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <History className="w-5.5 h-5.5 text-indigo-400" />
            AI Analysis History Log Database
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Riwayat kompilasi data audit dan komitmen rencana aksi operasional. Pilih analisa lama untuk dimuat atau dihapus.
          </p>
        </div>

        {/* Action shortcut */}
        <button
          onClick={() => setActiveTab('ai_analyzer')}
          className="px-4 py-2 bg-indigo-650 bg-indigo-600 border border-indigo-550 text-white rounded-xl text-xs hover:bg-indigo-500 font-bold tracking-wide transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Mulai Analisis Baru
        </button>
      </div>

      {/* Search Input Bar */}
      {history.length > 0 && (
        <div className="flex items-center gap-3 bg-[#121622]/90 border border-slate-850 p-3 rounded-2xl focus-within:border-slate-700 transition">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama usaha, kategori industri, atau ringkasan hasil..."
            className="bg-transparent border-none text-xs text-slate-205 focus:outline-none w-full"
          />
        </div>
      )}

      {/* Main content listing cards */}
      {loading ? (
        <div className="p-20 text-center rounded-3xl bg-[#121622]/90 border border-slate-800 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Menghubungkan ke pusat server database...</span>
        </div>
      ) : errorText ? (
        <div className="p-16 border border-rose-900/40 rounded-3xl bg-[#121622]/90 text-center text-rose-400 flex flex-col items-center justify-center space-y-3 shadow shadow-rose-955/20">
          <AlertCircle className="w-10 h-10 text-rose-450" />
          <h4 className="font-bold text-sm">Kegagalan Komunikasi Log Database</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            {errorText} Pastikan server backend Anda online dan terhubung aman.
          </p>
          <button 
            onClick={fetchHistory}
            className="px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
          >
            Uji Coba Muat Ulang
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        history.length === 0 ? (
          // General Empty State
          <div className="p-20 border border-dashed border-slate-850 rounded-3xl bg-[#121622]/30 text-center flex flex-col items-center justify-center space-y-5">
            <div className="p-4 rounded-xl bg-indigo-500/5 text-indigo-400 border border-slate-850">
              <Database className="w-8 h-8 opacity-60" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-200">Belum Ada Riwayat Analisis</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Database log Anda masih kosong. Pastikan Anda menguji coba komputerisasi di halaman asisten AI Analyzer terlebih dahulu untuk mengklasifikasikan operasional UMKM Anda.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('ai_analyzer')}
              className="px-4.5 py-2.5 rounded-xl bg-[#6366f1] text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              Mulai dari AI Analyzer
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Search Query Empty State
          <div className="p-16 border border-slate-850 rounded-3xl bg-[#121622]/90 text-center flex flex-col items-center justify-center space-y-2 text-slate-450">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs">
              Tidak ada riwayat analisis yang cocok dengan istilah penelusuran "{searchQuery}".
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((item) => (
            <div key={item.analysis_id}>
              <AnalysisHistoryCard
                record={item}
                onViewDetail={handleOpenDetail}
                onDelete={handleRequestDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Box Overlay */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)} />
          
          <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 max-w-sm w-full z-10 space-y-5 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-450 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm text-slate-205 text-slate-200">Hapus Riwayat Analisis?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aksi ini bersifat permanen dan akan menghapus total indeks kesehatan, diagram penjualan, serta komitmen rencana aksi terkait dari server privat.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteTargetId(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-xl border border-slate-800 transition font-bold"
              >
                Batalkan
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full py-2 bg-rose-600 hover:bg-rose-505 hover:bg-rose-500 text-white rounded-xl transition font-bold"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal Viewer */}
      <AnalysisDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        record={selectedRecord}
        onApplyToDashboard={onApplyToDashboard}
      />

    </div>
  );
}
