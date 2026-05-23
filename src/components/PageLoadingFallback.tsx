import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingFallbackProps {
  label?: string;
}

export default function PageLoadingFallback({ label = 'Memuat modul BizPilot AI...' }: PageLoadingFallbackProps) {
  return (
    <div className="min-h-[360px] rounded-2xl border border-slate-850 bg-[#101421]/70 p-6 flex flex-col items-center justify-center gap-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl" />
        <div className="relative h-11 w-11 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-200">{label}</p>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Lazy module loading
        </p>
      </div>
    </div>
  );
}
