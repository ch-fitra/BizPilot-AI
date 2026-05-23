import React from 'react';
import { PackageX, ShoppingCart, Info } from 'lucide-react';

interface InventoryItem {
  name: string;
  currentStock: number;
  daysToStockout: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedReorder: number;
  suggestedAction: string;
}

interface InventoryForecastProps {
  items: InventoryItem[];
}

export const InventoryStockoutForecast: React.FC<InventoryForecastProps> = ({ items }) => {
  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          bg: 'bg-rose-500/10 border-rose-500/35 text-rose-400',
          text: 'Sangat Kritis ⏳',
          pill: 'bg-rose-500'
        };
      case 'High':
        return {
          bg: 'bg-amber-500/10 border-amber-500/35 text-amber-400',
          text: 'Tinggi',
          pill: 'bg-amber-500'
        };
      case 'Medium':
        return {
          bg: 'bg-blue-500/10 border-blue-500/35 text-blue-400',
          text: 'Sedang',
          pill: 'bg-blue-500'
        };
      case 'Low':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400',
          text: 'Aman',
          pill: 'bg-emerald-500'
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
            <PackageX className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Risiko Kehabisan Pasokan Stok</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Estimasi sisa hari operasional sebelum produk kritis habis berdasarkan laju kecepatan sirkulasi transaksi</p>

        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const styles = getRiskStyles(item.riskLevel);
            // Progress percentage for depletion (lower days = higher filler ratio)
            const fillRatio = Math.max(10, Math.min(100, (14 / Math.max(1, item.daysToStockout)) * 10));

            return (
              <div 
                key={idx} 
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 hover:border-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{item.name}</h4>
                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium">Stok saat ini: <span className="text-slate-200 font-mono font-bold">{item.currentStock} pcs</span></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${styles.bg}`}>
                    {styles.text}
                  </span>
                </div>

                {/* Depletion Progress Gauge */}
                <div className="mt-3">
                  <div className="flex justify-between text-[9.5px] text-slate-500 font-mono font-medium mb-1">
                    <span>STATUS PASOKAN</span>
                    <span className={item.daysToStockout <= 2 ? 'text-rose-400' : 'text-slate-400'}>
                      Diprediksi Habis ± {item.daysToStockout} Hari
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${styles.pill} transition-all duration-500`} 
                      style={{ width: `${fillRatio}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actionable restock cue */}
                <div className="mt-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 flex items-start gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="text-[10.5px] text-slate-300">
                    <span className="font-bold text-slate-200">Rekomendasi Reorder: </span>
                    <span className="font-mono text-indigo-400 font-bold">{item.recommendedReorder} pcs</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.suggestedAction}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center gap-1.5 text-[9.5px] text-slate-500">
        <Info className="w-3 h-3 shrink-0" />
        <span>Sistem otomatis mengirim alur WhatsApp restock ke Supplier jika status sisa &lt; 3 hari.</span>
      </div>
    </div>
  );
};
export default InventoryStockoutForecast;
