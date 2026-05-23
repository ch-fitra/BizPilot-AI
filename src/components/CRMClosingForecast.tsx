import React from 'react';
import { Target, ArrowRight, MessageSquareCode } from 'lucide-react';

interface CRMForecastItem {
  leadName: string;
  stage: string;
  probability: number;
  estimatedValue: number;
  nextAction: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Urgent';
}

interface CRMClosingProps {
  leads: CRMForecastItem[];
  currency: string;
}

export const CRMClosingForecast: React.FC<CRMClosingProps> = ({ leads, currency = 'IDR' }) => {
  const getUrgencyStyles = (urg: string) => {
    switch (urg) {
      case 'Urgent':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'High':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'Medium':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-800/40';
    }
  };

  const formatMoney = (val: number) => {
    return `${currency} ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Peluang Closing Pipeline CRM</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4 font-medium">Prediksi laju konversi leads aktif berdasarkan bobot minat AI dan riwayat kedekatan interaksi</p>

        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {leads.map((lead, idx) => {
            const urgencyStyles = getUrgencyStyles(lead.urgency);
            return (
              <div 
                key={idx} 
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 hover:border-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{lead.leadName}</h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-semibold">{lead.stage}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${urgencyStyles}`}>
                    {lead.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 mb-3.5">
                  <div>
                    <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">Estimasi Nilai</p>
                    <p className="text-[11.5px] font-bold text-indigo-300 mt-0.5">{formatMoney(lead.estimatedValue)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">Peluang Deal</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <p className="text-[11.5px] font-bold text-white font-mono">{lead.probability}%</p>
                    </div>
                  </div>
                </div>

                {/* Follow-up recommendation */}
                <div className="flex items-start gap-2 text-[10.5px]">
                  <MessageSquareCode className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="flex-1 text-slate-300 leading-relaxed font-medium">
                    <span className="font-bold text-slate-200">Mitigasi Sales: </span>
                    {lead.nextAction}
                  </div>
                  <div className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/40 text-[10px] text-slate-500 flex items-center justify-between">
        <span>Rata-Rata Sukses Konversi: {leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.probability, 0) / leads.length) : 0}%</span>
        <span>Akurasi CRM Pipeline: Dinamis</span>
      </div>
    </div>
  );
};
export default CRMClosingForecast;
