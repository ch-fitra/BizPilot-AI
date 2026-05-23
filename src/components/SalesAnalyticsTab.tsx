import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  DollarSign, 
  Activity, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { BusinessHealthState } from '../types';

interface SalesAnalyticsTabProps {
  businessState: BusinessHealthState;
}

export default function SalesAnalyticsTab({ businessState }: SalesAnalyticsTabProps) {
  
  // Format currency helper
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getSentimentBg = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (sentiment === 'negative') return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0e1220] border border-slate-800 p-3.5 rounded-xl shadow-xl text-left font-sans text-xs">
          <p className="font-mono text-slate-400 mb-1.5">{payload[0].payload.date}</p>
          <p className="font-semibold text-slate-200">
            Penjualan: <span className="text-indigo-400">{formatRupiah(payload[0].value)}</span>
          </p>
          <p className="text-slate-400 mt-1">
            Transaksi: <span className="font-semibold text-slate-350">{payload[0].payload.transactions} order</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const salesData = businessState.sales_data;
  const topProducts = businessState.top_products;

  if (!salesData || salesData.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-[#121622]/90 border border-slate-800 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-indigo-400 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-200">Data Transaksi Kosong</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Silakan lakukan analisis data pertama Anda di halaman <span className="text-indigo-400 font-semibold cursor-pointer">AI Analyzer</span> dengan mengunggah log atau file penjualan.
        </p>
      </div>
    );
  }

  // Calculate insights
  const sumRevenue = salesData.reduce((acc, point) => acc + point.sales, 0);
  const averageSales = sumRevenue / salesData.length;
  const maxDay = [...salesData].sort((a, b) => b.sales - a.sales)[0];

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Header and Summary Block */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Laporan Analisis Penjualan & Performa Finansial
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Laporan visualisasi interaktif harian yang mengidentifikasi arus perputaran uang dan margin profitabilitas.
        </p>
      </div>

      {/* Grid of Core Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total revenue */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Omset Penjualan</span>
            <span className="text-lg font-black text-slate-200 block mt-0.5">{formatRupiah(sumRevenue)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Akumulasi periode berjalan</span>
          </div>
        </div>

        {/* Average transaction value */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Rata-rata Penjualan</span>
            <span className="text-lg font-black text-slate-200 block mt-0.5">{formatRupiah(averageSales)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Tingkat perputaran harian</span>
          </div>
        </div>

        {/* Highest Peak date */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Rerata Transaksi Tertinggi</span>
            <span className="text-lg font-black text-slate-200 block mt-0.5">{maxDay ? `${formatRupiah(maxDay.sales)}` : '-'}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Tercapai pada {maxDay?.date || '-'}</span>
          </div>
        </div>

      </div>

      {/* Recharts Graphical Chart */}
      <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 relative">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">Visualisasi Trend</span>
          <h3 className="text-md font-semibold text-slate-200">
            Kemiringan Kurva Penjualan Harian
          </h3>
        </div>

        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSalesAnalytics" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorSalesAnalytics)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Revenue Share & Details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Product tables */}
        <div className="lg:col-span-7 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">AUDIT VOLUME BARANG</span>
              <h3 className="text-base font-semibold text-slate-200">
                Peringkat Produk Berdasarkan Kontribusi
              </h3>
            </div>
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 text-left">Nama Produk</th>
                  <th className="pb-3 text-center">Tingkat Penjualan</th>
                  <th className="pb-3 text-right">Momentum Pasar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {topProducts.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/35 transition">
                    <td className="py-3.5 font-semibold text-slate-200">{prod.name}</td>
                    <td className="py-3.5 text-center font-mono font-bold text-slate-300">{prod.sales} Unit sold</td>
                    <td className="py-3.5 text-right">
                      {prod.trend === 'up' ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400">
                          <TrendingUp className="w-3 h-3 mr-1" /> Tinggi / Naik
                        </span>
                      ) : prod.trend === 'down' ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-rose-450">
                          <TrendingDown className="w-3 h-3 mr-1" /> Rendah / Turun
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-slate-500">
                          Konstanta / Flat
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side summary notes */}
        <div className="lg:col-span-5 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">PROYEKSI ANALISTIK AI</span>
            <h3 className="text-sm font-bold text-slate-200">Pernyataan Penilaian Margin</h3>
            
            <ul className="mt-4 space-y-3.5 text-xs text-slate-450 leading-relaxed">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>Bisnis memperlihatkan tren peningkatan sebesar <span className="text-slate-100 font-semibold">14.5%</span> di hari ramai (weekend) dipicu peningkatan penetrasi dine-in.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>Konsentrasi modal tertuju pada esensi menu minuman manis. Margin keuntungan kotor dipertahankan stabil di rentang <span className="text-slate-100 font-semibold">42% - 45%</span>.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] mt-1.5 shrink-0" />
                <span className="text-slate-350">Pengaruh kekosongan logistik (seperti Oat Milk) memicu hilangnya potensi omset sekitar <span className="text-rose-400 font-semibold font-mono">IDR 800k - 1,2jt</span> per minggu.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-850 text-xs text-slate-500 italic">
            * Data diperbarui otomatis setiap kali komputerisasi dokumen baru berhasil dieksekusi oleh co-pilot.
          </div>
        </div>

      </div>

    </div>
  );
}
