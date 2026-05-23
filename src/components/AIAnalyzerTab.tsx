import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  HelpCircle, 
  Database, 
  ShieldAlert, 
  ListOrdered,
  Image as ImageIcon
} from 'lucide-react';
import UploadZone from './UploadZone';
import ThinkingFeed from './ThinkingFeed';

interface AIAnalyzerTabProps {
  onAnalyze: (payload: {
    fileData?: string;
    fileName?: string;
    fileType?: string;
    textInput?: string;
    businessType: string;
  }) => void;
  isLoading: boolean;
}

export default function AIAnalyzerTab({ onAnalyze, isLoading }: AIAnalyzerTabProps) {
  
  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Upper Context Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Cpu className="w-5.5 h-5.5 text-indigo-400" />
            AI Reasoning Engine Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan pengenalan multi-model Gemini 3.5 Flash untuk membaca spreadsheet penjualan, struk belanja fisik, atau riwayat chat secara otonom.
          </p>
        </div>
      </div>

      {/* Upload Zone & Interactive Loader */}
      <div className="space-y-6">
        <UploadZone onAnalyze={onAnalyze} isLoading={isLoading} />
        <ThinkingFeed isVisible={isLoading} />
      </div>

      {/* Multi-modal guidelines card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Step 1 */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono text-xs">
            1
          </div>
          <h4 className="font-semibold text-sm text-slate-200">Siapkan & Unggah Dokumen</h4>
          <p className="text-xs text-slate-450 leading-relaxed">
            Ambil ulasan pembeli dari Google Maps, foto slip tagihan, atau file invoice CSV bulanan Anda, lalu kumpulkan ke portal drag-and-drop di atas.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono text-xs">
            2
          </div>
          <h4 className="font-semibold text-sm text-slate-200">Komputerisasi Logika AI</h4>
          <p className="text-xs text-slate-450 leading-relaxed">
            Gemini 3.5 secara otonom memecah ulasan gambar, menghitung total unit logistik, mendiagnosis anomali, dan menyaring ulasan pembeli tanpa campur tangan data analis manusia.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono text-xs">
            3
          </div>
          <h4 className="font-semibold text-sm text-slate-200">Implementasi Aksi Strategis</h4>
          <p className="text-xs text-slate-450 leading-relaxed">
            Stok opname, estimasi grafik penjualan harian, dan ringkasan komitmen aksi di dasbor Anda diperbarui secara live berdasarkan keputusan robot asisten.
          </p>
        </div>

      </div>

    </div>
  );
}
