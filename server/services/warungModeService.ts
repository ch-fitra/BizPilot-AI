import { GoogleGenAI, Type } from '@google/genai';
import { runSupabaseQuery } from '../db/supabaseClient';

type MatchStatus = 'exact' | 'fuzzy' | 'new_item' | 'unknown';

export interface ParsedVoiceItem {
  name: string;
  qty: number | null;
  unit_price: number | null;
  subtotal: number | null;
  confidence: number;
  matched_product_id: string | null;
  match_status: MatchStatus;
}

function sanitizeText(input: unknown, max = 500): string {
  return String(input || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeName(name: string): string {
  return sanitizeText(name, 120).toLowerCase();
}

function normalizePositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function buildSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, enum: ['ok', 'partial', 'failed'] },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            qty: { type: Type.NUMBER, nullable: true },
            unit_price: { type: Type.NUMBER, nullable: true },
            subtotal: { type: Type.NUMBER, nullable: true },
            confidence: { type: Type.NUMBER },
          },
          required: ['name', 'qty', 'unit_price', 'subtotal', 'confidence'],
        },
      },
      warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['status', 'items', 'warnings'],
  };
}

function buildPrompt(transcript: string) {
  return [
    'Anda parser transaksi warung Bahasa Indonesia.',
    'Kembalikan JSON valid saja. Jangan markdown. Jangan penjelasan.',
    'Tugas hanya parsing transcript menjadi item transaksi.',
    'Jangan mengarang harga jika tidak disebut.',
    'Jika qty tidak jelas: qty=null dan tambahkan warning.',
    'Jika transcript bukan transaksi: status="failed".',
    'Dukung kata informal: jual, laku, tambah, sama, bungkus, botol, pcs, biji, dua, tiga, empat, lima.',
    `Transcript: ${transcript}`,
  ].join('\n');
}

async function aiParseTranscript(transcript: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('GEMINI_API_KEY tidak tersedia.'), { status: 503 });
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: { parts: [{ text: buildPrompt(transcript) }] },
    config: { responseMimeType: 'application/json', responseSchema: buildSchema(), temperature: 0 },
  });
  return JSON.parse(String(response.text || '{}').trim());
}

async function loadKnownItemNames(businessId: string): Promise<string[]> {
  const scans = await runSupabaseQuery<any[]>('warung_mode.nota_scans.items', (supabase) =>
    supabase.from('nota_scans').select('items').eq('business_id', businessId).order('scan_date', { ascending: false }).limit(100)
  );
  const names = new Set<string>();
  for (const scan of scans || []) {
    const items = Array.isArray(scan.items) ? scan.items : [];
    for (const item of items) {
      const name = sanitizeText(item?.name, 120);
      if (name) names.add(name);
    }
  }
  return [...names];
}

export class WarungModeService {
  static async parseVoiceTranscript(businessId: string, transcriptRaw: string) {
    const transcript = sanitizeText(transcriptRaw, 500);
    if (!transcript) throw Object.assign(new Error('Transcript kosong.'), { status: 400 });
    if (transcript.length > 500) throw Object.assign(new Error('Transcript terlalu panjang.'), { status: 400 });

    const parsed = await aiParseTranscript(transcript);
    const knownNames = await loadKnownItemNames(businessId);
    const warnings = new Set<string>(Array.isArray(parsed?.warnings) ? parsed.warnings.map((w: any) => sanitizeText(w, 120)) : []);
    const status = parsed?.status === 'ok' || parsed?.status === 'partial' || parsed?.status === 'failed' ? parsed.status : 'partial';

    const items: ParsedVoiceItem[] = (Array.isArray(parsed?.items) ? parsed.items : []).map((item: any) => {
      const name = sanitizeText(item?.name, 120);
      const qty = normalizePositiveNumber(item?.qty);
      const unitPrice = normalizePositiveNumber(item?.unit_price);
      const subtotal = normalizePositiveNumber(item?.subtotal);
      if (qty !== null && qty <= 0) warnings.add(`qty_tidak_valid:${name}`);
      if (unitPrice !== null && unitPrice < 0) warnings.add(`harga_tidak_valid:${name}`);
      if (qty === null) warnings.add(`qty_tidak_jelas:${name}`);

      let matchStatus: MatchStatus = 'new_item';
      let matchedName: string | null = null;
      const normalized = normalizeName(name);
      for (const known of knownNames) {
        if (normalizeName(known) === normalized) {
          matchStatus = 'exact';
          matchedName = known;
          break;
        }
      }
      if (!matchedName && knownNames.length > 0 && normalized) {
        let best: { name: string; score: number } | null = null;
        for (const known of knownNames) {
          const score = levenshtein(normalized, normalizeName(known));
          if (!best || score < best.score) best = { name: known, score };
        }
        if (best && best.score <= 2) {
          matchStatus = 'fuzzy';
          matchedName = best.name;
        }
      }
      if (!name) matchStatus = 'unknown';

      return {
        name: name || 'Item Tidak Dikenal',
        qty: qty !== null && qty > 0 ? qty : null,
        unit_price: unitPrice !== null && unitPrice >= 0 ? unitPrice : null,
        subtotal: subtotal !== null && subtotal >= 0 ? subtotal : null,
        confidence: Math.max(0, Math.min(1, Number(item?.confidence ?? 0.7))),
        matched_product_id: null,
        match_status: matchStatus,
      };
    });

    return { status, items, warnings: [...warnings].filter(Boolean) };
  }

  static async saveTransaction(params: {
    businessId: string;
    transcript: string;
    items: ParsedVoiceItem[];
    validationStatus: 'ok' | 'partial' | 'failed';
    idempotencyKey?: string;
  }) {
    const transcript = sanitizeText(params.transcript, 1000);
    const items = (Array.isArray(params.items) ? params.items : []).map((item) => ({
      name: sanitizeText(item.name, 120),
      qty: item.qty,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      confidence: Math.max(0, Math.min(1, Number(item.confidence || 0))),
      matched_product_id: item.matched_product_id || null,
      match_status: item.match_status,
    }));
    const total = items.reduce((sum, i) => sum + Number(i.subtotal || (i.qty && i.unit_price ? i.qty * i.unit_price : 0)), 0);

    return runSupabaseQuery<any>('warung_mode.voice_transactions.insert', (supabase) =>
      supabase.from('voice_transactions').insert({
        business_id: params.businessId,
        source: 'warung_mode',
        transcript,
        items,
        total: Number.isFinite(total) ? total : null,
        validation_status: params.validationStatus,
        idempotency_key: params.idempotencyKey || null,
      }).select('*').single()
    );
  }
}
