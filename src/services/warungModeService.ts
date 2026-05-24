export interface WarungParsedItem {
  name: string;
  qty: number | null;
  unit_price: number | null;
  subtotal: number | null;
  confidence: number;
  matched_product_id: string | null;
  match_status: 'exact' | 'fuzzy' | 'new_item' | 'unknown';
}

export interface WarungParseResponse {
  status: 'ok' | 'partial' | 'failed';
  items: WarungParsedItem[];
  warnings: string[];
}

export class WarungModeClient {
  static async parseVoice(transcript: string): Promise<WarungParseResponse> {
    const res = await fetch('/api/warung-mode/parse-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal parsing voice.');
    return { status: data.status, items: data.items || [], warnings: data.warnings || [] };
  }

  static async saveTransaction(payload: { transcript: string; status: 'ok' | 'partial' | 'failed'; items: WarungParsedItem[]; idempotency_key: string }) {
    const res = await fetch('/api/warung-mode/save-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': payload.idempotency_key,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal simpan transaksi.');
    return data.data;
  }
}
