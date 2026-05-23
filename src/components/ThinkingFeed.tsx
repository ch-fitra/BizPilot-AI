import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

interface ThinkingFeedProps {
  isVisible: boolean;
}

export default function ThinkingFeed({ isVisible }: ThinkingFeedProps) {
  const steps = [
    { text: "Mengurai payload dokumen & mengekstrak metrik operasional...", delay: 0 },
    { text: "Melakukan integrasi hitungan & kalkulasi HPP finansial...", delay: 1800 },
    { text: "Mendeteksi anomali persediaan barang dan kapasitas gudang...", delay: 3500 },
    { text: "Mengevaluasi sentimen topik keluhan dan kepuasan pelanggan...", delay: 5200 },
    { text: "Menyusun skala prioritas rekomendasi (Daily Action Plan)...", delay: 7000 },
    { text: "Menghasilkan visualisasi dasbor & peta skor kesehatan operasional...", delay: 8500 }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setActiveIndex(0);
      return;
    }

    const timers = steps.map((step, idx) => {
      return setTimeout(() => {
        setActiveIndex(idx);
      }, step.delay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="bg-[#101423] border border-indigo-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-lg relative overflow-hidden" id="bizpilot-thinking-panel">
      {/* Absolute pulsing scanner line across the top */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 animate-pulse" />
      
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        <div>
          <h3 className="text-base font-semibold text-slate-100 font-sans tracking-wide">
            BizPilot AI sedang Menalar...
          </h3>
          <p className="text-xs text-slate-400">
            Copilot sedang menganalisis dokumen dan mengevaluasi kesehatan operasional UMKM Anda.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: idx <= activeIndex ? 1 : 0.3, 
                x: 0,
                scale: isActive ? 1.01 : 1
              }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3.5 p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-950/40 border border-indigo-500/20' 
                  : isDone 
                    ? 'bg-transparent' 
                    : 'bg-transparent'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-700" />
                )}
              </div>
              
              <div className="text-left">
                <p className={`text-sm font-medium transition-colors ${
                  isActive 
                    ? 'text-indigo-200' 
                    : isDone 
                      ? 'text-slate-400 line-through decoration-slate-600/65' 
                      : 'text-slate-600'
                }`}>
                  {step.text}
                </p>
                {isActive && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.8, ease: "linear" }}
                    className="h-1 bg-indigo-500/40 rounded-full mt-2 overflow-hidden"
                  >
                    <div className="h-full bg-indigo-400" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
