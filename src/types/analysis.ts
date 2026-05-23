import { BusinessHealthState } from '../types';

export type AnalysisRiskLevel = 'Excellent' | 'Good' | 'Warning' | 'Critical';
export type StorageMode = 'Supabase PostgreSQL' | 'Local JSON';

export interface BusinessProfile {
  id: string;
  business_name: string;
  business_type?: string;
  owner_name?: string;
  location?: string;
  currency?: string;
  phone?: string;
  email?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnalysisHistoryRecord {
  analysis_id: string;
  business_id?: string | null;
  business_name: string;
  business_type: string;
  input_source: 'file' | 'text' | 'both' | 'demo';
  uploaded_file_name?: string;
  raw_input_summary: string;
  ai_result: BusinessHealthState;
  health_score: number;
  total_sales: number;
  total_transactions: number;
  top_products: any[];
  inventory_alerts: string[];
  customer_sentiment: string | any;
  customer_reviews_summary?: any[];
  action_plan: any[];
  risk_level: AnalysisRiskLevel;
  created_at: string;
  updated_at: string;
}

// Alias for alignment with prompts
export type AnalysisHistory = AnalysisHistoryRecord;
