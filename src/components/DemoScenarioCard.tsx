import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface DemoScenarioCardProps {
  title: string;
  type: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export const DemoScenarioCard: React.FC<DemoScenarioCardProps> = ({
  title,
  type,
  description,
  selected,
  onSelect
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left min-h-[92px] ${
        selected
          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
          : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-700'
      }`}
    >
      <div className="flex justify-between items-start gap-3 mb-1.5">
        <span className="text-xs font-bold text-slate-200 leading-snug">{title}</span>
        {selected ? (
          <CheckCircle2 className="w-4 h-4 text-indigo-300 shrink-0" />
        ) : (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 shrink-0">
            {type}
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed">{description}</p>
    </button>
  );
};
