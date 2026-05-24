import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { runSupabaseQuery } from '../db/supabaseClient';

type ExtractionStatus = 'ok' | 'partial' | 'unreadable';

export interface OCRExtractedItem {
  name: string;
  qty: number | null;
  unit_price: number | null;
  subtotal: number | null;
  category_hint: string | null;
}

export interface OCRExtractionPayload {
  status: ExtractionStatus;
  merchant_name: string | null;
  transaction_date: string | null;
  transaction_time: string | null;
  currency: 'IDR' | null;
  payment_method: string | null;
  items: OCRExtractedItem[];
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  service_charge: number | null;
  total: number | null;
  confidence: number;
  warnings: string[];
}

export interface OCRExtractionResult {
  extraction: OCRExtractionPayload;
  imageHash: string;
  duplicateScanId: string | null;
  validationStatus: 'valid' | 'partial' | 'invalid';
  criticalInvalid: boolean;
}

const OCR_EXTRACTION_VERSION = 'v3-strict-ocr-2026-05-24';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ACCEPTABLE_TOTAL = 1_000_000_000;
const MAX_ACCEPTABLE_ITEM_PRICE = 500_000_000;
const MATH_TOLERANCE = 1;

const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']);

function sanitizeText(value: unknown, maxLen = 200): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

function normalizeTime(value: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) return raw.length === 5 ? `${raw}:00` : raw;
  return null;
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function buildSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, enum: ['ok', 'partial', 'unreadable'] },
      merchant_name: { type: Type.STRING, nullable: true },
      transaction_date: { type: Type.STRING, nullable: true },
      transaction_time: { type: Type.STRING, nullable: true },
      currency: { type: Type.STRING, enum: ['IDR'], nullable: true },
      payment_method: { type: Type.STRING, nullable: true },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            qty: { type: Type.NUMBER, nullable: true },
            unit_price: { type: Type.NUMBER, nullable: true },
            subtotal: { type: Type.NUMBER, nullable: true },
            category_hint: { type: Type.STRING, nullable: true },
          },
          required: ['name', 'qty', 'unit_price', 'subtotal', 'category_hint'],
        },
      },
      subtotal: { type: Type.NUMBER, nullable: true },
      discount: { type: Type.NUMBER, nullable: true },
      tax: { type: Type.NUMBER, nullable: true },
      service_charge: { type: Type.NUMBER, nullable: true },
      total: { type: Type.NUMBER, nullable: true },
      confidence: { type: Type.NUMBER },
      warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'status',
      'merchant_name',
      'transaction_date',
      'transaction_time',
      'currency',
      'payment_method',
      'items',
      'subtotal',
      'discount',
      'tax',
      'service_charge',
      'total',
      'confidence',
      'warnings',
    ],
  };
}

function buildPrompt() {
  return [
    'Anda adalah mesin OCR struk yang ketat.',
    'Tugas Anda HANYA mengekstrak data yang terlihat dari gambar nota.',
    'Aturan mutlak:',
    '- Kembalikan JSON valid saja.',
    '- Jangan berikan markdown.',
    '- Jangan berikan penjelasan.',
    '- Jangan berikan insight bisnis, forecast, health score, atau saran.',
    '- Jangan mengarang nilai yang tidak terlihat.',
    '- Jika nilai tidak terlihat: isi null.',
    '- Jika nota sulit dibaca: status = "unreadable".',
    '- Jika sebagian terbaca: status = "partial".',
    '- Gunakan currency "IDR" bila terlihat sebagai rupiah, jika tidak jelas isi null.',
    '- warnings hanya berisi warning observasi OCR (contoh: "blurred_text").',
  ].join('\n');
}

