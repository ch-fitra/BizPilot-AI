import React from 'react';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  UserCheck,
  Building,
  ArrowUpRight
} from 'lucide-react';
import { CRMLead } from '../types/crm';

interface PipelineBoardProps {
  leads: CRMLead[];
  currency: string;
  onLeadClick: (id: string) => void;
  onAddLeadAtStage: (stage: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost') => void;
  onMoveStage: (id: string, newStage: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost') => void;
}

const STAGES: { code: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost'; title: string; color: string; border: string; bg: string }[] = [
  { code: 'New Lead', title: 'New Lead', color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
  { code: 'Contacted', title: 'Hubungi', color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-505/5' },
  { code: 'Qualified', title: 'Memenuhi Syarat', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' },
  { code: 'Negotiation', title: 'Negosiasi', color: 'text-pink-400', border: 'border-pink-500/20', bg: 'bg-pink-500/5' },
  { code: 'Won', title: 'Closing Won 🎉', color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/5' },
  { code: 'Lost', title: 'Gagal Lost 💔', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' }
];

export default function PipelineBoard({
  leads,
  currency,
  onLeadClick,
  onAddLeadAtStage,
  onMoveStage
}: PipelineBoardProps) {

  // Group leads by stage
  const groupedLeads = STAGES.reduce((acc, stage) => {
    acc[stage.code] = leads.filter(l => l.pipeline_stage === stage.code);
    return acc;
  }, {} as Record<string, CRMLead[]>);

  // Return badge class for lead score
  const getScoreBadge = (score: number) => {
    if (score >= 75) return 'bg-rose-500/10 text-rose-455 text-rose-400 border-rose-500/20';
    if (score >= 40) return 'bg-amber-500/10 text-amber-455 text-amber-300 border-amber-500/20';
    return 'bg-cyan-500/10 text-cyan-455 text-cyan-400 border-cyan-500/20';
  };

  const getInterestLabel = (level: string) => {
    if (level === 'Hot') return '🔥 Hot';
    if (level === 'Cold') return '❄️ Cold';
    return '⚡ Warm';
  };

  // Check followup urgency
  const getFollowUpStatus = (nextDateStr?: string | null) => {
    if (!nextDateStr) return null;
    const d = new Date(nextDateStr);
    const today = new Date();
    
    // Normalize times
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    if (dDate < todayDate) {
      return { label: 'Overdue ⚠', style: 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse' };
    }
    if (dDate === todayDate) {
      return { label: 'Hari ini', style: 'bg-amber-500/15 border-amber-500/30 text-amber-400' };
    }
    return { label: 'Scheduled', style: 'bg-slate-800 border-slate-700 text-slate-400' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start select-none overflow-x-auto pb-4">
      {STAGES.map((stg) => {
        const stageLeads = groupedLeads[stg.code] || [];
        const stageTotalValue = stageLeads.reduce((sum, l) => sum + Number(l.estimated_value || 0), 0);

        return (
          <div 
            key={stg.code}
            className={`flex flex-col bg-[#0b0e16] border border-slate-850/70 p-3.5 rounded-2xl min-h-[500px] w-full shrink-0 relative`}
          >
            
            {/* Column Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stg.color} bg-current`} />
                <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wide">
                  {stg.title}
                </h4>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9.5px] font-mono font-bold text-slate-400">
                {stageLeads.length}
              </span>
            </div>

            {/* Column Value Metrics */}
            <div className="px-2 py-1 bg-slate-950/40 rounded-lg border border-slate-900/60 flex items-center justify-between text-[10px] text-slate-400 mb-4 font-mono">
              <span className="uppercase tracking-widest text-[8.5px] text-slate-500">Value:</span>
              <span className="font-bold text-slate-200">
                {currency} {stageTotalValue.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Quick add lead inline */}
            <button
              onClick={() => onAddLeadAtStage(stg.code)}
              className="w-full py-1.5 mb-3 rounded-xl border border-dashed border-slate-850 hover:border-slate-750 bg-slate-950/20 hover:bg-[#121622] hover-scale transition text-[10.5px] text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Lead
            </button>

            {/* Card contents scroll column */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {stageLeads.length === 0 ? (
                <div className="py-12 text-center text-[10.5px] text-slate-550 border border-dashed border-slate-900/40 rounded-xl bg-slate-950/5">
                  Kolom Kosong
                </div>
              ) : (
                stageLeads.map((lead) => {
                  const followUp = getFollowUpStatus(lead.next_follow_up);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => onLeadClick(lead.id)}
                      className="group p-4.5 bg-[#121622] hover:bg-[#151b2c] border border-slate-850 hover:border-slate-800 rounded-2xl transition duration-150 text-left relative cursor-pointer shadow-xl hover:shadow-indigo-950/5 flex flex-col justify-between"
                    >
                      
                      {/* Interactive Next Stage Trigger */}
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getScoreBadge(lead.lead_score)}`}>
                            Skor: {lead.lead_score}
                          </span>
                          {lead.isOfflineDraft && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8.5px] font-bold tracking-tight animate-pulse shrink-0">
                              Offline
                            </span>
                          )}
                        </div>
                        
                        {/* Status Mutation Combo dropdown to quickly shift on any device */}

                        <select
                          value={lead.pipeline_stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onMoveStage(lead.id, e.target.value as any)}
                          className="px-1.5 py-0.5 bg-[#1d243a] hover:bg-slate-800 border border-slate-800 text-[8.5px] font-bold text-slate-250 rounded outline-none transition cursor-pointer font-mono shrink-0 select-none uppercase tracking-wide"
                        >
                          <option value="New Lead">→ New Lead</option>
                          <option value="Contacted">→ Contacted</option>
                          <option value="Qualified">→ Qualified</option>
                          <option value="Negotiation">→ Negotiation</option>
                          <option value="Won">→ Won 🎉</option>
                          <option value="Lost">→ Lost 💔</option>
                        </select>
                      </div>

                      {/* Lead Visual Identity */}
                      <div className="mt-3 text-left">
                        <h5 className="font-bold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                          {lead.lead_name}
                        </h5>
                        <div className="flex items-center gap-1 text-[9.5px] text-slate-450 mt-1">
                          <Building className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{lead.company_name || 'Personal Clients'}</span>
                        </div>
                      </div>

                      {/* Estimated Price Tagging */}
                      <p className="text-[11px] font-bold text-slate-300 mt-2.5 font-mono">
                        {currency} {Number(lead.estimated_value || 0).toLocaleString('id-ID')}
                      </p>

                      {/* Reminders / Urgency Indicator Row */}
                      <div className="border-t border-slate-900/60 pt-2.5 mt-2.5 flex flex-wrap gap-1.5 items-center justify-between">
                        
                        {/* Hot Warm Cold badge */}
                        <span className="text-[9px] font-bold text-slate-400">
                          {getInterestLabel(lead.interest_level)}
                        </span>

                        {followUp && (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${followUp.style} shrink-0`}>
                            {followUp.label}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
