export interface PassiveAlertRecord {
  id: string;
  business_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric_snapshot: Record<string, any>;
  source: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
}

export class PassiveIntelligenceClient {
  static async runAnalysis(): Promise<{ created: number }> {
    const res = await fetch('/api/passive-intelligence/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal menjalankan analisis.');
    return { created: Number(data.created || 0) };
  }

  static async getActiveAlerts(): Promise<PassiveAlertRecord[]> {
    const res = await fetch('/api/passive-intelligence/alerts');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal mengambil alert.');
    return data.alerts || [];
  }

  static async resolveAlert(alertId: string): Promise<PassiveAlertRecord> {
    const res = await fetch(`/api/passive-intelligence/alerts/${encodeURIComponent(alertId)}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal menyelesaikan alert.');
    return data.alert;
  }
}
