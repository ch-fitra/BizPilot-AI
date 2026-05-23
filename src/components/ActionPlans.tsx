import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle,
  Circle,
  Package,
  Headphones,
  Megaphone,
  Briefcase,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  LineChart,
  Coins
} from 'lucide-react';
import { ActionItem } from '../types';

interface ActionPlansProps {
  actionItems: ActionItem[];
}

export default function ActionPlans({ actionItems }: ActionPlansProps) {
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleComplete = (id: number) => {
    if (completedIds.includes(id)) {
      setCompletedIds(completedIds.filter((item) => item !== id));
    } else {
      setCompletedIds([...completedIds, id]);
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'inventory':
        return { label: 'Logistik & Stok', icon: Package, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/15' };
      case 'customer_service':
        return { label: 'Pelayanan Cs', icon: Headphones, bg: 'bg-sky-500/10 text-sky-400 border-sky-500/15' };
      case 'marketing':
        return { label: 'Pemasaran', icon: Megaphone, bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15' };
      case 'operations':
        return { label: 'Toko & Bar', icon: Layers, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' };
      case 'finance':
        return { label: 'Keuangan', icon: Coins, bg: 'bg-purple-500/10 text-purple-400 border-purple-500/15' };
      default:
        return { label: 'Umum', icon: Briefcase, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/15' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl text-left" id="action-plans-panel">
      {/* Absolute glow decorative asset */}
      <div className="absolute top-0 right-10 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-[60px] pointer-events-none" />

      {/* Header element */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5 mb-6">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">PETA AKTIVITAS UTAMA</span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            Rencana Aksi Harian BizPilot
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Daftar tugas operasional darurat yang dihasilkan oleh kecerdasan AI untuk mencegah kerugian dan memaksimalkan laba.
          </p>
        </div>

        <div className="flex gap-4 bg-[#0a0d16] border border-slate-800 rounded-2xl p-3.5 shrink-0 items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 block">PROGRES SELESAI</span>
            <span className="text-sm font-extrabold text-[#6366f1] block mt-0.5">
              {completedIds.length} dari {actionItems.length} Selesai
            </span>
          </div>
          <div className="h-2 w-28 bg-slate-800 rounded-full overflow-hidden shrink-0 relative">
            <div
              style={{ width: `${(completedIds.length / (actionItems.length || 1)) * 100}%` }}
              className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Plans List and Interactive animations */}
      <div className="space-y-4">
        {actionItems.map((item) => {
          const isCompleted = completedIds.includes(item.id);
          const isExpanded = expandedId === item.id;
          const config = getCategoryTheme(item.category);
          const IconComponent = config.icon;

          return (
            <div
              key={item.id}
              className={`border rounded-2xl transition-all ${
                isCompleted
                  ? 'bg-[#0c0f1b]/50 border-slate-900 opacity-60'
                  : 'bg-[#0a0d16]/70 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              {/* Card Header Row */}
              <div
                className="p-4 md:p-5 flex items-start gap-3.5 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Complete checkbox trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(item.id);
                  }}
                  className="mt-1 transition-all shrink-0 hover:scale-[1.15]"
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5.5 h-5.5 text-indigo-400 fill-indigo-500/10" />
                  ) : (
                    <Circle className="w-5.5 h-5.5 text-slate-600 hover:text-indigo-400" />
                  )}
                </button>

                {/* Content columns */}
                <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold tracking-wide ${
                      isCompleted ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'
                    }`}>
                      {item.task}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Priority Tag */}
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-lg ${getPriorityBadge(item.priority)}`}>
                        {item.priority === 'high' ? 'Darurat (High)' : item.priority === 'medium' ? 'Sedang' : 'Rendah'}
                      </span>

                      {/* Category Tag */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border ${config.bg}`}>
                        <IconComponent className="w-3 h-3 shrink-0" />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Toggle arrow right element */}
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400 hover:text-indigo-400 text-xs font-medium font-mono self-end md:self-auto">
                    <span>{isExpanded ? 'Tutup Detail' : 'Buka Alasan'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsed Warning Detail panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-12 pb-5 text-xs text-slate-400 leading-relaxed max-w-4xl border-t border-slate-850 pt-4 bg-[#05080f]/40 flex gap-3.5">
                      <div className="w-1 bg-[#6366f1]/60 rounded-full shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
                          <LineChart className="w-3.5 h-3.5 text-[#6366f1]" />
                          Prediksi Dampak & Rasio Kerugian Jika Diabaikan:
                        </div>
                        <p className="font-sans text-slate-300">{item.reasoning}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {actionItems.length === 0 && (
          <div className="bg-[#0a0d16]/30 border border-slate-800/80 rounded-2xl py-12 text-center text-slate-500 italic">
            Belum ada rencana aksi. Unggah dokumen untuk diramalkan AI.
          </div>
        )}
      </div>
    </div>
  );
}
