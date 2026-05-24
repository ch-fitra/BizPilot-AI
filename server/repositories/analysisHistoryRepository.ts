import { runSupabaseQuery } from '../db/supabaseClient';
import { BusinessProfileRepository } from './businessProfileRepository';

export interface AnalysisHistoryRecord {
  analysis_id: string;
  business_id?: string | null;
  business_name: string;
  business_type: string;
  input_source: 'file' | 'text' | 'both' | 'demo';
  uploaded_file_name?: string;
  raw_input_summary: string;
  ai_result: any;
  health_score: number;
  total_sales: number;
  total_transactions: number;
  top_products: any[];
  inventory_alerts: string[];
  customer_sentiment: any;
  customer_reviews_summary?: any[];
  action_plan: any[];
  risk_level: 'Excellent' | 'Good' | 'Warning' | 'Critical';
  created_at: string;
  updated_at: string;
}

export class AnalysisHistoryRepository {
  private static calculateRiskLevel(score: number): 'Excellent' | 'Good' | 'Warning' | 'Critical' {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Warning';
    return 'Critical';
  }

  private static mapRow(row: any): AnalysisHistoryRecord {
    const profile = row.business_profiles;
    return {
      analysis_id: row.id,
      business_id: row.business_id,
      business_name: profile?.business_name || 'Profil Tanpa Nama',
      business_type: profile?.business_type || 'Kategori Umum',
      input_source: row.input_source || 'text',
      uploaded_file_name: row.uploaded_file_name || undefined,
      raw_input_summary: row.raw_input_summary || '',
      ai_result: row.ai_result,
      health_score: row.health_score ?? 0,
      total_sales: Number(row.total_sales ?? 0),
      total_transactions: row.total_transactions ?? 0,
      top_products: Array.isArray(row.top_products) ? row.top_products : [],
      inventory_alerts: Array.isArray(row.inventory_alerts) ? row.inventory_alerts : [],
      customer_sentiment: row.customer_sentiment,
      customer_reviews_summary: Array.isArray(row.customer_reviews_summary)
        ? row.customer_reviews_summary
        : (row.ai_result?.customer_reviews_summary || []),
      action_plan: Array.isArray(row.action_plan) ? row.action_plan : [],
      risk_level: (row.risk_level || this.calculateRiskLevel(row.health_score ?? 0)) as any,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async getAll(businessId?: string | null): Promise<AnalysisHistoryRecord[]> {
    const data = await runSupabaseQuery<any[]>('analysis_histories.getAll', (supabase) => {
      let query = supabase
        .from('analysis_histories')
        .select('*, business_profiles(business_name, business_type, id)')
        .order('created_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return (data || []).map((row) => this.mapRow(row));
  }

  static async getById(id: string, businessId?: string | null): Promise<AnalysisHistoryRecord | null> {
    const data = await runSupabaseQuery<any | null>('analysis_histories.getById', (supabase) => {
      let query = supabase
        .from('analysis_histories')
        .select('*, business_profiles(business_name, business_type, id)')
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query.maybeSingle();
    });

    return data ? this.mapRow(data) : null;
  }

  static async getLatest(businessId?: string | null): Promise<AnalysisHistoryRecord | null> {
    const list = await this.getAll(businessId);
    return list.length > 0 ? list[0] : null;
  }

  static async create(
    record: Omit<AnalysisHistoryRecord, 'analysis_id' | 'created_at' | 'updated_at' | 'risk_level'>
  ): Promise<AnalysisHistoryRecord> {
    const calculatedRisk = this.calculateRiskLevel(record.health_score);
    let linkedBusinessId = record.business_id;

    if (!linkedBusinessId) {
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      linkedBusinessId = activeProfile?.id || null;
    }

    const data = await runSupabaseQuery<any>('analysis_histories.create', (supabase) =>
      supabase
        .from('analysis_histories')
        .insert({
          business_id: linkedBusinessId || null,
          input_source: record.input_source,
          uploaded_file_name: record.uploaded_file_name || null,
          raw_input_summary: record.raw_input_summary,
          ai_result: record.ai_result,
          health_score: record.health_score,
          total_sales: record.total_sales,
          total_transactions: record.total_transactions,
          top_products: record.top_products,
          inventory_alerts: record.inventory_alerts,
          customer_sentiment: record.customer_sentiment || null,
          customer_reviews_summary: record.customer_reviews_summary || null,
          action_plan: record.action_plan,
          risk_level: calculatedRisk,
        })
        .select('*, business_profiles(business_name, business_type, id)')
        .single()
    );

    return this.mapRow(data);
  }

  static async delete(id: string, businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('analysis_histories.delete', (supabase) => {
      let query = supabase
        .from('analysis_histories')
        .delete()
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return true;
  }
}
