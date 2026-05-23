import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, HelpCircle } from 'lucide-react';

interface ThreatRadar {
  salesRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  inventoryRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  customerSentimentRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  crmPipelineRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  operationalExecutionRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface RiskProps {
  radar: ThreatRadar;
}

export const BusinessRiskRadar: React.FC<RiskProps> = ({ radar }) => {
  const getRiskValue = (level: string) => {
    switch (level) {
      case 'Critical': return { score: 100, label: 'Kritis', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/20' };
      case 'High': return { score: 75, label: 'Tinggi', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20' };
      case 'Medium': return { score: 45, label: 'Sedang', color: 'bg-indigo-400', text: 'text-indigo-400', border: 'border-indigo-500/20' };
      case 'Low':
      default:
        return { score: 15, label: 'Rendah', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    }
  };

  const threatFields = [
    { key: 'salesRisk', label: 'Ancaman Penjualan & Omzet (Sales Risk)', desc: 'Stabilitas transaksi harian vs target', value: radar.salesRisk },
    { key: 'inventoryRisk', label: 'Ancaman Pasokan Bahan Baku (Inventory Risk)', desc: 'Kehabisan stok produk kritis', value: radar.inventoryRisk },
    { key: 'customerSentimentRisk', label: 'Ancaman Sentimen Pembeli (Sentiment Risk)', desc: 'Feedback negatif & risiko retensi', value: radar.customerSentimentRisk },
    { key: 'crmPipelineRisk', label: 'Hambatan Pipeling CRM (CRM Pipeline Obstacle)', desc: 'Kelambatan prospek bertransisi menjadi pembeli', value: radar.crmPipelineRisk },
    { key: 'operationalExecutionRisk', label: 'Hambatan Eksekusi Kerja (Execution Risk)', desc: 'Keterlambatan penyelesaian logistik harian', value: radar.operationalExecutionRisk }
  ];

  const overallScore = Math.round(
    threatFields.reduce((sum, field) => sum + getRiskValue(field.value).score, 0) / threatFields.length
  );

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Matriks Radar Risiko Bisnis</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">Nilai estimasi keparahan lima pilar operasional UMKM penentu keberlanjutan bisnis</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950">
          <span className="text-[10px] text-slate-400 font-mono">SKOR INDEX TOTAL:</span>
          <span className={`text-xs font-mono font-black ${overallScore >= 60 ? 'text-rose-400' : overallScore >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {overallScore}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Pilar Metrics Rows */}
        <div className="lg:col-span-7 space-y-4">
          {threatFields.map((field, idx) => {
            const config = getRiskValue(field.value);
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-[11.5px]">
                  <div>
                    <span className="font-semibold text-slate-200">{field.label}</span>
                    <p className="text-[9.5px] text-slate-500 font-medium">{field.desc}</p>
                  </div>
                  <span className={`text-[10.5px] font-bold ${config.text}`}>
                    {config.label}
                  </span>
                </div>
                {/* Visual Bar Indicator */}
                <div className="h-2 w-full bg-slate-800/60 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full rounded-full ${config.color} transition-all duration-300`} 
                    style={{ width: `${config.score}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnostic Visual Card */}
        <div className="lg:col-span-5 bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[220px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/5 rounded-full blur-2xl"></div>
          
          {overallScore >= 60 ? (
            <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 mb-3.5 border border-rose-500/15">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 mb-3.5 border border-emerald-500/15">
              <ShieldCheck className="w-8 h-8" />
            </div>
          )}

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">STATUS DIAGNOSTIK PREVENTIF</h4>
          <h3 className="text-lg font-bold text-white mt-1.5">
            {overallScore >= 60 
              ? 'Waspadai Bahaya Over-stretching' 
              : overallScore >= 35 
                ? 'Harap Lakukan Perbaikan Ringan' 
                : 'Kesehatan Sektor Risiko Prima'}
          </h3>
          
          <p className="text-[11px] text-slate-400 mt-2 max-w-[240px] leading-relaxed font-medium">
            {overallScore >= 60 
              ? 'Tekanan berantai pada pasokan logistik dan penurunan sentimen pembeli memegang bobot keparahan tinggi.' 
              : overallScore >= 35 
                ? 'Harap tingkatkan konversi CRM leads harian Anda dan amankan jadwal retur stok produk kritis.' 
                : 'Pertahankan disiplin operasional harian Anda! Laju omzet stabil.'}
          </p>
        </div>
      </div>
    </div>
  );
};
export default BusinessRiskRadar;
