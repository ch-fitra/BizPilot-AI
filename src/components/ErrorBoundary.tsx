import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { logClientEvent } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public readonly props!: Readonly<Props>;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught unhandled application crash:', error, errorInfo);
    logClientEvent('frontend_error_boundary', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToDashboard = () => {
    window.location.href = '/#/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-screen" className="min-h-screen bg-[#070913] text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
          {/* Neon background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full filter blur-[100px] pointer-events-none" />

          <div className="max-w-md w-full bg-slate-900/60 border border-rose-500/20 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl relative z-10">
            <div className="bg-rose-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 mb-6">
              <AlertOctagon className="h-8 w-8 text-rose-400 animate-pulse" />
            </div>

            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">Sistem Mengalami Kendala</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              BizPilot AI mendeteksi pengecualian runtime yang tidak tertampung. Jangan panik, data dan workspace lokal Anda tersimpan aman.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mt-5 text-left font-mono text-[10.5px] text-rose-300 overflow-x-auto max-h-[120px]">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={this.handleReload}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-4 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Muat Ulang
              </button>
              <button
                onClick={this.handleResetToDashboard}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-3 px-4 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Ke Dashboard
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-6 uppercase font-mono tracking-widest">
              BizPilot AI v0.9.0 • Resilience Mode
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
