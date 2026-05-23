import React from 'react';
import { Award, ShieldAlert, CheckCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface HealthScoreCardProps {
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  trend: 'up' | 'down' | 'flat';
  onReset: () => void;
}

export default function HealthScoreCard({
  score,
  summary,
  strengths,
  risks,
  trend,
  onReset,
}: HealthScoreCardProps) {
  // Determine color theme based on score
  const getScoreColors = (val: number) => {
    if (val >= 80) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', stroke: '#34d399' };
    if (val >= 60) return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', stroke: '#fbbf24' };
    return { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5', stroke: '#f87171' };
  };

  const colors = getScoreColors(score);
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="business-health-panel">
      
      {/* 1. Score Gauge Card (4 columns) */}
      <div className="lg:col-span-4 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-between backdrop-blur-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/10 rounded-full filter blur-[50px] pointer-events-none" />
        
        <div className="w-full flex justify-between items-center mb-4">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block text-left">Skor Kesehatan Bisnis</span>
          <button
            onClick={onReset}
            title="Reset ke Kopi Selaras default"
            className="text-xs text-slate-400 hover:text-indigo-400 transition flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>

        {/* Circular Gauge */}
        <div className="relative my-4 flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Value stroke */}
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${colors.text}`}>
              {score}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
              Nilai Indeks
            </span>
          </div>
        </div>

        {/* Momentum Indicator footer */}
        <div className="w-full bg-[#0a0d16] border border-slate-850 rounded-2xl p-3 mt-4 text-left flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 block">TREN BULANAN</span>
            <span className="text-xs font-semibold text-slate-200 mt-1 block">
              {trend === 'up' ? 'Pertumbuhan Stabil' : trend === 'down' ? 'Penurunan Marjinal' : 'Konsolidasi Pasar'}
            </span>
          </div>
          <div>
            {trend === 'up' ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            ) : trend === 'down' ? (
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <TrendingUp className="w-4 h-4 rotate-45" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. AI Reasoning & Bento Cards (8 columns) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Core Analyst Expert Summary Glass Card */}
        <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 text-left backdrop-blur-xl relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-300 font-sans tracking-wide">
              Ringkasan Analitik BizPilot AI
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {summary}
          </p>
        </div>

        {/* Strengths & Risks Bento Layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Strengths Card */}
          <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-5 text-left backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-850 pb-2.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Kekuatan Operasional
              </span>
            </div>
            
            <ul className="space-y-3">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
              {strengths.length === 0 && (
                <li className="text-xs text-slate-500 italic">Belum mendeteksi kekuatan signifikan.</li>
              )}
            </ul>
          </div>

          {/* Risks / Issues Card */}
          <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-5 text-left backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-850 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Sinyal Risiko Kritis
              </span>
            </div>
            
            <ul className="space-y-3">
              {risks.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
              {risks.length === 0 && (
                <li className="text-xs text-slate-500 italic">Bersih dari risiko operasional terdeteksi.</li>
              )}
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
