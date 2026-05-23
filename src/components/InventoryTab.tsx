import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Plus, 
  Minus, 
  TrendingUp, 
  Sparkles,
  Truck
} from 'lucide-react';
import { BusinessHealthState, TopProduct } from '../types';

interface InventoryTabProps {
  businessState: BusinessHealthState;
  onUpdateProducts: (newProducts: TopProduct[]) => void;
}

export default function InventoryTab({ businessState, onUpdateProducts }: InventoryTabProps) {
  
  // We can enrich the inventory with detailed ingredients to make the dashboard look highly realistic
  const [items, setItems] = useState<TopProduct[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize from parent states
  useEffect(() => {
    if (businessState.top_products && businessState.top_products.length > 0) {
      setItems(businessState.top_products);
    }
  }, [businessState.top_products]);

  // Status badges mapping
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'CRITICAL / HABIS', style: 'bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse' };
    if (stock <= 10) return { label: 'PERLU RESTOCK', style: 'bg-amber-500/10 border border-amber-500/30 text-amber-400' };
    return { label: 'STOK OPNAME AMAN', style: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-450' };
  };

  // Restock simulation
  const handleRestockItem = (name: string, quantity: number = 100) => {
    const updated = items.map(item => {
      if (item.name === name) {
        return { ...item, stock: item.stock + quantity };
      }
      return item;
    });
    setItems(updated);
    onUpdateProducts(updated);
    
    setNotification(`Berhasil menyimulasikan restock barang: "${name}". Ditambahkan sebanyak +${quantity} unit.`);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleAdjustStock = (name: string, delta: number) => {
    const updated = items.map(item => {
      if (item.name === name) {
        const nextStock = Math.max(0, item.stock + delta);
        return { ...item, stock: nextStock };
      }
      return item;
    });
    setItems(updated);
    onUpdateProducts(updated);
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Upper Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Package className="w-5.5 h-5.5 text-indigo-400" />
            Sistem Inventarisasi & Manajemen Rantai Pasokan (Supply Chain)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau dan mutasikan persediaan bahan baku secara riil untuk menghindari hambatan produksi atau out-of-stock.
          </p>
        </div>
        
        {/* Helper visual badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono rounded-xl font-semibold">
          <Truck className="w-3.5 h-3.5" /> Direct Supplier Integrated
        </div>
      </div>

      {/* Temporary Success Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-350 text-xs font-sans leading-relaxed flex items-center gap-2.5 shadow-md shadow-emerald-500/5 transition">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Supply Alerts Summary Bento Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Box 1: Critical Items */}
        <div className="p-5 rounded-2xl bg-[#121622]/90 border border-slate-850 flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">BARANG KRITIS / HABIS</span>
            <span className="text-3xl font-black text-slate-100 block mt-2 font-mono">
              {items.filter(i => i.stock === 0).length} <span className="text-sm font-sans font-normal text-slate-400">item</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Segera hubungi supplier darurat terkait untuk mempercepat pengiriman sebelum akhir pekan tiba.
          </p>
        </div>

        {/* Status Box 2: Warning Restock Limit */}
        <div className="p-5 rounded-2xl bg-[#121622]/90 border border-slate-850 flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">BUTUH PEMESANAN (LOW STOCK)</span>
            <span className="text-3xl font-black text-amber-405 block mt-2 font-mono">
              {items.filter(i => i.stock > 0 && i.stock <= 10).length} <span className="text-sm font-sans font-normal text-slate-400">item</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Sisa pasokan menipis dan diperkirakan hanya bertahan untuk mendukung operasional produksi selama 24-48 jam ke depan.
          </p>
        </div>

        {/* Status Box 3: Safe inventory count */}
        <div className="p-5 rounded-2xl bg-[#121622]/90 border border-slate-850 flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">PERSEDIAAN AMAN</span>
            <span className="text-3xl font-black text-emerald-405 mt-2 block font-mono">
              {items.filter(i => i.stock > 10).length} <span className="text-sm font-sans font-normal text-slate-400">item</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Stok opname dikategorikan mencukupi untuk mendukung transaksi omset sepanjang siklus berjalan.
          </p>
        </div>

      </div>

      {/* Main Inventory Controller Table */}
      <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-6">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-bold mb-5 block">
          Daftar Kontrol Kuantitas Persediaan (Stok Gudang)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                <th className="pb-3.5">Nama Produk / Bahan Baku</th>
                <th className="pb-3.5 text-center">Indikator Sisa Pasokan</th>
                <th className="pb-3.5 text-center">Status</th>
                <th className="pb-3.5 text-center">Volume Terjual (7-Hari)</th>
                <th className="pb-3.5 text-right">Aksi Penyesuaian Kuantitas (Demo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {items.map((prod, idx) => {
                const isCritical = prod.stock <= 10;
                const statusDetails = getStockStatus(prod.stock);
                
                return (
                  <tr key={idx} className="hover:bg-slate-900/30 transition group">
                    
                    {/* Item Name column */}
                    <td className="py-4 font-semibold text-slate-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-550" />
                      <span>{prod.name}</span>
                    </td>

                    {/* Quantity Selector adjustments count */}
                    <td className="py-4 text-center font-mono font-bold text-slate-300">
                      <div className="inline-flex items-center gap-2.5 px-2 py-0.5 rounded-lg bg-black/30 border border-slate-850">
                        <button
                          onClick={() => handleAdjustStock(prod.name, -1)}
                          className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition text-slate-500 font-extrabold"
                          title="Kurangi Persediaan -1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="min-w-[40px] text-slate-200">{prod.stock} unit</span>
                        <button
                          onClick={() => handleAdjustStock(prod.name, 1)}
                          className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition text-slate-500 font-extrabold"
                          title="Tambah Persediaan +1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Stock status indicator badge */}
                    <td className="py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg ${statusDetails.style}`}>
                        {statusDetails.label}
                      </span>
                    </td>

                    {/* Total unit sales reference */}
                    <td className="py-4 text-center font-mono text-slate-400">{prod.sales} pcs</td>

                    {/* Simulation restock shortcuts action triggers */}
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleRestockItem(prod.name, isCritical ? 50 : 20)}
                        className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] tracking-wide transition-all ${
                          isCritical
                            ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-slate-700'
                        }`}
                        title="Simulasikan Order Pengiriman Supplier"
                      >
                        <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" style={{ animationDuration: isCritical ? '3s' : '0s' }} />
                        {isCritical ? 'Restock Segera (+50)' : 'Refill (+20)'}
                      </button>
                    </td>

                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500 italic">
                    Belum ada inventory terdaftar. Selesaikan komputerisasi analitik di AI Analyzer first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
