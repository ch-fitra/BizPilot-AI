import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ShoppingBag, AlertTriangle, TrendingUp, TrendingDown, Star, MessageSquare } from 'lucide-react';
import { TopProduct, ReviewSummary, SalesDataPoint } from '../types';

interface DashboardChartsProps {
  salesData: SalesDataPoint[];
  topProducts: TopProduct[];
  reviewsSummary: ReviewSummary[];
  alerts: string[];
}

export default function DashboardCharts({
  salesData,
  topProducts,
  reviewsSummary,
  alerts,
}: DashboardChartsProps) {
  
  // Rupiah Currency Formatter helper
  const formatRupiah = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getSentimentBg = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (sentiment === 'negative') return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    return 'bg-amber-500/10 border-amber-500/20 text-amber-450 text-amber-400';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0e1220] border border-slate-800 p-3.5 rounded-xl shadow-xl text-left font-sans">
          <p className="text-xs font-mono text-slate-400 mb-1.5">{payload[0].payload.date}</p>
          <p className="text-xs font-semibold text-slate-200">
            Penjualan: <span className="text-indigo-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(payload[0].value)}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Transaksi: <span className="font-semibold text-slate-300">{payload[0].payload.transactions} order</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="dashboard-graphics-panel">
      
      {/* 1. Main Sales Trend Chart (7 Columns) */}
      <div className="xl:col-span-8 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 text-left backdrop-blur-xl relative flex flex-col justify-between">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Evolusi Arus Transaksi</span>
          <h3 className="text-lg font-semibold text-slate-200 font-sans tracking-wide">
            Grafik Penjualan & Kunjungan Pelanggan
          </h3>
        </div>

        {/* Recharts Area Container */}
        <div className="h-72 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                tickFormatter={(tick) => formatRupiah(tick)}
                style={{ fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#818cf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mini totals indicator footer */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4 mt-4">
          <div>
            <span className="text-[10px] font-mono text-slate-500">PROYEKSI PENDAPATAN BULANAN</span>
            <span className="text-base font-extrabold text-slate-200 mt-1 block">
              {formatRupiah(salesData.reduce((acc, point) => acc + point.sales, 0) * 4.2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500">RATA-RATA TRANSAKSI HARIAN</span>
            <span className="text-base font-extrabold text-slate-200 mt-1 block">
              {Math.round(salesData.reduce((acc, point) => acc + point.transactions, 0) / salesData.length)} order / hari
            </span>
          </div>
        </div>
      </div>

      {/* 2. Side Panel Alerts & Sentiment Feed (4 Columns) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Glowing Alerts Box */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 text-left backdrop-blur-xl flex-grow flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">NOTIFIKASI ANOMALI</span>
            <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-wide">
              Kotak Peringatan Logistik & Operasional
            </h4>
          </div>

          <div className="space-y-3.5 my-5 flex-grow">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-[#0a0d16] border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{alert}</span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="bg-[#0a0d16] border border-slate-800 text-slate-400 text-center rounded-xl py-8 text-xs italic">
                Semua sistem logistik dan fasilitas berfungsi normal aman.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top Products Table (6 Columns) */}
      <div className="xl:col-span-6 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 text-left backdrop-blur-xl relative">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">PRODUK TERHITS</span>
            <h3 className="text-base font-semibold text-slate-200 font-sans tracking-wide">
              Perputaran Stok & Tren Penjualan
            </h3>
          </div>
          <ShoppingBag className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Nama Produk</th>
                <th className="pb-3 text-center font-semibold">Prioritas Stok</th>
                <th className="pb-3 text-right font-semibold">Total Terjual</th>
                <th className="pb-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {topProducts.map((prod, idx) => {
                const isCriticalStock = prod.stock <= 10;
                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 text-xs font-semibold text-slate-200">{prod.name}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-semibold ${
                        isCriticalStock 
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse' 
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}>
                        {isCriticalStock && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        {prod.stock} unit
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs font-mono text-slate-350 font-semibold">{prod.sales} pcs</td>
                    <td className="py-3 text-right">
                      {prod.trend === 'up' ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 font-sans">
                          <TrendingUp className="w-3 h-3 mr-1" /> Naik
                        </span>
                      ) : prod.trend === 'down' ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-rose-400 font-sans">
                          <TrendingDown className="w-3 h-3 mr-1" /> Turun
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 font-sans">
                          Flat
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-500 italic">Belum ada data barang terdeteksi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Customer Review Topic summary heat lists (6 Columns) */}
      <div className="xl:col-span-6 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 text-left backdrop-blur-xl relative flex flex-col justify-between">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">SUARA KONSUMEN</span>
            <h3 className="text-base font-semibold text-slate-200 font-sans tracking-wide">
              Topik Ulasan & Kepuasan Pelanggan
            </h3>
          </div>
          <MessageSquare className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="space-y-4">
          {reviewsSummary.map((topic, idx) => {
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{topic.topic}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide border ${getSentimentBg(topic.sentiment)}`}>
                      {topic.sentiment.toUpperCase()}
                    </span>
                    <span className="font-mono text-slate-400">{topic.count} review</span>
                  </div>
                </div>

                {/* Stars and Progress grid row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 flex items-center shrink-0 gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-xs font-mono font-semibold text-amber-400">{topic.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      style={{ width: `${(topic.rating / 5) * 100}%` }}
                      className={`h-full rounded-full ${
                        topic.rating >= 4.5 
                          ? 'bg-emerald-500' 
                          : topic.rating >= 3.5 
                            ? 'bg-indigo-400' 
                            : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {reviewsSummary.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 italic pb-0">Belum ada topik opini terdeteksi.</div>
          )}
        </div>
      </div>

    </div>
  );
}
