import React from 'react';
import { 
  Compass, 
  BarChart3, 
  Package, 
  MessageSquare, 
  CheckSquare, 
  Sparkles, 
  Settings, 
  Building2,
  X,
  History,
  FileText,
  Users,
  Bell,
  TrendingUp,
  Scan,
  Wallet,
  Mic
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  businessName: string;
  businessType: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  businessName,
  businessType
}: SidebarProps) {
  
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Compass, desc: 'Ringkasan performa' },
    { id: 'sales', label: 'Sales Analytics', icon: BarChart3, desc: 'Grafik & tren omzet' },
    { id: 'profit_cashflow', label: 'Profit & Cashflow', icon: Wallet, desc: 'P&L & arus kas bisnis', highlight: false },
    { id: 'forecasting_risk', label: 'Forecasting & Risk AI', icon: TrendingUp, desc: 'Proyeksi & mitigasi risiko', highlight: true },
    { id: 'crm', label: 'CRM & Leads', icon: Users, desc: 'Kelola prospek sales', highlight: true },
    { id: 'notifications_automation', label: 'Notifications & Otomasi', icon: Bell, desc: 'Otomatisasi & WA follow-up', highlight: true },
    { id: 'inventory', label: 'Inventory / Stok', icon: Package, desc: 'Logistik & restock' },
    { id: 'customer', label: 'Customer Insights', icon: MessageSquare, desc: 'Sentiment ulasan' },
    { id: 'ocr_nota', label: 'OCR Nota / Struk', icon: Scan, desc: 'Scan & ekstrak struk', highlight: false },
    { id: 'warung_mode', label: 'Warung Mode', icon: Mic, desc: 'Input transaksi suara', highlight: true },
    { id: 'chat', label: 'AI Business Chat', icon: Sparkles, desc: 'Tanya konsultan Bisnis', highlight: true },
    { id: 'business_memory', label: 'Business Memory', icon: Building2, desc: 'Riwayat memori bisnis', highlight: true },
    { id: 'action_plan', label: 'Action Plan', icon: CheckSquare, desc: 'Rencana aksi harian' },
    { id: 'ai_analyzer', label: 'AI Analyzer', icon: Sparkles, desc: 'Unggah & komputerisasi', highlight: true },
    { id: 'history', label: 'Analysis History', icon: History, desc: 'Riwayat data audit' },
    { id: 'reports', label: 'Reports', icon: FileText, desc: 'Ekspor dokumen audit' },
    { id: 'team', label: 'Team & Access', icon: Users, desc: 'Kelola anggota & peran' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Informasi bisnis' }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:sticky lg:top-16
        w-72 bg-[#090b16] border-r border-slate-900 
        transform transition-transform duration-300 ease-in-out
        flex flex-col justify-between h-screen lg:h-[calc(100vh-4rem)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Upper Sidebar Area: Menu Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto pt-6 px-4 pb-4">
          
          {/* Mobile close trigger and Title branding */}
          <div className="flex items-center justify-between lg:hidden mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span className="font-bold uppercase tracking-tight text-white text-sm">Main Menu</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Biz Stats Preview Badge */}
          <div className="mb-6 p-4 rounded-2xl bg-[#121622]/50 border border-slate-850 text-left">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">PROFIL AKTIF</span>
            <h4 className="font-bold text-xs text-indigo-100 truncate">{businessName}</h4>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono capitalize">{businessType}</span>
          </div>

          {/* Navigation Items menu list */}
          <nav className="space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false); // Close mobile drawer
                  }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all group relative
                    ${isActive 
                      ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 font-semibold' 
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#121622]/30'
                    }
                  `}
                >
                  {/* Glowing active notch indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-550 rounded-r-md shadow-lg shadow-indigo-500/50" />
                  )}

                  <div className={`p-2 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-indigo-600/20 text-indigo-400' 
                      : 'bg-slate-900/60 text-slate-500 group-hover:text-slate-400'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive && item.highlight ? 'animate-pulse' : ''}`} />
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tracking-wide block truncate">{item.label}</span>
                      {item.highlight && (
                        <span className="text-[8px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold px-1.5 py-0.2 rounded-full uppercase scale-90">AI</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal block truncate group-hover:text-slate-400 mt-0.5 transition-colors">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar Area: Status Indicator Block */}
        <div className="p-4 border-t border-slate-900/60 bg-[#060810]/50 text-left">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold block">SISTEM ANALISIS AKTIF</span>
              <span className="text-[9px] text-slate-500 font-mono block">Node 20.x · Gemini 2.0</span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
