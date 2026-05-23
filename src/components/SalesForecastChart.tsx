import React from 'react';
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

interface SalesChartProps {
  data: {
    date: string;
    projectedSales: number;
    baselineSales: number;
  }[];
  currency: string;
}

export const SalesForecastChart: React.FC<SalesChartProps> = ({ data, currency = 'IDR' }) => {
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${currency} ${(value / 1000).toFixed(0)}K`;
    }
    return `${currency} ${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-mono text-slate-400 mb-1.5 font-bold uppercase tracking-wider">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-indigo-400 font-medium">
              Proyeksi AI: <span className="font-bold">{currency} {payload[0].value.toLocaleString('id-ID')}</span>
            </p>
            {payload[1] && (
              <p className="text-xs text-slate-400 font-medium">
                Baseline Organik: <span className="font-bold">{currency} {payload[1].value.toLocaleString('id-ID')}</span>
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
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Tren Proyeksi Omzet Penjualan</h3>
        <p className="text-xs text-slate-400 mt-1">Interseksi perbandingan lintasan model prediksi cerdas versus baseline penjualan rata-rata historis</p>
      </div>

      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#475569" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingBottom: '10px' }}
            />
            <Area
              name="Proyeksi AI BizPilot"
              type="monotone"
              dataKey="projectedSales"
              stroke="#818cf8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorProjected)"
            />
            <Area
              name="Baseline Historis Organik"
              type="monotone"
              dataKey="baselineSales"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorBaseline)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default SalesForecastChart;
