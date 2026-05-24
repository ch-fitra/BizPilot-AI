import React from 'react';
import { RefreshCw, Brain } from 'lucide-react';
import { BusinessMemoryClient, BusinessMemoryRecord } from '../services/businessMemoryService';

export default function BusinessMemoryTab() {
  const [memories, setMemories] = React.useState<BusinessMemoryRecord[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await BusinessMemoryClient.list(1, 20);
      setMemories(data);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void load();
  }, []);

  const runGenerate = async () => {
    setLoading(true);
    try {
      await BusinessMemoryClient.generate('weekly_summary');
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-widest text-slate-300">Business Memory</h2>
        <button onClick={runGenerate} disabled={loading} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2">
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
          Generate Memory
        </button>
      </div>
      <p className="text-xs text-slate-400">Data berhasil dibaca, mohon cek kembali sebelum disimpan.</p>
      <div className="space-y-3">
        {memories.map((m) => (
          <div key={m.id} className="p-4 rounded-2xl bg-[#121622] border border-slate-850">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase text-indigo-300">{m.memory_type}</span>
              <span className="text-[10px] font-mono text-slate-500">{new Date(m.created_at).toLocaleString('id-ID')}</span>
            </div>
            <p className="text-sm font-bold text-slate-100 mt-1">{m.title}</p>
            <p className="text-xs text-slate-400 mt-1">{m.content}</p>
          </div>
        ))}
        {memories.length === 0 && <div className="p-4 rounded-2xl bg-[#121622] border border-slate-850 text-xs text-slate-500">Belum ada memory bisnis.</div>}
      </div>
    </div>
  );
}
