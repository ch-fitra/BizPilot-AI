import React from 'react';
import { Mic, RotateCcw, Save, X } from 'lucide-react';
import { OfflineQueueService } from '../services/offlineQueueService';
import { SyncService } from '../services/syncService';
import { WarungModeClient, WarungParsedItem } from '../services/warungModeService';

type VoiceState = 'idle' | 'listening' | 'processing' | 'review' | 'error';

export default function WarungModeTab() {
  const [voiceState, setVoiceState] = React.useState<VoiceState>('idle');
  const [transcript, setTranscript] = React.useState('');
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [items, setItems] = React.useState<WarungParsedItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const speechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListen = () => {
    setError(null);
    if (!speechSupported) {
      setVoiceState('idle');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results).map((r: any) => r[0]?.transcript || '').join(' ').trim();
      setTranscript(text);
    };
    recognition.onerror = () => {
      setVoiceState('error');
      setError('Gagal membaca suara. Coba ulangi.');
    };
    recognition.onend = async () => {
      if (!transcript.trim()) {
        setVoiceState('idle');
        return;
      }
      setVoiceState('processing');
      try {
        const parsed = await WarungModeClient.parseVoice(transcript);
        setItems(parsed.items);
        setWarnings(parsed.warnings);
        setVoiceState('review');
      } catch (e: any) {
        setVoiceState('error');
        setError(e.message || 'Gagal memproses transcript.');
      }
    };
    recognitionRef.current = recognition;
    setVoiceState('listening');
    recognition.start();
  };

  const updateItem = (idx: number, key: keyof WarungParsedItem, value: any) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  };

  const onSave = async () => {
    const idempotencyKey = `warung:${Date.now()}:${transcript.slice(0, 50)}`;
    const payload = { transcript, status: 'partial' as const, items, idempotency_key: idempotencyKey };
    try {
      await WarungModeClient.saveTransaction(payload);
      setVoiceState('idle');
      setTranscript('');
      setItems([]);
      setWarnings([]);
    } catch {
      await OfflineQueueService.enqueue('save_warung_transaction', payload);
      if (navigator.onLine) void SyncService.syncAllPending();
      setVoiceState('idle');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-widest text-slate-300">Warung Mode</h2>
      <p className="text-xs text-slate-400">Tekan tombol, lalu sebutkan transaksi. Contoh: Jual 2 Indomie, 1 Teh Botol.</p>
      {!speechSupported && <p className="text-xs text-amber-300">Browser tidak mendukung input suara. Ketik transaksi secara manual.</p>}
      <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={3} className="w-full rounded-xl bg-[#121622] border border-slate-800 p-3 text-sm" placeholder="Cek dulu hasilnya sebelum disimpan." />
      <div className="flex gap-2">
        <button onClick={startListen} className="px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center gap-2"><Mic className="w-4 h-4" />Mulai Bicara</button>
        <button onClick={() => { setTranscript(''); setItems([]); setWarnings([]); setVoiceState('idle'); }} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-200 text-sm font-bold flex items-center gap-2"><RotateCcw className="w-4 h-4" />Ulangi</button>
      </div>
      {voiceState === 'processing' && <p className="text-xs text-slate-400">Memproses transcript...</p>}
      {voiceState === 'error' && <p className="text-xs text-rose-300">{error}</p>}
      {voiceState === 'review' && (
        <div className="space-y-3">
          {warnings.length > 0 && <div className="text-xs text-amber-300">{warnings.join(', ')}</div>}
          {items.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="grid grid-cols-2 gap-2 rounded-xl bg-[#121622] border border-slate-800 p-3">
              <input className="rounded bg-slate-900 border border-slate-700 p-2 text-xs" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
              <input className="rounded bg-slate-900 border border-slate-700 p-2 text-xs" value={item.qty ?? ''} onChange={(e) => updateItem(idx, 'qty', e.target.value ? Number(e.target.value) : null)} placeholder="Qty" />
              <input className="rounded bg-slate-900 border border-slate-700 p-2 text-xs" value={item.unit_price ?? ''} onChange={(e) => updateItem(idx, 'unit_price', e.target.value ? Number(e.target.value) : null)} placeholder="Harga" />
              <input className="rounded bg-slate-900 border border-slate-700 p-2 text-xs" value={item.subtotal ?? ''} onChange={(e) => updateItem(idx, 'subtotal', e.target.value ? Number(e.target.value) : null)} placeholder="Subtotal" />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={onSave} className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center gap-2"><Save className="w-4 h-4" />Simpan Transaksi</button>
            <button onClick={() => setVoiceState('idle')} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-200 text-sm font-bold flex items-center gap-2"><X className="w-4 h-4" />Batalkan</button>
          </div>
        </div>
      )}
    </div>
  );
}
