import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Briefcase, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Database,
  RefreshCw,
  HelpCircle,
  FileCheck2,
  ListRestart,
  WifiOff
} from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import SuggestedPromptCard from './SuggestedPromptCard';
import { ChatService } from '../services/chatService';
import { ChatMessage } from '../types/chat';
import { useOnlineStatus } from '../hooks/useOnlineStatus';


interface AIBusinessChatTabProps {
  businessName: string;
  hasProfile: boolean;
  isDemoActive: boolean;
  isEmptyState: boolean;
  businessState: any;
  setActiveTab?: (tab: string) => void;
}

export default function AIBusinessChatTab({
  businessName,
  hasProfile,
  isDemoActive,
  isEmptyState,
  businessState,
  setActiveTab
}: AIBusinessChatTabProps) {
  const isOnline = useOnlineStatus();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Suggested Prompts based on requirements
  const SUGGESTED_PROMPTS = [
    { text: 'Apa notifikasi paling penting hari ini?', cat: '⚠️ Alarms' },
    { text: 'Lead mana yang harus segera saya follow-up?', cat: '👥 CRM' },
    { text: 'Apa risiko operasional terbesar saat ini?', cat: '🚨 Risiko' },
    { text: 'Buatkan pesan WhatsApp untuk pelanggan VIP.', cat: '💬 WhatsApp' },
    { text: 'Apa rekomendasi restock hari ini?', cat: '📦 Logistik' },
    { text: 'Tolong buat skala prioritas kerja untuk besok.', cat: '📋 Rencana' }
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load chat logs on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setErrorMessage(null);
    try {
      const res = await ChatService.getHistory();
      if (res.success) {
        setMessages(res.data);
      } else {
        setErrorMessage(res.error || 'Gagal memuat riwayat.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Safe message submission
  const handleSendMessage = async (rawText: string) => {
    if (!rawText.trim() || isTyping) return;

    if (!isOnline) {
      setErrorMessage('Koneksi internet terputus. AI Business Chat membutuhkan internet aktif untuk menjawab pertanyaan bisnis Anda.');
      return;
    }

    const userMsgText = rawText.trim();

    setInputVal('');
    setErrorMessage(null);

    // Append optimistic user message matching ChatMessage interface
    const tempUserMsg: ChatMessage = {
      id: `temp_u_${Date.now()}`,
      role: 'user',
      content: userMsgText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      // Direct request to backend chat proxy
      const res = await ChatService.sendMessage({
        message: userMsgText,
        include_history: true
      });

      if (res.success) {
        const tempAssistantMsg: ChatMessage = {
          id: `temp_a_${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          context_snapshot: {
            hasProfile: res.sources.hasProfile,
            hasAnalysis: res.sources.hasAnalysis,
            analysisId: res.sources.analysisId
          },
          created_at: res.created_at || new Date().toISOString()
        };
        setMessages((prev) => [...prev, tempAssistantMsg]);
      } else {
        setErrorMessage(res.error || 'Mengalami gangguan komunikasi dengan AI.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Kesalahan pengiriman pesan terdeteksi.');
    } finally {
      setIsTyping(false);
    }
  };

  // Erase permanent chat history
  const handleClearHistory = async () => {
    const confirmClear = window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat obrolan dengan BizPilot AI secara permanen?');
    if (!confirmClear) return;

    setErrorMessage(null);
    const success = await ChatService.clearHistory();
    if (success) {
      setMessages([]);
    } else {
      setErrorMessage('Gagal membersihkan database chat.');
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* Upper Context Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5.5 h-5.5 text-indigo-400 animate-pulse" />
            AI Business memory Co-Pilot
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konsultan bisnis personal Anda yang memahami profil UMKM, logistik, dan histori kinerja finansial ritel Anda secara real-time.
          </p>
        </div>

        {/* Action controls */}
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 border border-rose-950/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-405 text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-rose-300 font-mono"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Riwayat Chat
          </button>
        )}
      </div>

      {/* Grid of memory references and active indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Core Status indicator badge */}
        <div className="md:col-span-3 bg-[#121622]/90 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
              isEmptyState 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
            }`}>
              {isEmptyState ? (
                <AlertTriangle className="w-4.5 h-4.5 animate-pulse" />
              ) : (
                <CheckCircle className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Peringatan Basis Memori AI
              </h4>
              <p className="text-[11.5px] text-slate-400 leading-normal">
                {isEmptyState 
                  ? `Belum melakukan integrasi data. BizPilot menggunakan model UMKM umum untuk "${businessName}". Mulailah mengupload di AI Analyzer.`
                  : `Menjembatani visual dasbor "${businessName}" (${businessState?.health_score || 85}% indeks kesehatan saat ini) ke sistem memori Gemini.`
                }
              </p>
            </div>
          </div>
          {isEmptyState && setActiveTab && (
            <button
              onClick={() => setActiveTab('ai_analyzer')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-505 bg-indigo-500 rounded-xl text-white font-bold text-xs shrink-0 transition"
            >
              Proses Analisis &rarr;
            </button>
          )}
        </div>

        {/* Source reference chips panel */}
        <div className="bg-[#121622]/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-center min-h-[75px]">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-2 text-center md:text-left">
            Kacamata Data Aktif:
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
            <span className={`px-2 py-0.5 text-[10px] rounded-full border ${
              hasProfile 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              Profil Bisnis
            </span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full border ${
              !isEmptyState 
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              Metriks Analisis
            </span>
          </div>
        </div>

      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Help panel / Suggested Prompts Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#121622]/90 border border-slate-850 p-4.5 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <HelpCircle className="w-4 h-4" />
              <h4 className="text-xs font-bold tracking-wider uppercase font-mono">Suggested Questions</h4>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              Ketuk pintasan konsultasi berikut untuk memicu model melakukan crosscheck dengan detail parameter operasional Anda:
            </p>
            
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {SUGGESTED_PROMPTS.slice(0, 5).map((p, idx) => (
                <SuggestedPromptCard 
                  key={idx} 
                  promptText={p.text} 
                  category={p.cat}
                  onClick={handleSendMessage}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Conversational Screen Columns */}
        <div className="lg:col-span-3 flex flex-col min-h-[500px] h-[580px] bg-[#121622]/40 border border-slate-900 rounded-3xl overflow-hidden relative shadow-sm">
          
          {/* Scrollable conversation logs */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4.5">
            {isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs font-mono">Mengakses brankas memori chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto my-auto mt-24">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/15">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-200">Konsultasi Bisnis Siap Dimulai</h3>
                  <p className="text-[11.5px] text-slate-450 leading-relaxed">
                    Ajukan pertanyaan seputar pembukuan, cara menekan error stok, taktik melipatgandakan review bintang 5, atau sisa inventaris Anda. AI bertindak sebagai Penasihat Bisnis bersertifikat.
                  </p>
                </div>
                <div className="w-full h-px bg-slate-800/40 my-2" />
                <p className="text-[10px] text-slate-500 font-mono">
                  Saran yang dihasilkan disesuaikan secara otonom dari lembar berkas profile Anda.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <ChatMessageBubble key={m.id} message={m} />
              ))
            )}

            {isTyping && (
              <div className="p-4 md:p-5 rounded-3xl border bg-[#121622]/85 border-indigo-950/40 mr-auto max-w-[85%] flex gap-4 text-left animate-pulse">
                <div className="w-8.5 h-8.5 rounded-2xl shrink-0 flex items-center justify-center bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white border border-indigo-400/30">
                  <Sparkles className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="flex-1 space-y-2.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider font-mono text-indigo-400">
                    BizPilot AI sedang meninjau data Anda ...
                  </span>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-800 rounded-full w-[90%]" />
                    <div className="h-3 bg-slate-800 rounded-full w-[75%]" />
                    <div className="h-2 bg-slate-800 rounded-full w-[40%]" />
                  </div>
                </div>
              </div>
            )}

            {/* Empty target scroll helper anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Error Notifications inside the log widget */}
          {errorMessage && (
            <div className="mx-4 mb-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-left animate-fadeIn">
              <Info className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-rose-400">Pemberitahuan Sistem BizPilot</p>
                <p className="text-[11px] opacity-90 leading-relaxed">{errorMessage}</p>
                {errorMessage.includes('GEMINI_API_KEY') && (
                  <p className="text-[10.5px] text-slate-450 leading-relaxed mt-1 font-mono">
                    Solusi: Klik menu Settings di pojok kanan atas, pilih "Secrets", lalu tambahkan key <span className="text-indigo-400 font-bold bg-slate-900 px-1 py-0.5 rounded">GEMINI_API_KEY</span>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Persistent user input panel form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }} 
            className="p-3 border-t border-slate-900 bg-[#0f121d] flex gap-2.5 items-center"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={!isOnline ? 'Mode Offline Aktif - Fitur AI Chat membutuhkan koneksi internet...' : (isTyping ? 'Konsultan sedang merangkum arahan...' : 'Tanyakan sesuatu: "Bagaimana cara menaikkan health score?"')}
              disabled={isTyping || isLoadingHistory || !isOnline}
              maxLength={2000}
              className="flex-1 px-4 py-3 bg-[#111421] border border-slate-850 hover:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 text-slate-100 text-[12.5px] transition placeholder:text-slate-500 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping || isLoadingHistory || !isOnline}
              className="w-11 h-11 rounded-2xl bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white flex items-center justify-center shrink-0 transition shadow-md disabled:bg-slate-900 disabled:text-slate-650 disabled:border-slate-950/40 cursor-pointer disabled:cursor-not-allowed"
            >
              {isOnline ? <Send className="w-4.5 h-4.5" /> : <WifiOff className="w-4.5 h-4.5 text-amber-500" />}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
