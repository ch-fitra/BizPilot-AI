export interface BusinessMemoryRecord {
  id: string;
  memory_type: string;
  title: string;
  content: string;
  period_start: string | null;
  period_end: string | null;
  importance_score: number;
  created_at: string;
}

export class BusinessMemoryClient {
  static async list(page = 1, pageSize = 10): Promise<BusinessMemoryRecord[]> {
    const res = await fetch(`/api/business-memory?page=${page}&pageSize=${pageSize}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal mengambil business memory.');
    return data.memories || [];
  }

  static async generate(memoryType: 'weekly_summary' | 'monthly_summary' = 'weekly_summary') {
    const res = await fetch('/api/business-memory/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory_type: memoryType }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal generate memory.');
    return data;
  }
}
