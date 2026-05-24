export interface FounderDashboardSummary {
  businessHealthScore: { score: number | null; status: 'healthy' | 'warning' | 'critical' | 'no_data'; factors: string[] };
  today: { revenue: number; expenses: number; profit: number; transactionCount: number; averageTransactionValue: number };
  alerts: Array<{ id: string; severity: 'low' | 'medium' | 'high' | 'critical'; message: string }>;
  ocrQuality: { averageConfidence: number | null; lowConfidenceCount: number; totalScans: number };
  warungMode: { todayTransactions: number; lastTransactionAt: string | null };
  whatsapp: { linked: boolean; linkedPhoneLast4: string | null; lastInboundAt: string | null; pendingActions: number };
  memoryHighlights: Array<{ id: string; title: string }>;
  recommendedActions: Array<{ text: string; source: string }>;
}
