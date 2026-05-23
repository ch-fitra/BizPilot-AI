export interface SalesDataPoint {
  date: string;
  sales: number;
  transactions: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  stock: number;
  trend: 'up' | 'down' | 'flat';
}

export interface ReviewSummary {
  topic: string;
  rating: number;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ActionItem {
  id: number;
  priority: 'high' | 'medium' | 'low';
  task: string;
  category: 'inventory' | 'customer_service' | 'marketing' | 'operations' | 'finance';
  reasoning: string;
}

export interface BusinessHealthState {
  health_score: number;
  health_summary: string;
  strengths: string[];
  risks: string[];
  sales_trend: 'up' | 'down' | 'flat';
  alerts: string[];
  sales_data: SalesDataPoint[];
  top_products: TopProduct[];
  customer_reviews_summary: ReviewSummary[];
  action_plan: ActionItem[];
}
