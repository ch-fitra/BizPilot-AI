import React, { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthlySeries {
  month: string;
  label: string;
  income: number;
  expense: number;
  net_profit: number;
  analysis_count: number;
}

interface CashflowSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  profit_margin_pct: number;
  months_covered: number;
}

interface ExpenseByCategory {
  category: string;
  amount: number;
}

interface CashflowEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  entry_date: string;
  created_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { value: 'bahan_baku', label: 'Bahan Baku / Stok' },
  { value: 'gaji', label: 'Gaji Karyawan' },
  { value: 'sewa', label: 'Sewa Tempat' },
  { value: 'listrik', label: 'Listrik & Air' },
  { value: 'transport', label: 'Transport & Pengiriman' },
  { value: 'marketing', label: 'Marketing & Promosi' },
  { value: 'peralatan', label: 'Peralatan & Inventaris' },
  { value: 'lainnya', label: 'Lainnya' },
];

const INCOME_CATEGORIES = [
  { value: 'penjualan', label: 'Penjualan Produk' },
  { value: 'jasa', label: 'Pendapatan Jasa' },
  { value: 'investasi', label: 'Investasi / Modal' },
  { value: 'lainnya', label: 'Lainnya' },
];

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#84cc16',
];

const CATEGORY_LABELS: Record<string, string> = {
  bahan_baku: 'Bahan Baku',
  gaji: 'Gaji',
  sewa: 'Sewa',
  listrik: 'Listrik',
  transport: 'Transport',
  marketing: 'Marketing',
  peralatan: 'Peralatan',
  penjualan: 'Penjualan',
  jasa: 'Jasa',
  investasi: 'Investasi',
  lainnya: 'Lainnya',
};

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1322] border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-left min-w-[180px]">
      <p className="text-[11px] font-mono text-slate-400 mb-2 uppercase">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between items-center gap-4 text-xs mb-1">
          <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
          <span className="font-mono font-bold text-slate-200">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfitCashflowTab() {
  const [monthlySeries, setMonthlySeries] = useState<MonthlySeries[]>([]);
  const [summary, setSummary] = useState<CashflowSummary | null>(null);
  const [expenseByCategory, setExpenseByCategory] = useState<ExpenseByCategory[]>([]);
  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMonths, setActiveMonths] = useState(6);

  // New entry form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState('bahan_baku');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  const formatRupiahShort = (num: number) => {
    if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
    if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}Jt`;
    if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`;
    return `Rp ${num}`;
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, entriesRes] = await Promise.all([
        fetch(`/api/cashflow/summary?months=${activeMonths}`),
        fetch('/api/cashflow/expenses?limit=20'),
      ]);

      const summaryData = await summaryRes.json();
      const entriesData = await entriesRes.json();

      if (summaryData.success && summaryData.data) {
        setSummary(summaryData.data.summary);
        setMonthlySeries(summaryData.data.monthly_series);
        setExpenseByCategory(summaryData.data.expense_by_category);
      }
      if (entriesData.success) {
        setEntries(entriesData.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data cashflow.');
    } finally {
      setIsLoading(false);
    }
  }, [activeMonths]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cashflow/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          category: formCategory,
          amount: Number(formAmount),
          description: formDescription,
          entry_date: formDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        setFormAmount('');
        setFormDescription('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowForm(false);
          loadData();
        }, 1500);
      } else {
        setError(data.error || 'Gagal menyimpan entri.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch(`/api/cashflow/expense/${id}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Memuat data cashflow & P&L...</p>
      </div>
    );
  }

  const profitMargin = summary?.profit_margin_pct || 0;
  const isProfit = (summary?.net_profit || 0) >= 0;

  return (
    <div className="space-y-6 text-left animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 mb-1">
            LAPORAN KEUANGAN
          </p>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Profit & Cashflow
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Pantau arus kas masuk, keluar, dan laba bersih bisnis Anda secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={activeMonths}
            onChange={(e) => setActiveMonths(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value={3}>3 Bulan</option>
            <option value={6}>6 Bulan</option>
            <option value={12}>12 Bulan</option>
          </select>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
          >
            <PlusCircle className="w-4 h-4" />
            Input Manual
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-950/30 border border-rose-500/25 text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Manual Entry Form */}
      {showForm && (
        <div className="p-5 rounded-3xl bg-[#121622] border border-indigo-500/25 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Tambah Entri Manual
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitSuccess ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4" />
              Entri berhasil disimpan!
            </div>
          ) : (
            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFormType(t);
                      setFormCategory(t === 'expense' ? 'bahan_baku' : 'penjualan');
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                      formType === t
                        ? t === 'expense'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {t === 'expense' ? '↓ Pengeluaran' : '↑ Pemasukan'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    {(formType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Jumlah (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">Rp</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Beli tepung 5kg dari agen"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formAmount}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Entri'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Pemasukan',
              value: formatRupiah(summary.total_income),
              sub: `${activeMonths} bulan terakhir`,
              icon: ArrowUpRight,
              color: 'emerald',
              trend: 'up',
            },
            {
              label: 'Total Pengeluaran',
              value: formatRupiah(summary.total_expense),
              sub: 'Semua kategori',
              icon: ArrowDownRight,
              color: 'rose',
              trend: 'down',
            },
            {
              label: 'Laba Bersih',
              value: formatRupiah(Math.abs(summary.net_profit)),
              sub: isProfit ? 'Keuntungan bersih' : 'Merugi',
              icon: isProfit ? TrendingUp : TrendingDown,
              color: isProfit ? 'indigo' : 'amber',
              trend: isProfit ? 'up' : 'down',
            },
            {
              label: 'Margin Keuntungan',
              value: `${profitMargin}%`,
              sub: profitMargin >= 20 ? 'Margin sehat ✓' : 'Perlu optimasi',
              icon: Wallet,
              color: profitMargin >= 20 ? 'cyan' : 'amber',
              trend: profitMargin >= 20 ? 'up' : 'down',
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-[#121622]/90 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-${card.color}-500/30 transition-all`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-${card.color}-500/5 rounded-full filter blur-[20px] pointer-events-none`} />
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl bg-${card.color}-500/10 border border-${card.color}-500/20`}>
                  <card.icon className={`w-3.5 h-3.5 text-${card.color}-400`} />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-slate-100 font-mono">{card.value}</p>
                <p className={`text-[10px] text-${card.color}-400 mt-0.5`}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      {monthlySeries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Area Chart: Income vs Expense over months */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-[#121622] border border-slate-850 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Arus Kas Bulanan (Pemasukan vs Pengeluaran)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySeries} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatRupiahShort}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart: Expense by Category */}
          <div className="p-5 rounded-3xl bg-[#121622] border border-slate-850 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              Komposisi Pengeluaran
            </h3>
            {expenseByCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {expenseByCategory.map((_, index) => (
                        <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatRupiah(value),
                        CATEGORY_LABELS[name] || name,
                      ]}
                      contentStyle={{ background: '#0f1322', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {expenseByCategory.slice(0, 4).map((cat, idx) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-[11px] text-slate-400">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 font-semibold">
                        {formatRupiahShort(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-500 text-center">
                Belum ada data pengeluaran.<br />Tambahkan entri manual atau scan nota.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Net Profit Trend Line Chart */}
      {monthlySeries.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#121622] border border-slate-850 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Tren Laba Bersih Bulanan
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlySeries}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={formatRupiahShort}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="net_profit"
                name="Laba Bersih"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#profitGradient)"
                dot={{ fill: '#6366f1', r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-400" />
            Riwayat Entri Terbaru
          </h3>
        </div>

        {entries.length > 0 ? (
          <div className="rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-900">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 px-4 py-2 bg-slate-900/50 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              <span className="col-span-2">Tanggal</span>
              <span className="col-span-3">Kategori</span>
              <span className="col-span-4">Keterangan</span>
              <span className="col-span-2 text-right">Jumlah</span>
              <span className="col-span-1 text-right">Aksi</span>
            </div>

            {entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 px-4 py-3 hover:bg-slate-900/30 transition items-center gap-1"
              >
                <span className="col-span-2 text-[11px] text-slate-500 font-mono">
                  {new Date(entry.entry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </span>
                <div className="col-span-3 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      entry.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-[11px] text-slate-400 capitalize truncate">
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                </div>
                <span className="col-span-4 text-[11px] text-slate-300 truncate">
                  {entry.description || '—'}
                </span>
                <span
                  className={`col-span-2 text-xs font-bold font-mono text-right ${
                    entry.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {entry.type === 'income' ? '+' : '-'}{formatRupiah(entry.amount)}
                </span>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Hapus entri"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
            <Wallet className="w-8 h-8 text-slate-600 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-400">Belum ada entri manual</p>
              <p className="text-xs text-slate-600 mt-1">
                Klik "Input Manual" untuk menambahkan pemasukan atau pengeluaran, atau gunakan fitur OCR Nota untuk scan struk belanja.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline transition"
            >
              + Tambah Entri Pertama
            </button>
          </div>
        )}
      </div>

      {/* Info: Data from analysis */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/15 flex items-start gap-3">
        <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Catatan:</strong> Data "Pemasukan" di grafik ini dihitung dari total omzet yang tersimpan di Riwayat Analisis AI. 
          Tambahkan entri manual untuk mencatat pengeluaran operasional harian agar laporan P&L semakin akurat.
        </p>
      </div>

    </div>
  );
}
