import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, MessageSquare, Database, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadZoneProps {
  onAnalyze: (payload: {
    fileData?: string;
    fileName?: string;
    fileType?: string;
    textInput?: string;
    businessType: string;
  }) => void;
  isLoading: boolean;
}

export default function UploadZone({ onAnalyze, isLoading }: UploadZoneProps) {
  const [businessType, setBusinessType] = useState('F&B Cafe');
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const businessTypes = [
    { label: '☕ F&B Cafe / Warung Kopi', value: 'F&B Cafe' },
    { label: '👚 Fashion & Pakaian', value: 'Retail Fashion' },
    { label: '🧺 Laundry Kiloan', value: 'Laundry Services' },
    { label: '🛒 Sembako / Kelontong', value: 'Grocery Store' },
    { label: '🥗 Kuliner & Warung Makan', value: 'Culiner Local' }
  ];

  // Helper file size formatter
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      if (commaIndex !== -1) {
        setBase64Data(result.slice(commaIndex + 1));
      } else {
        setBase64Data(result);
      }
      setFileType(file.type || 'text/csv');
      setAttachedFile({ name: file.name, size: formatBytes(file.size) });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    onAnalyze({
      fileData: base64Data || undefined,
      fileName: attachedFile?.name,
      fileType: fileType || undefined,
      textInput: textInput.trim() || undefined,
      businessType,
    });
  };

  // Demo Accelerators
  const loadDemo = (type: 'csv' | 'reviews' | 'chat') => {
    if (type === 'csv') {
      setBusinessType('F&B Cafe');
      setAttachedFile({ name: 'laporan_penjualan_mingguan.csv', size: '1.2 KB' });
      setFileType('text/csv');
      // Simple base64 for CSV text content
      const csvStr = `Date,Sales,Transactions,ItemsSold,TopItem\n2026-05-16,1300000,38,24,Es Kopi Susu\n2026-05-17,1450000,42,28,Es Kopi Susu\n2026-05-18,2200000,68,45,Almond Croissant\n2026-05-19,1050000,30,19,Es Kopi Susu\n2026-05-20,410000,11,6,Oat Latte (Stok Oat Milk MENIPIS-Habis!)\n2026-05-21,650000,18,12,Es Kopi Susu\n2026-05-22,380000,10,7,Es Kopi Susu (Barista AC Rusak, Toko Gerah)`;
      setBase64Data(btoa(csvStr));
      setTextInput('Laporan harian toko mendeteksi anomali pada 20 Mei di mana penjualan Oat Latte anjlok karena stok susu habis terbuang atau keterlambatan pengiriman suplier.');
    } else if (type === 'reviews') {
      setBusinessType('F&B Cafe');
      setAttachedFile(null);
      setBase64Data('');
      setFileType('');
      setTextInput(`Review Google Maps Kopi Selaras Kemarin Sore:
1. "Kopinya enak tapi tempatnya panas sekali! Ternyata pendingin ruangan (AC) di area barista pecah bocor, kasihan staff sampai keringatan." (Rating 2/5)
2. "Pesan croissant coklat tapi dikasih dingin tidak di-toast dulu, pas komplain staff-nya agak keteteran karena ojek online antri rame sekali." (Rating 3/5)
3. "Kopi susu gula aren terbaik di Cilandak! Tapi tolong dipercepat ya kalau order online, sering telat nyampe." (Rating 4/5)
4. "Stok oatmilk kosong melulu, padahal pengen oatlatte." (Rating 2/5)`);
    } else if (type === 'chat') {
      setBusinessType('Retail Fashion');
      setAttachedFile(null);
      setBase64Data('');
      setFileType('');
      setTextInput(`Log Chat WhatsApp Admin Pelanggan & Gudang:
[09:30] Pelanggan: "Halo sis, pesanan saya baju gamis sutra brokat ukuran L dengan resi ID-99827 kok belum dikirim juga ya? Sudah 3 hari tertahan."
[10:15] Admin Cs: "Maaf kak, sebentar kami cek ke tim logistik gudang."
[11:00] Tim Gudang: "Siang sis, baju gamis sutra brokat L ternyata habis stok kosong di rak 4. Kita lupa update stock opname di dashboard, jadi pembeli tetap bisa bayar padahal kosong."
[11:05] Admin Cs: "Waduh gawat, ini pelanggan marah-marah minta refunds!"`);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setBase64Data('');
    setFileType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#121622]/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden" id="bizpilot-upload-panel">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none" />

      {/* Header element */}
      <div className="flex items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Control Center Data
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Unggah file data operasional harian atau ketik deskripsi kejadian UMKM untuk dianalisis oleh AI.
          </p>
        </div>
        
        {/* Business Select Card */}
        <div className="min-w-[160px] md:min-w-[220px]">
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Tipe UMKM</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#0a0d16] text-slate-200 text-sm border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer"
          >
            {businessTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Zone & Text Input Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Drag/Drop Zone column */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Unggah Dokumen / Gambar</span>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-[#0a0d16]/60 hover:bg-[#0b0e1a]'
              } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv, .txt, .json, image/*"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-200">
                Tarik & Lepas File ke Sini
              </p>
              <p className="text-xs text-slate-400 mt-2 max-w-[260px] mx-auto">
                Mendukung ulasan CSV, data Excel, kwitansi invoice, screenshot chat pelanggan, atau struk belanja (Max 5MB)
              </p>
            </div>
          </div>

          {/* Render File Details if Attached */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0a0d16] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 mt-4"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-medium text-slate-200 truncate">{attachedFile.name}</p>
                    <p className="text-[10px] font-mono text-indigo-300">{attachedFile.size}</p>
                  </div>
                </div>
                <button
                  onClick={removeAttachedFile}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-red-400 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition"
                >
                  Batal
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Manual Report Area Column */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Log Deskripsi Kejadian (Opsional)</span>
            <div className="relative flex-grow flex flex-col">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ketik ulasan mentah dari Google Maps, laporan dari kasir, atau screenshot chat teks pelanggan yang komplain di sini..."
                disabled={isLoading}
                className="w-full flex-grow min-h-[190px] bg-[#0a0d16]/60 border border-slate-800 rounded-2xl p-4 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-sans resize-none placeholder-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Demo shortcuts & main trigger action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium font-sans mr-1">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
            Uji Coba Demo Instan:
          </span>
          <button
            onClick={() => !isLoading && loadDemo('csv')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171f38] border border-slate-700/60 rounded-xl hover:bg-[#1a2546] text-xs font-medium text-indigo-200 transition-all hover:scale-[1.02]"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Laporan Penjualan (CSV)
          </button>
          <button
            onClick={() => !isLoading && loadDemo('reviews')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171f38] border border-slate-700/60 rounded-xl hover:bg-[#1a2546] text-xs font-medium text-indigo-200 transition-all hover:scale-[1.02]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            Ulasan Maps (Dine-in)
          </button>
          <button
            onClick={() => !isLoading && loadDemo('chat')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171f38] border border-slate-700/60 rounded-xl hover:bg-[#1a2546] text-xs font-medium text-indigo-200 transition-all hover:scale-[1.02]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            WhatsApp Cs & Gudang
          </button>
        </div>

        <button
          onClick={handleAnalyzeClick}
          disabled={isLoading || (!base64Data && !textInput.trim())}
          className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 ${
            isLoading || (!base64Data && !textInput.trim())
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
          Komputerisasi Analisis Co-Pilot
        </button>
      </div>
    </div>
  );
}
