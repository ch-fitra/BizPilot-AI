import React from 'react';
import { ShieldCheck, CalendarRange, AlertTriangle } from 'lucide-react';

interface ConfidenceProps {
  level: 'Low' | 'Medium' | 'High';
}

export const ForecastConfidenceBadge: React.FC<ConfidenceProps> = ({ level }) => {
  const getStyleAndIcon = () => {
    switch (level) {
      case 'High':
        return {
          bg: 'bg-emerald-950/25 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'Akurasi Tinggi (High Confidence)',
          desc: 'Didukung data historis transaksi dan logistik yang sangat lengkap.',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
      case 'Medium':
        return {
          bg: 'bg-amber-950/25 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          label: 'Akurasi Sedang (Medium Confidence)',
          desc: 'Didukung basis data awal. Prediksi berada dalam kisaran wajar.',
          icon: <CalendarRange className="w-4 h-4 text-amber-400" />
        };
      case 'Low':
      default:
        return {
          bg: 'bg-rose-950/25 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          label: 'Tingkat Keyakinan Rendah (Low Confidence)',
          desc: 'Informasi bisnis minim. Proyeksi dihitung berbasis benchmark industri umum.',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
        };
    }
  };

  const config = getStyleAndIcon();

  return (
    <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center gap-3 ${config.bg} transition-all`}>
      <div className="flex items-center gap-2 font-semibold">
        {config.icon}
        <span className="text-xs uppercase tracking-wider font-sans font-bold">{config.label}</span>
      </div>
      <div className="h-2 w-px bg-slate-700/60 hidden md:block"></div>
      <p className="text-[11.5px] text-slate-300 md:flex-1 font-medium">{config.desc}</p>
    </div>
  );
};
export default ForecastConfidenceBadge;