function validateAndNormalize(raw: any): OCRExtractionResult {
  const warnings = new Set<string>();
  const itemWarnings = new Set<string>();

  const rawStatus = raw?.status;
  const status: ExtractionStatus =
    rawStatus === 'ok' || rawStatus === 'partial' || rawStatus === 'unreadable' ? rawStatus : 'partial';

  if (rawStatus !== status) {
    warnings.add('invalid_status_normalized');
  }

  const itemsRaw = Array.isArray(raw?.items) ? raw.items : [];
  const normalizedItems: OCRExtractedItem[] = itemsRaw
    .map((item: any) => {
      const name = sanitizeText(item?.name, 160) || 'Item Tidak Dikenal';
      const qty = toNullableNumber(item?.qty);
      const unitPrice = toNullableNumber(item?.unit_price);
      const subtotal = toNullableNumber(item?.subtotal);
      const categoryHint = sanitizeText(item?.category_hint, 80);

      return {
        name,
        qty,
        unit_price: unitPrice,
        subtotal,
        category_hint: categoryHint,
      };
    })
    .filter((item: OCRExtractedItem) => item.name.length > 0);

  for (const item of normalizedItems) {
    if (item.qty !== null && item.qty <= 0) warnings.add('invalid_qty_non_positive');
    if (item.unit_price !== null && item.unit_price < 0) warnings.add('invalid_negative_unit_price');
    if (item.subtotal !== null && item.subtotal < 0) warnings.add('invalid_negative_item_subtotal');
    if (item.unit_price !== null && item.unit_price > MAX_ACCEPTABLE_ITEM_PRICE) warnings.add('suspicious_large_item_price');

    if (item.qty !== null && item.unit_price !== null && item.subtotal !== null) {
      const expected = item.qty * item.unit_price;
      if (Math.abs(expected - item.subtotal) > MATH_TOLERANCE) {
        itemWarnings.add(`item_subtotal_mismatch:${item.name}`);
      }
    }
    if (item.unit_price === null) warnings.add('missing_item_prices');
  }

  if (itemWarnings.size > 0) warnings.add('item_subtotal_mismatch');

  const duplicateNameCheck = normalizedItems.map((i) => i.name.toLowerCase());
  if (new Set(duplicateNameCheck).size !== duplicateNameCheck.length) warnings.add('duplicate_item_names');

  const subtotal = toNullableNumber(raw?.subtotal);
  const discount = toNullableNumber(raw?.discount) ?? 0;
  const tax = toNullableNumber(raw?.tax) ?? 0;
  const serviceCharge = toNullableNumber(raw?.service_charge) ?? 0;
  const total = toNullableNumber(raw?.total);

  if (subtotal !== null && subtotal < 0) warnings.add('invalid_negative_subtotal');
  if (discount < 0) warnings.add('invalid_negative_discount');
  if (tax < 0) warnings.add('invalid_negative_tax');
  if (serviceCharge < 0) warnings.add('invalid_negative_service_charge');
  if (total !== null && total < 0) warnings.add('invalid_negative_total');
  if (total === null) warnings.add('missing_total');
  if (total !== null && total > MAX_ACCEPTABLE_TOTAL) warnings.add('suspiciously_large_total');

  if (subtotal !== null && total !== null) {
    const expectedTotal = subtotal - discount + tax + serviceCharge;
    if (Math.abs(expectedTotal - total) > MATH_TOLERANCE) warnings.add('total_mismatch');
  }

  if (status === 'unreadable') warnings.add('unreadable_receipt');

  const confidenceRaw = toNullableNumber(raw?.confidence);
  let confidence = confidenceRaw ?? 0;
  if (confidence > 1 && confidence <= 100) confidence = confidence / 100;
  if (confidence < 0) confidence = 0;
  if (confidence > 1) confidence = 1;

  const payload: OCRExtractionPayload = {
    status,
    merchant_name: sanitizeText(raw?.merchant_name, 180),
    transaction_date: normalizeDate(sanitizeText(raw?.transaction_date, 40)),
    transaction_time: normalizeTime(sanitizeText(raw?.transaction_time, 20)),
    currency: raw?.currency === 'IDR' ? 'IDR' : null,
    payment_method: sanitizeText(raw?.payment_method, 80),
    items: normalizedItems,
    subtotal,
    discount,
    tax,
    service_charge: serviceCharge,
    total,
    confidence: Number(confidence.toFixed(4)),
    warnings: [...new Set([...(Array.isArray(raw?.warnings) ? raw.warnings.map((w: unknown) => sanitizeText(w, 80)).filter(Boolean) : []), ...warnings])].map((w) => String(w)),
  };

  const criticalInvalid =
    payload.status === 'unreadable' ||
    payload.warnings.includes('invalid_qty_non_positive') ||
    payload.warnings.includes('invalid_negative_unit_price') ||
    payload.warnings.includes('invalid_negative_total');

  const validationStatus: 'valid' | 'partial' | 'invalid' = criticalInvalid
    ? 'invalid'
    : payload.status === 'ok' && payload.warnings.length === 0
      ? 'valid'
      : 'partial';

  return {
    extraction: payload,
    imageHash: '',
    duplicateScanId: null,
    validationStatus,
    criticalInvalid,
  };
}

export async function processStrictOCR(params: {
  imageData: string;
  mimeType: string;
  businessId: string;
  fileName?: string;
}): Promise<OCRExtractionResult> {
  const { imageData, mimeType, businessId } = params;
  const mime = (mimeType || '').toLowerCase().trim();
  if (!allowedMimeTypes.has(mime)) {
    throw Object.assign(new Error(`Tipe file tidak didukung: ${mimeType}`), { status: 400 });
  }

  const imageBuffer = Buffer.from(imageData, 'base64');
  if (imageBuffer.length === 0) {
    throw Object.assign(new Error('Konten gambar kosong.'), { status: 400 });
  }
  if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw Object.assign(new Error('Ukuran gambar terlalu besar. Maksimal 10MB.'), { status: 413 });
  }

  const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

  const duplicate = await runSupabaseQuery<any | null>('nota_scans.findByImageHash', (supabase) =>
    supabase
      .from('nota_scans')
      .select('id')
      .eq('business_id', businessId)
      .eq('image_hash', imageHash)
      .order('scan_date', { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  if (duplicate?.id) {
    throw Object.assign(new Error('Nota yang sama sudah pernah diunggah.'), {
      status: 409,
      code: 'DUPLICATE_RECEIPT',
      duplicateScanId: duplicate.id,
    });
  }

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mime,
            data: imageData,
          },
        },
        { text: buildPrompt() },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: buildSchema(),
      temperature: 0,
    },
  });

  const parsed = JSON.parse(String(response.text || '{}').trim());
  const validated = validateAndNormalize(parsed);
  validated.imageHash = imageHash;

  return validated;
}

export async function persistOCRScan(params: {
  businessId: string;
  result: OCRExtractionResult;
}): Promise<any> {
  const { businessId, result } = params;

  if (result.criticalInvalid) {
    return null;
  }

  const payload = result.extraction;
  const saved = await runSupabaseQuery<any>('nota_scans.createStrictOCR', (supabase) =>
    supabase
      .from('nota_scans')
      .insert({
        business_id: businessId,
        vendor_name: payload.merchant_name,
        nota_date: payload.transaction_date,
        items: payload.items,
        subtotal: payload.subtotal,
        tax_amount: payload.tax,
        total_amount: payload.total,
        raw_extracted_text: null,
        status: 'pending',
        raw_extraction_json: payload,
        validation_status: result.validationStatus,
        confidence: payload.confidence,
        warnings: payload.warnings,
        image_hash: result.imageHash,
        extraction_version: OCR_EXTRACTION_VERSION,
      })
      .select('*')
      .single()
  );

  return saved;
}
