import React from 'react';
import { HelpCircle, ChevronRight, Compass } from 'lucide-react';

interface SuggestedPromptCardProps {
  key?: any;
  promptText: string;
  category?: string;
  onClick: (text: string) => void;
}

export default function SuggestedPromptCard({ promptText, category = 'Strategi', onClick }: SuggestedPromptCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(promptText)}
      className="p-3.5 bg-[#121622]/40 hover:bg-[#121622]/90 border border-slate-900 hover:border-indigo-950/40 text-left rounded-2xl flex flex-col justify-between gap-3 text-xs text-slate-300 transition-all duration-250 cursor-pointer shadow-sm hover:shadow group focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono uppercase bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded text-indigo-400 font-bold shrink-0">
            {category}
          </span>
        </div>
        <p className="text-[11.5px] leading-relaxed text-slate-200 mt-1.5 font-sans break-words font-medium">
          "{promptText}"
        </p>
      </div>
      
      <div className="flex items-center justify-end text-[10px] text-slate-500 font-mono group-hover:text-indigo-400 font-semibold gap-0.5">
        Tanyakan AI
        <ChevronRight className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
