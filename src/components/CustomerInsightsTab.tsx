import React from 'react';
import { 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  TrendingUp,
  Inbox,
  Clock
} from 'lucide-react';
import { BusinessHealthState } from '../types';

interface CustomerInsightsTabProps {
  businessState: BusinessHealthState;
}

export default function CustomerInsightsTab({ businessState }: CustomerInsightsTabProps) {
  
  const reviews = businessState.customer_reviews_summary;

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'negative':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-450 text-rose-400';
      default:
        return 'bg-amber-500/10 border-[#f59e0b]/20 text-amber-400';
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-[#121622]/90 border border-slate-800 flex flex-col items-center justify-center space-y-4">
        <Inbox className="w-12 h-12 text-indigo-400 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-200">Data Review Pelanggan Kosong</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Silakan upload screenshot chat, log WhatsApp, atau ulasan Google Maps di halaman <span className="text-indigo-400 font-semibold cursor-pointer">AI Analyzer</span>.
        </p>
      </div>
    );
  }

  // Calculate sentiment percentages for an elegant visual banner
  const totalComments = reviews.reduce((sum, item) => sum + item.count, 0);
  const positiveCount = reviews.filter(i => i.sentiment === 'positive').reduce((sum, item) => sum + item.count, 0);
  const negativeCount = reviews.filter(i => i.sentiment === 'negative').reduce((sum, item) => sum + item.count, 0);
  const neutralCount = reviews.filter(i => i.sentiment === 'neutral').reduce((sum, item) => sum + item.count, 0);

  const posPct = Math.round((positiveCount / totalComments) * 100) || 0;
  const negPct = Math.round((negativeCount / totalComments) * 100) || 0;
  const neuPct = 100 - posPct - negPct;

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5.5 h-5.5 text-indigo-400" />
          Customer Voice & Sentiment Intelligence Analyzer
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Kecerdasan buatan menyaring ribuan ulasan digital untuk memberikan klasifikasi mood dan ulasan kunci yang objektif.
        </p>
      </div>

      {/* Sentiment Distribution graphic widget */}
      <div className="bg-[#121622]/90 border border-slate-850 rounded-3xl p-6">
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">PROFIL SENTIMENT KONSUMEN</span>
        <h3 className="text-md font-semibold text-slate-200">Indeks Kebahagiaan Pembeli (Customer Happiness Index)</h3>
        
        {/* Progress bar split */}
        <div className="h-6 w-full bg-slate-800 rounded-full mt-5 flex overflow-hidden font-mono text-[10px] text-white font-bold relative">
          {posPct > 0 && (
            <div style={{ width: `${posPct}%` }} className="bg-emerald-500 h-full flex items-center justify-center transition-all" title={`Positif: ${posPct}%`}>
              {posPct >= 15 && `POSITIF ${posPct}%`}
            </div>
          )}
          {neuPct > 0 && (
            <div style={{ width: `${neuPct}%` }} className="bg-amber-500 h-full flex items-center justify-center transition-all" title={`Netral: ${neuPct}%`}>
              {neuPct >= 15 && `NETRAL ${neuPct}%`}
            </div>
          )}
          {negPct > 0 && (
            <div style={{ width: `${negPct}%` }} className="bg-rose-500/90 h-full flex items-center justify-center transition-all" title={`Negatif: ${negPct}%`}>
              {negPct >= 15 && `NEGATIF ${negPct}%`}
            </div>
          )}
        </div>

        {/* Small stats summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center text-xs">
          <div className="flex items-center gap-2 justify-center py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-450 border border-emerald-500/15">
            <ThumbsUp className="w-4 h-4" />
            <span>{positiveCount} review Positif</span>
          </div>
          <div className="flex items-center gap-2 justify-center py-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/15">
            <Clock className="w-4 h-4" />
            <span>{neutralCount} review Netral</span>
          </div>
          <div className="flex items-center gap-2 justify-center py-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/15">
            <ThumbsDown className="w-4 h-4" />
            <span>{negativeCount} review Negatif</span>
          </div>
        </div>
      </div>

      {/* Split Topics Table & AI recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Topics detail (7 columns) */}
        <div className="lg:col-span-7 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
            Topik Pembicaraan yang Sering Diulas
          </h3>
          
          <div className="space-y-5">
            {reviews.map((topic, idx) => (
              <div key={idx} className="space-y-2 border-b border-slate-850 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{topic.topic}</span>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border leading-none ${getSentimentBg(topic.sentiment)}`}>
                      {topic.sentiment.toUpperCase()}
                    </span>
                    <span className="font-mono text-slate-400">{topic.count} review</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 min-w-[36px]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-xs font-mono font-bold text-amber-400">{topic.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden">
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
            ))}
          </div>
        </div>

        {/* AI Action recommendations (5 columns) */}
        <div className="lg:col-span-5 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">AUDIT STRATEGI KONSUMEN</span>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Rekomendasi Respons & Servis AI
            </h3>

            <div className="mt-5 space-y-4 text-xs leading-relaxed text-slate-450">
              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                <span className="font-bold text-indigo-300 block">Penyelesaian Antrian & Waktu Penyajian</span>
                <p>Ulasan negatif terpusat di kecepatan penyajian sore hari. Pisahkan jalur cetak printer tiket kasir langsung ke meja barista agar pesanan online tidak memblokir antrian walk-in langsung.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                <span className="font-bold text-amber-305 block">Edukasi & Standard Operasional Prosedur</span>
                <p>Edukasi Barista untuk memastikan makanan beku seperti croissant dipanaskan dengan panggangan toaster listrik selama minimal 45 detik sebelum penyajian.</p>
              </div>

              {reviews.some(r => r.rating <= 3.5) && (
                <div className="p-3.5 rounded-xl bg-rose-550/5 border border-rose-500/10 text-rose-350 space-y-1">
                  <span className="font-bold text-rose-400 block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Respons Sinyal Keluhan
                  </span>
                  <p>Segera buat program "Kompensasi Keterlambatan" berupa potongan 15% jika pesanan pelanggan memakan waktu melebihi 15 menit.</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic mt-6 pt-4 border-t border-slate-850">
            * Rekomendasi didasarkan pada model log transaksi harian Kopi Selaras.
          </div>
        </div>

      </div>

    </div>
  );
}
