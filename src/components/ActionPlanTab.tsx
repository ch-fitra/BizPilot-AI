import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Bookmark,
  ChevronRight,
  Filter
} from 'lucide-react';
import { BusinessHealthState, ActionItem } from '../types';

interface ActionPlanTabProps {
  businessState: BusinessHealthState;
  onUpdateActionItems: (items: ActionItem[]) => void;
}

export default function ActionPlanTab({ businessState, onUpdateActionItems }: ActionPlanTabProps) {
  
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState<'inventory' | 'customer_service' | 'marketing' | 'operations' | 'finance'>('operations');
  const [reasoning, setReasoning] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Initialize from parent
  useEffect(() => {
    if (businessState.action_plan && businessState.action_plan.length > 0) {
      setTasks(businessState.action_plan);
    }
  }, [businessState.action_plan]);

  // Priority Colors
  const getPriorityStyle = (prio: string) => {
    switch (prio) {
      case 'high':
        return 'border-l-4 border-rose-500 bg-rose-950/10 text-rose-300';
      case 'medium':
        return 'border-l-4 border-amber-500 bg-amber-950/10 text-amber-300';
      default:
        return 'border-l-4 border-indigo-500 bg-indigo-950/10 text-indigo-300';
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'high':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-400';
      case 'medium':
        return 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
      default:
        return 'bg-indigo-505/10 bg-indigo-500/10 border border-indigo-500/25 text-indigo-455 text-indigo-300';
    }
  };

  // Status mapping
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400';
      case 'In Progress':
        return 'bg-amber-500/15 border border-amber-500/30 text-amber-400';
      default:
        return 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700';
    }
  };

  // Toggle tasks status (Pending -> In Progress -> Done)
  const handleToggleStatus = (id: number) => {
    const nextStatusMap: Record<string, string> = {
      'Pending': 'In Progress',
      'In Progress': 'Done',
      'Done': 'Pending'
    };

    const updated = tasks.map(t => {
      if (t.id === id) {
        // Assume type ActionItem has 'status' optionally or we can support interactive mock status shifting using a helper dictionary
        const current = (t as any).status || 'Pending';
        return { ...t, status: nextStatusMap[current] || 'Pending' };
      }
      return t;
    });

    setTasks(updated);
    onUpdateActionItems(updated);
  };

  // Create new manual task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const newTask: ActionItem = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      priority,
      task: taskName.trim(),
      category,
      reasoning: reasoning.trim() || 'Langkah mitigasi manual yang ditambahkan oleh pimpinan operasional.',
    };

    // Initialize state status on brand new task
    (newTask as any).status = 'Pending';

    const updated = [newTask, ...tasks];
    setTasks(updated);
    onUpdateActionItems(updated);

    // Reset Form
    setTaskName('');
    setReasoning('');
    setPriority('medium');
    setCategory('operations');
  };

  // Delete Action Item
  const handleDeleteTask = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    onUpdateActionItems(updated);
  };

  // Filters
  const filteredTasks = tasks.filter(t => {
    if (filterPriority === 'all') return true;
    return t.priority === filterPriority;
  });

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5.5 h-5.5 text-indigo-400" />
            Rencana Komitmen Operasional (Daily Action Plan)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Eksekusi rekomendasi strategis di bawah ini dan tandai status penyelesaiannya untuk menjaga stabilitas profit UMKM.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#121622] text-slate-300 text-xs border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Saring: Semua Prioritas</option>
            <option value="high">Saring: Tinggi (High)</option>
            <option value="medium">Saring: Sedang (Medium)</option>
            <option value="low">Saring: Rendah (Low)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tasks Lists (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          
          {filteredTasks.map((t) => {
            const currentStatus = (t as any).status || 'Pending';
            
            return (
              <div 
                key={t.id} 
                className={`p-5 rounded-2xl bg-[#121622]/95 border border-slate-850 hover:border-slate-700 transition flex flex-col md:flex-row items-start justify-between gap-4 ${getPriorityStyle(t.priority)}`}
              >
                
                {/* Content Block */}
                <div className="space-y-2 flex-grow text-left">
                  
                  {/* Category and priority headings */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono tracking-wider font-bold uppercase py-0.5 px-2 bg-indigo-505/10 bg-indigo-500/20 text-indigo-400 rounded-lg">
                      {t.category}
                    </span>
                    <span className={`text-[9px] font-mono tracking-wider font-bold uppercase py-0.5 px-2 rounded-lg border leading-none ${getPriorityBadge(t.priority)}`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Operational action sentence */}
                  <p className="font-semibold text-slate-100 text-sm leading-relaxed">
                    {t.task}
                  </p>

                  {/* AI Reasoning justification details */}
                  <p className="text-xs text-slate-400 font-sans leading-relaxed pl-3 border-l border-slate-800">
                    <span className="text-indigo-400 font-medium font-mono block mb-0.5">ALASAN & DAMPAK MITIGASI AI:</span>
                    {t.reasoning}
                  </p>
                </div>

                {/* Status Toggle control block (Right button) */}
                <div className="flex md:flex-col items-center justify-between md:justify-end gap-3.5 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => handleToggleStatus(t.id)}
                    className={`px-3.5 py-1.8 rounded-xl font-bold text-xs tracking-wider transition-all min-w-[110px] ${getStatusStyle(currentStatus)}`}
                    title="Klik untuk mengubah status tugas"
                  >
                    {currentStatus === 'Done' ? (
                      <span className="flex items-center gap-1 justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Selesai
                      </span>
                    ) : currentStatus === 'In Progress' ? (
                      <span className="flex items-center gap-1 justify-center">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} /> Diproses
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 justify-center text-slate-400">
                        Tertunda (Tunda)
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1 px-2 rounded-lg text-slate-500 hover:text-rose-450 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
                    title="Hapus Aksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="p-16 border border-slate-850 rounded-3xl bg-[#121622]/90 text-center text-slate-500 italic flex flex-col items-center justify-center space-y-2">
              <Bookmark className="w-10 h-10 text-slate-700" />
              <p className="text-xs">
                Tidak ada rencana aksi yang cocok dengan saringan saringan Anda.
              </p>
            </div>
          )}

        </div>

        {/* Right Side: Form to Create manual task (4 columns) */}
        <div className="lg:col-span-4 bg-[#121622]/95 border border-slate-850 rounded-3xl p-6 h-fit relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-[32px] pointer-events-none" />
          
          <h3 className="text-sm font-mono text-slate-350 uppercase tracking-widest font-bold flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-indigo-400" />
            Tambah Aksi Manual
          </h3>

          <form onSubmit={handleAddTask} className="space-y-4 text-xs font-sans">
            
            {/* Task Name */}
            <div className="space-y-1.5 text-left">
              <label className="block font-semibold text-slate-400 font-mono">Pernyataan Langkah Tugas</label>
              <input
                type="text"
                required
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Misal: Perbaiki AC Barista bocor pecah..."
                className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
              />
            </div>

            {/* Select Priority & Category Grid */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-400 font-mono">Kategori Urgensi</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-2 py-2 text-slate-350 text-xs font-sans focus:outline-none cursor-pointer"
                >
                  <option value="high">⚠️ Tinggi (High)</option>
                  <option value="medium">⚡ Sedang (Medium)</option>
                  <option value="low">🌱 Rendah (Low)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-400 font-mono">Divisi Operasional</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-2 py-2 text-slate-350 text-xs font-sans focus:outline-none cursor-pointer"
                >
                  <option value="operations">Operasional</option>
                  <option value="inventory">Logistik</option>
                  <option value="customer_service">Servis</option>
                  <option value="marketing">Pemasaran</option>
                  <option value="finance">Keuangan</option>
                </select>
              </div>
            </div>

            {/* Mitigasi Warning Reason details */}
            <div className="space-y-1.5 text-left">
              <label className="block font-semibold text-slate-400 font-mono">Detail Alasan & Dampak (Opsional)</label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Rincikan margin profit yang terselamatkan atau resiko jika ditunda..."
                className="w-full h-20 bg-[#0a0d16] border border-slate-800 rounded-xl p-3 text-slate-350 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none font-sans placeholder-slate-705"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-650 bg-indigo-600 border border-indigo-550 text-white hover:bg-indigo-500 font-semibold tracking-wide transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Sisipkan Tugas Aksi
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
