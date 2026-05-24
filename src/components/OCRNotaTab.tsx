import React, { useCallback, useRef, useState } from 'react';
import { Camera, Upload, Scan, CheckCircle, AlertCircle, Loader2, RefreshCw, Package, DollarSign, FileText, X } from 'lucide-react';

interface ExtractedItem {
  name: string;
  qty: number | null;
  unit_price: number | null;
  subtotal: number | null;
  category_hint: string | null;
}

interface OCRResult {
  status: 'ok' | 'partial' | 'unreadable';
  merchant_name: string | null;
  transaction_date: string | null;
  transaction_time: string | null;
  currency: 'IDR' | null;
  payment_method: string | null;
  items: ExtractedItem[];
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  service_charge: number | null;
  total: number | null;
  confidence: number;
  warnings: string[];
}

interface OCRNotaTabProps {
  setActiveTab: (tab: string) => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'bahan_baku', label: 'Bahan Baku / Stok' },
  { value: 'gaji', label: 'Gaji Karyawan' },
  { value: 'sewa', label: 'Sewa Tempat' },
  { value: 'listrik', label: 'Listrik & Air' },
  { value: 'transport', label: 'Transport & Pengiriman' },
  { value: 'marketing', label: 'Marketing & Promosi' },
  { value: 'peralatan', label: 'Peralatan & Inventaris' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function OCRNotaTab({ setActiveTab }: OCRNotaTabProps) {
  void setActiveTab;
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('bahan_baku');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang didukung (JPG, PNG, WebP, HEIC).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran gambar terlalu besar. Maksimal 10MB.');
      return;
    }

    setError(null);
    setOcrResult(null);
    setSavedSuccess(false);
    setPreviewUrl(URL.createObjectURL(file));
    setIsScanning(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/ocr/nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64, mimeType: file.type, fileName: file.name }),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error || 'Gagal mengekstrak data dari struk.');
        return;
      }

      const extracted: OCRResult = result.data;
      setOcrResult(extracted);
      if (extracted.status === 'unreadable') {
        setError('Nota tidak terbaca jelas. Silakan foto ulang.');
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleSaveAsExpense = async () => {
    if (!ocrResult || !ocrResult.total || ocrResult.total <= 0) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/cashflow/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          category: selectedCategory,
          amount: ocrResult.total,
          description: `Nota dari ${ocrResult.merchant_name || 'Merchant tidak diketahui'} - ${ocrResult.items.length} item`,
          entry_date: ocrResult.transaction_date || new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) setSavedSuccess(true);
      else setError(data.error || 'Gagal menyimpan ke cashflow.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setOcrResult(null);
    setPreviewUrl(null);
    setError(null);
    setSavedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 mb-1">OCR NOTA & STRUK</p>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-400" />
            Scan Struk / Nota Belanja
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">Data berhasil dibaca, mohon cek kembali sebelum disimpan.</p>
        </div>
        {ocrResult && (
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
            Scan Ulang
          </button>
        )}
      </div>

      {!ocrResult && (
        <div onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} className={`relative border-2 border-dashed rounded-3xl transition-all duration-300 overflow-hidden ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-800 bg-[#121622]/50 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} id="nota-file-input" />
          <div className="p-8 sm:p-12 text-center">
            {isScanning ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs text-slate-400">Memproses OCR ketat...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-indigo-400" />
                </div>
                <label htmlFor="nota-file-input" className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">
                  <Upload className="w-4 h-4" />
                  Ambil Foto / Pilih Gambar
                </label>
                <p className="text-[10px] text-slate-600 font-mono">JPG - PNG - WebP - HEIC - Maks. 10MB</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-950/30 border border-rose-500/25 text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold">OCR gagal</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {ocrResult && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-emerald-950/30 to-indigo-950/20 border border-emerald-500/25">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Ekstraksi {ocrResult.status}</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-100">{ocrResult.merchant_name || 'Merchant tidak diketahui'}</h3>
              <p className="text-xs text-slate-400">Tanggal: <strong className="text-slate-300">{ocrResult.transaction_date || '-'}</strong> · Confidence: <strong className={ocrResult.confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}>{Math.round(ocrResult.confidence * 100)}%</strong></p>
            </div>
            {previewUrl && <img src={previewUrl} alt="Struk" className="w-20 h-20 object-cover rounded-xl border border-slate-700 shrink-0" />}
          </div>

          {ocrResult.warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30">
              <p className="text-xs font-bold text-amber-300 mb-2">Warnings</p>
              <div className="text-xs text-amber-200 space-y-1">
                {ocrResult.warnings.map((warning, idx) => <div key={`${warning}-${idx}`}>- {warning}</div>)}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-[#0f1322] border-b border-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Daftar Item ({ocrResult.items.length})</span>
            </div>
            <div className="divide-y divide-slate-900">
              {ocrResult.items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="grid grid-cols-12 px-4 py-3 items-center">
                  <div className="col-span-5 text-xs text-slate-200">{item.name}</div>
                  <div className="col-span-2 text-center text-xs text-slate-400">{item.qty ?? '-'}</div>
                  <div className="col-span-2 text-right text-xs text-slate-400">{item.unit_price !== null ? formatRupiah(item.unit_price) : '-'}</div>
                  <div className="col-span-3 text-right text-xs text-slate-200">{item.subtotal !== null ? formatRupiah(item.subtotal) : '-'}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 bg-[#0f1322] divide-y divide-slate-800/50">
              {typeof ocrResult.subtotal === 'number' && <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-500">Subtotal</span><span className="text-slate-300">{formatRupiah(ocrResult.subtotal)}</span></div>}
              {typeof ocrResult.discount === 'number' && ocrResult.discount > 0 && <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-500">Diskon</span><span className="text-slate-300">- {formatRupiah(ocrResult.discount)}</span></div>}
              {typeof ocrResult.tax === 'number' && ocrResult.tax > 0 && <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-500">Pajak</span><span className="text-slate-300">{formatRupiah(ocrResult.tax)}</span></div>}
              {typeof ocrResult.service_charge === 'number' && ocrResult.service_charge > 0 && <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-500">Service Charge</span><span className="text-slate-300">{formatRupiah(ocrResult.service_charge)}</span></div>}
              <div className="flex justify-between px-4 py-3"><span className="text-sm font-bold text-slate-200">TOTAL</span><span className="text-lg font-black text-emerald-400">{ocrResult.total !== null ? formatRupiah(ocrResult.total) : '-'}</span></div>
            </div>
          </div>

          {savedSuccess ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 text-emerald-300">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs">Pengeluaran berhasil dicatat ke cashflow.</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Simpan sebagai Pengeluaran</span>
              </div>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200">
                {EXPENSE_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
              <button onClick={handleSaveAsExpense} disabled={isSaving || !ocrResult.total || ocrResult.total <= 0 || ocrResult.status === 'unreadable'} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {isSaving ? 'Menyimpan...' : 'Simpan ke Cashflow'}
              </button>
            </div>
          )}
        </div>
      )}

      {!ocrResult && !isScanning && (
        <div className="p-4 rounded-2xl bg-[#121622]/60 border border-slate-850 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-indigo-400" />Mode OCR ketat aktif.</div>
          <div>Jika nota tidak jelas, sistem akan menandai unreadable dan meminta foto ulang.</div>
        </div>
      )}
    </div>
  );
}
