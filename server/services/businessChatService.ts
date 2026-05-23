import { GoogleGenAI } from '@google/genai';
import { BusinessContextBuilder } from './businessContextBuilder';
import { ChatHistoryRepository, ChatMessageRecord } from '../repositories/chatHistoryRepository';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Silakan daftarkan kunci API Anda di menu Settings / secrets panel.');
  }

  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return aiClient;
}

export class BusinessChatService {
  /**
   * Process a message through the custom guardrailed UMKM consulting engine.
   */
  static async processChat(params: {
    message: string;
    business_id?: string | null;
    analysis_id?: string | null;
    include_history?: boolean;
  }): Promise<{
    reply: string;
    sources: {
      hasProfile: boolean;
      hasAnalysis: boolean;
      analysisDate: string | null;
      analysisId: string | null;
    };
    suggested_next_questions: string[];
    created_at: string;
  }> {
    const { message, business_id, analysis_id, include_history = true } = params;

    // 1. Build the granular source business context
    const context = await BusinessContextBuilder.buildContext(business_id, analysis_id, include_history);

    // 2. Draft the strict system instructions / persona guardrails
    const systemInstruction = `Anda adalah BizPilot AI, seorang konsultan bisnis digital elite, COO, dan penasihat praktis untuk pelaku usaha mikro, kecil, dan menengah (UMKM) di Indonesia.

=== MANDAT & BATASAN KERJA UTAMA ===
1. JAWAB HANYA berdasarkan data konkret yang tersedia di dalam === PROFIL BISNIS === dan === DATA KESEHATAN DAN KINERJA BISNIS === di bawah.
2. JANGAN PERNAH mengarang angka omzet, penjualan, stok barang, jumlah transaksi, rating ulasan, ataupun feedback pelanggan yang tidak ada di dalam teks context.
3. Jika data/informasi yang ditanyakan user tidak tersedia di context, jelaskan dengan jujur dan sopan: "Data tersebut belum tersedia di BizPilot. Silakan jalankan AI Analyzer atau lengkapi Business Profile terlebih dahulu."
4. Berikan jawaban yang fungsional, taktis, praktis, beralur jelas, menggunakan bahasa yang mudah dicermati pelaku UMKM (hindari jargon finansial korporasi berat yang tidak perlu/jelaskan bila dipakai).
5. Jangan menyebutkan bahwa Anda memiliki akses langsung ke server database atau file sistem backend jika data tidak tertulis di context yang disiapkan.
6. Hindari klaim finansial palsu atau kepastian sukses untung yang berlebihan. Fokus pada aksi nyata (actionable operations).

=== STRUKTUR FORMAT JAWABAN (WAJIB RAPI) ===
Setiap respon Anda idealnya disusun rapi dengan poin-poin sebagai berikut:
- **Ringkasan Singkat Masalah/Analisis** (Beri insight tajam max 3 kalimat).
- **Prioritas Utama** (Prioritas mutlak yang melatarbelakangi situasi saat ini).
- **Rencana Tindakan Operasional (Langkah Aksi Nyata)**:
  * **Langkah 24 Jam**: Apa tindakan konkret yang wajib dikerjakan BESOK pagi?
  * **Langkah 7 Hari**: Strategi rintisan cepat dalam minggu ini.
  * **Langkah 30 Hari**: Agenda pengamanan operasional bulanan.
- **Data yang Digunakan** (Ringkas variabel data atau indikasi dari profile/analisis mana yang Anda pakai untuk merumuskan saran ini).
- **Rekomendasi Pertanyaan Lanjutan** (Tawarkan 2-3 pertanyaan logis berikutnya yang relevan untuk memperdalam pemahaman mereka).

=== CONTEXT DATA BISNIS USER ===
${context.compiledContextText}

=== MEMORI/RIWAYAT CHAT SEBELUMNYA ===
${context.historySummary}
`;

    // 3. Save User message to persistent history
    await ChatHistoryRepository.addMessage({
      business_id: business_id || (context.profile?.id) || null,
      analysis_id: analysis_id || (context.analysis?.analysis_id) || null,
      role: 'user',
      content: message,
      context_snapshot: {
        hasProfile: context.sourceIndicator.hasProfile,
        hasAnalysis: context.sourceIndicator.hasAnalysis,
        analysisId: context.sourceIndicator.analysisId
      }
    });

    let aiReply = '';
    try {
      const ai = getAiClient();
      
      // Request generation using the standard gemini-3.5-flash model
      const modelName = 'gemini-3.5-flash';
      const aiResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `Pertanyaan Owner UMKM: ${message}\n\nBerikan arahan Anda sebagai BizPilot AI:` }]
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.25, // Lower temperature to improve guardrail adherence and lower hallucinations
        }
      });

      aiReply = aiResponse.text || 'Gagal memformulasikan balasan dari model Gemini.';
    } catch (err: any) {
      console.error('BusinessChatService: Error generating content from Gemini API:', err);
      aiReply = `⚠️ Sistem BizPilot AI mengalami gangguan saat menghubungi konsultan: ${err.message || err}. Harap pastikan kunci API Anda sudah terkonfigurasi dengan benar di panel pengaturan rahasia Google AI Studio.`;
    }

    // 4. Save AI message to persistent history
    const aiRecord = await ChatHistoryRepository.addMessage({
      business_id: business_id || (context.profile?.id) || null,
      analysis_id: analysis_id || (context.analysis?.analysis_id) || null,
      role: 'assistant',
      content: aiReply,
      context_snapshot: {
        hasProfile: context.sourceIndicator.hasProfile,
        hasAnalysis: context.sourceIndicator.hasAnalysis,
        analysisId: context.sourceIndicator.analysisId
      }
    });

    // Extract suggested next questions dynamically using a fallback list
    const suggested_next_questions = this.parseSuggestedQuestions(aiReply);

    return {
      reply: aiReply,
      sources: context.sourceIndicator,
      suggested_next_questions,
      created_at: aiRecord.created_at
    };
  }

  // Helper inside AI service to pull out or formulate custom prompts
  private static parseSuggestedQuestions(text: string): string[] {
    const defaultPrompts = [
      'Bagaimana cara menaikkan health score bisnis saya?',
      'Apa rekomendasi untuk stok inventory hari ini?',
      'Tolong buat skala prioritas operasional besok pagi.'
    ];

    try {
      // Look for lines that look like questions in the latter half of the text
      const lines = text.split('\n').slice(-15);
      const questions: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.endsWith('?') && (trimmed.startsWith('-') || trimmed.match(/^\d/))) {
          // clean it up
          const cleaned = trimmed.replace(/^[-*\d.\s]+/, '').trim();
          if (cleaned.length > 10 && cleaned.length < 120 && !questions.includes(cleaned)) {
            questions.push(cleaned);
          }
        }
      }
      if (questions.length >= 2) {
        return questions.slice(0, 3);
      }
    } catch {
      // Ignore parsing errors
    }

    return defaultPrompts;
  }
}
