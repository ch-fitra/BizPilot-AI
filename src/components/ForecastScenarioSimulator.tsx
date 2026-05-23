import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Calculator, HelpCircle, TrendingUp, Package, Users } from 'lucide-react';
import { ForecastSnapshot, SimulationResult } from '../types/forecast';
import { ForecastService } from '../services/forecastService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface SimulatorProps {
  snapshot: ForecastSnapshot;
  currency: string;
}

export const ForecastScenarioSimulator: React.FC<SimulatorProps> = ({ snapshot, currency = 'IDR' }) => {
  // Input parameters state
  const [expectedDailyGrowth, setExpectedDailyGrowth] = useState<number>(5); // defaults to 5%
  const [stockReorderDelayDays, setStockReorderDelayDays] = useState<number>(2); // defaults to 2 days
  const [leadConversionRate, setLeadConversionRate] = useState<number>(60); // defaults to 60%
  const [promoBoost, setPromoBoost] = useState<number>(20); // defaults to 20%

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto trigger calculation when components load or state variables settle
  const handleSimulate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const results = await ForecastService.simulateScenario({
        snapshot_id: snapshot.id,
        expectedDailyGrowth,
        stockReorderDelayDays,
        leadConversionRate,
        promoBoost
      });
      if (results) {
        setSimulationResults(results);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal menyimulasikan skenario masa depan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [snapshot.id, expectedDailyGrowth, stockReorderDelayDays, leadConversionRate, promoBoost]);

  const formatMoney = (val: number) => {
    return `${currency} ${val.toLocaleString('id-ID')}`;
  };

  const calculateVariancePercent = (simulated: number, original: number) => {
    const change = simulated - original;
    const pct = original > 0 ? (change / original) * 100 : 0;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  // Recharts Helper
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(1)}M`;
    }
    return `${currency} ${(value / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 shadow-xl rounded-lg">
          <p className="text-xs font-mono text-slate-400 mb-1 font-bold">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-indigo-400 font-medium font-mono">
              Omzet Skenario: {formatMoney(payload[0].value)}
            </p>
            {payload[1] && (
              <p className="text-xs text-slate-400 font-medium font-mono">
                Omzet Awal: {formatMoney(payload[1].value)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase">AI Scenario Simulator</h3>
          <p className="text-xs text-slate-400 mt-1">Ubah variable pertumbuhan, masa restock, dan diskon promo untuk melihat dampak simulasinya harian</p>
        </div>
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SLIDERS COLUMN */}
        <div className="lg:col-span-4 space-y-5 bg-slate-950 p-4.5 rounded-xl border border-slate-850">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block mb-1">TUNING KENDALI</span>

          {/* SLIDER 1: expectedDailyGrowth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Laju Pertumbuhan Daily</span>
              <span className="font-mono text-indigo-400 font-bold">+{expectedDailyGrowth}%</span>
            </div>
            <input 
              type="range" 
              min="-10" 
              max="50" 
              step="1"
              value={expectedDailyGrowth}
              onChange={(e) => setExpectedDailyGrowth(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[9px] text-slate-500">Persentase pertumbuhan volume transaksi harian.</p>
          </div>

          {/* SLIDER 2: stockReorderDelayDays */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Hambatan Restock Supplier</span>
              <span className="font-mono text-indigo-400 font-semibold">{stockReorderDelayDays} Hari</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="14" 
              step="1"
              value={stockReorderDelayDays}
              onChange={(e) => setStockReorderDelayDays(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[9px] text-slate-500">Keterlambatan masa kirim logistik penyuplai.</p>
          </div>

          {/* SLIDER 3: leadConversionRate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Laju Konversi Pipeline CRM</span>
              <span className="font-mono text-indigo-400 font-bold">{leadConversionRate}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={leadConversionRate}
              onChange={(e) => setLeadConversionRate(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[9px] text-slate-500">Tingkat closing deals dengan calon pelanggan.</p>
          </div>

          {/* SLIDER 4: promoBoost */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Aggressive Voucher Promo</span>
              <span className="font-mono text-indigo-400 font-bold">+{promoBoost}% Boost</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={promoBoost}
              onChange={(e) => setPromoBoost(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[9px] text-slate-500">Laju daya tarik pembeli akibat insentif promo.</p>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSimulate}
              disabled={isLoading}
              className="w-full justify-center flex items-center py-2 px-3 text-[11px] bg-slate-900 border border-slate-800 text-indigo-200 hover:text-white rounded-lg hover:bg-slate-850 duration-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 flex-none ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Menghitung Skenario...' : 'Kalkulasi Ulang Skenario'}
            </button>
          </div>
        </div>

        {/* RESULTS COMPARISON DISPLAY */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          {simulationResults ? (
            <div className="space-y-5">
              {/* Output mini matrices */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Metric 1 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Hasil Proyeksi Omzet</span>
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <h4 className="text-base font-bold text-white mt-2 leading-none">
                    {formatMoney(simulationResults.projectedRevenue)}
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1">
                    Selisih: {calculateVariancePercent(simulationResults.projectedRevenue, snapshot.projected_revenue)}
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Stok Kritis Skenario</span>
                    <Package className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <h4 className="text-base font-bold text-white mt-2 leading-none">
                    {simulationResults.stockoutRiskCount} <span className="text-[10px] font-normal text-slate-500">Pruduk</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Awal: {snapshot.inventory_forecast.length} produk
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Estimasi CRM Deal</span>
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <h4 className="text-base font-bold text-white mt-2 leading-none">
                    {simulationResults.estimatedConversions} <span className="text-[10px] font-normal text-slate-500">prospek</span>
                  </h4>
                  <p className="text-[10px] text-indigo-400 mt-1 font-mono">
                    Tingkat Konversi: {leadConversionRate}%
                  </p>
                </div>
              </div>

              {/* Dynamic comparative Recharts model */}
              {simulationResults.adjustedSalesForecast && (
                <div className="bg-slate-950/40 border border-slate-855 p-3.5 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Simulasi Perbandingan Grafik</span>
                  
                  <div className="h-44 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={simulationResults.adjustedSalesForecast}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOrig" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#475569" stopOpacity={0.05}/>
                            <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8} tickFormatter={formatYAxis} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                        <Area
                          name="Simulasi Kustom Baru"
                          type="monotone"
                          dataKey="projectedSales"
                          stroke="#818cf8"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSimulated)"
                        />
                        <Area
                          name="Proyeksi Awal Standard"
                          type="monotone"
                          dataKey="baselineSales"
                          stroke="#475569"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#colorOrig)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 bg-slate-950/35 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-500 font-mono animate-pulse">Menghitung model simulasi paralel...</span>
            </div>
          )}
          
          <div className="mt-4 text-[10px] text-slate-500 flex items-center justify-between leading-relaxed">
            <span>Dampak Risiko Keparahan Simulasi: <strong className="text-indigo-450 uppercase">{simulationResults?.actionPriority || 'Low'}</strong></span>
            <span>Umpan balik dihitung secara deterministik dan legal.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ForecastScenarioSimulator;
