import React from 'react';
import { Compass, Menu, Sparkles, RefreshCw, Server, AlertCircle, Building2 } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  businessName: string;
  location: string;
  onResetDemo: () => void;
  isBackendHealthy: boolean;
}

export default function Topbar({
  sidebarOpen,
  setSidebarOpen,
  businessName,
  location,
  onResetDemo,
  isBackendHealthy
}: TopbarProps) {
  
  return (
    <header className="border-b border-slate-900 bg-[#070913]/95 backdrop-blur-md sticky top-0 z-45">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        
        {/* Left Brand Area & Hamburger trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 text-slate-300 lg:hidden transition"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Group */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[1px] flex items-center justify-center shadow-md">
              <div className="w-full h-full rounded-xl bg-[#0a0d16] flex items-center justify-center">
                <Compass className="w-4.5 h-4.5 text-indigo-400" />
              </div>
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-sans font-black tracking-tight text-sm text-slate-100 uppercase">
                  BizPilot<span className="text-indigo-400">.AI</span>
                </span>
                <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold uppercase">
                  v1.2
                </span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
                Intelligent Operating Partner
              </span>
            </div>
          </div>
        </div>

        {/* Right Info Badges & Shortcuts */}
        <div className="flex items-center gap-4">
          
          {/* Workspace Switcher Component */}
          <WorkspaceSwitcher />

          {/* Location Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 leading-none text-left">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
            <div>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">LOKASI</span>
              <span className="text-xs font-semibold text-slate-300 block">{location}</span>
            </div>
          </div>

          {/* Safe Backend Connection state */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border leading-none text-left text-[11px] font-mono font-medium ${
            isBackendHealthy 
              ? 'bg-emerald-900/15 border-emerald-500/20 text-emerald-450' 
              : 'bg-rose-900/15 border-rose-500/20 text-rose-405'
          }`}>
            <Server className={`w-3.5 h-3.5 ${isBackendHealthy ? 'text-emerald-400' : 'text-rose-450'}`} />
            <span className="hidden xs:inline">
              {isBackendHealthy ? 'GEMINI CONNECTED' : 'GEMINI OFFLINE'}
            </span>
          </div>

          {/* Quick Demo Reload Trigger */}
          <button
            onClick={onResetDemo}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-indigo-400 text-slate-400 transition"
            title="Reset Contoh Demo Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
