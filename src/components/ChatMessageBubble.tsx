import React from 'react';
import { Sparkles, User, Calendar, MessageSquare, ClipboardCheck } from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface ChatMessageBubbleProps {
  key?: any;
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isAssistant = message.role === 'assistant';

  // Format message body into paragraph lists or step groups safely to render clean rich layouts
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    let inList = false;
    let listItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (keyPrefix: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`${keyPrefix}-list`} className="list-disc pl-5 my-2 space-y-1 text-slate-300 text-[12.5px] leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={`${keyPrefix}-li-${idx}`}>
                {renderLineInlineStyles(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check for bullet lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        inList = true;
        listItems.push(trimmed.substring(1).trim());
      } else {
        if (inList) {
          flushList(`f-${index}`);
          inList = false;
        }

        if (trimmed === '') {
          elements.push(<div key={`spacer-${index}`} className="h-2" />);
        } 
        // Render headings or section splitters
        else if (trimmed.startsWith('==') || trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)) {
          const headingText = trimmed.replace(/[#*=`]/g, '').trim();
          elements.push(
            <h5 key={`heading-${index}`} className="font-bold text-indigo-400 mt-4 mb-2 text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {headingText}
            </h5>
          );
        } else {
          elements.push(
            <p key={`p-${index}`} className="text-slate-200 text-[12.5px] leading-relaxed font-sans mb-1.5 break-words">
              {renderLineInlineStyles(trimmed)}
            </p>
          );
        }
      }
    });

    if (inList) {
      flushList(`final`);
    }

    return elements;
  };

  // Helper to parse line for bolding (`**text**`) or code tags (`code`)
  const renderLineInlineStyles = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const pieces = line.split(regex);

    pieces.forEach((piece, index) => {
      if (piece.startsWith('**') && piece.endsWith('**')) {
        const text = piece.slice(2, -2);
        parts.push(<strong key={index} className="font-extrabold text-amber-200">{text}</strong>);
      } else if (piece.startsWith('`') && piece.endsWith('`')) {
        const text = piece.slice(1, -1);
        parts.push(<code key={index} className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono text-[10.5px]">{text}</code>);
      } else {
        parts.push(piece);
      }
    });

    return parts;
  };

  const formattedDate = new Date(message.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`p-4 md:p-5 rounded-3xl border flex gap-4 transition text-left ${
      isAssistant 
        ? 'bg-[#121622]/85 border-indigo-950/40 text-left' 
        : 'bg-[#161f36]/40 border-slate-800/40 ml-auto max-w-[85%] md:max-w-[80%]'
    }`} id={`message-${message.id}`}>
      
      {/* Icon / Avatar */}
      <div className={`w-8.5 h-8.5 rounded-2xl shrink-0 flex items-center justify-center border font-mono ${
        isAssistant 
          ? 'bg-gradient-to-tr from-indigo-700 to-indigo-500 border-indigo-400/30 text-white' 
          : 'bg-slate-800 border-slate-700 text-slate-300'
      }`}>
        {isAssistant ? (
          <Sparkles className="w-4.5 h-4.5 animate-pulse" />
        ) : (
          <User className="w-4.5 h-4.5" />
        )}
      </div>

      {/* Bubble core */}
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-bold tracking-wider uppercase font-mono text-slate-400">
            {isAssistant ? 'BizPilot AI • Consultant' : 'Owner UMKM'}
          </span>
          <span className="text-[9px] font-mono text-slate-550 ml-auto">
            {formattedDate}
          </span>
        </div>

        {/* Message body content */}
        <div className="space-y-1.5 pt-1">
          {renderFormattedContent(message.content)}
        </div>

        {/* Source Snapshots indicators */}
        {isAssistant && message.context_snapshot && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3.5 border-t border-slate-900/40 mt-3 text-[9px] font-mono text-slate-500">
            <span className="uppercase">Sumber Konteks Pasangan:</span>
            {message.context_snapshot.hasProfile && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                PROFIL BISNIS
              </span>
            )}
            {message.context_snapshot.hasAnalysis ? (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                HASIL METRIKS ANALISIS
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
                BELUM ADA ANALISIS (FALLBACK)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
