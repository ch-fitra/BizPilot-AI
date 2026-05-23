import React from 'react';
import { Coins, ShoppingBag, ShieldAlert, BadgeInfo } from 'lucide-react';
import { ForecastSnapshot } from '../types/forecast';

interface CardsProps {
  snapshot: ForecastSnapshot;
  currency: string;
}

export const ForecastOverviewCards: React.FC<CardsProps> = ({ snapshot, currency = 'IDR' }) => {
  const formatMoney = (val: number) => {
    return `${currency} ${val.toLocaleString('id-ID')}`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
      case 'High':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'Medium':
        return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      default:
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    }
  };

  // Safe division for daily average
  const getDaysNumber = (range: string) => (range === '7d' ? 7 : range === '14d' ? 14 : 30);
  const days = getDaysNumber(snapshot.forecast_range);
  const dailyAvgSales = Math.round(snapshot.projected_revenue / days);
  const dailyAvgTrans = (snapshot.projected_transactions / days).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: EXPECPTED REVENUE */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Proyeksi Omzet ({snapshot.forecast_range})</span>
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
            {formatMoney(snapshot.projected_revenue)}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Rata-rata harian: <span className="text-slate-200">{formatMoney(dailyAvgSales)}</span>
          </p>
        </div>
      </div>

      {/* CARD 2: EXPECTED TRANSACTIONS */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Proyeksi Transaksi</span>
          <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
            {snapshot.projected_transactions} <span className="text-xs font-medium text-slate-400">order</span>
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Rata-rata harian: <span className="text-slate-200">{dailyAvgTrans} transaksi</span>
          </p>
        </div>
      </div>

      {/* CARD 3: COMBINED THREAT RATING */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Level Ancaman Bisnis</span>
          <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
              {snapshot.risk_level === 'Critical' ? 'Kritis 🚨' : snapshot.risk_level === 'High' ? 'Tinggi ⚠' : snapshot.risk_level === 'Medium' ? 'Sedang' : 'Rendah'}
            </h3>
          </div>
          <p className="text-xs mt-2">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(snapshot.risk_level)}`}>
              SKOR RISIKO: {snapshot.risk_level === 'Critical' ? 'RISK HIGHLY ACTIVE' : 'MONITORED'}
            </span>
          </p>
        </div>
      </div>

      {/* CARD 4: ADAPTIVE PRIORITY MITIGATION */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rekomendasi Utama AI</span>
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
            <BadgeInfo className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-300 font-medium line-clamp-2 italic leading-relaxed">
            "{snapshot.ai_recommendations.shortTerm[0] || 'Pertahankan laju transaksi dan tingkatkan pengawasan pasokan di gudang.'}"
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">MITIGASI DARURAT 24 JAM</p>
        </div>
      </div>
    </div>
  );
};
export default ForecastOverviewCards;
