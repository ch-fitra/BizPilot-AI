import { runSupabaseQuery } from '../db/supabaseClient';
import { BusinessProfileRepository } from './businessProfileRepository';

export interface ForecastSnapshot {
  id: string;
  business_id?: string | null;
  forecast_range: '7d' | '14d' | '30d';
  projected_revenue: number;
  projected_transactions: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence_level: 'Low' | 'Medium' | 'High';
  sales_forecast: {
    date: string;
    projectedSales: number;
    baselineSales: number;
  }[];
  inventory_forecast: {
    name: string;
    currentStock: number;
    daysToStockout: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    recommendedReorder: number;
    suggestedAction: string;
  }[];
  crm_forecast: {
    leadName: string;
    stage: string;
    probability: number;
    estimatedValue: number;
    nextAction: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Urgent';
  }[];
  risk_radar: {
    salesRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    inventoryRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    customerSentimentRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    crmPipelineRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    operationalExecutionRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  ai_recommendations: {
    whyMatters: string;
    causes: string[];
    shortTerm: string[];
    mediumTerm: string[];
    monitorNext: string[];
  };
  scenario_config: {
    expectedDailyGrowth: number;
    stockReorderDelayDays: number;
    leadConversionRate: number;
    promoBoost: number;
  };
  created_at: string;
  updated_at: string;
}

export class ForecastRepository {
  private static mapRow(row: any): ForecastSnapshot {
    return {
      id: row.id,
      business_id: row.business_id,
      forecast_range: row.forecast_range as any,
      projected_revenue: Number(row.projected_revenue ?? 0),
      projected_transactions: Number(row.projected_transactions ?? 0),
      risk_level: row.risk_level as any,
      confidence_level: row.confidence_level as any,
      sales_forecast: Array.isArray(row.sales_forecast) ? row.sales_forecast : [],
      inventory_forecast: Array.isArray(row.inventory_forecast) ? row.inventory_forecast : [],
      crm_forecast: Array.isArray(row.crm_forecast) ? row.crm_forecast : [],
      risk_radar: row.risk_radar || {
        salesRisk: 'Low',
        inventoryRisk: 'Low',
        customerSentimentRisk: 'Low',
        crmPipelineRisk: 'Low',
        operationalExecutionRisk: 'Low',
      },
      ai_recommendations: row.ai_recommendations || {
        whyMatters: 'Belum ada AI rekomendasi.',
        causes: [],
        shortTerm: [],
        mediumTerm: [],
        monitorNext: [],
      },
      scenario_config: row.scenario_config || {
        expectedDailyGrowth: 0,
        stockReorderDelayDays: 0,
        leadConversionRate: 0,
        promoBoost: 0,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async getAll(businessId?: string | null): Promise<ForecastSnapshot[]> {
    const data = await runSupabaseQuery<any[]>('forecast_snapshots.getAll', (supabase) => {
      let query = supabase
        .from('forecast_snapshots')
        .select('*')
        .order('created_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return (data || []).map((row) => this.mapRow(row));
  }

  static async getLatest(businessId?: string | null): Promise<ForecastSnapshot | null> {
    const list = await this.getAll(businessId);
    return list.length > 0 ? list[0] : null;
  }

  static async getById(id: string, businessId?: string | null): Promise<ForecastSnapshot | null> {
    const data = await runSupabaseQuery<any | null>('forecast_snapshots.getById', (supabase) => {
      let query = supabase
        .from('forecast_snapshots')
        .select('*')
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query.maybeSingle();
    });

    return data ? this.mapRow(data) : null;
  }

  static async create(snapshot: Omit<ForecastSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<ForecastSnapshot> {
    let linkedBusinessId = snapshot.business_id;
    if (!linkedBusinessId) {
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      linkedBusinessId = activeProfile?.id || null;
    }

    const data = await runSupabaseQuery<any>('forecast_snapshots.create', (supabase) =>
      supabase
        .from('forecast_snapshots')
        .insert({
          business_id: linkedBusinessId || null,
          forecast_range: snapshot.forecast_range,
          projected_revenue: snapshot.projected_revenue,
          projected_transactions: snapshot.projected_transactions,
          risk_level: snapshot.risk_level,
          confidence_level: snapshot.confidence_level,
          sales_forecast: snapshot.sales_forecast,
          inventory_forecast: snapshot.inventory_forecast,
          crm_forecast: snapshot.crm_forecast,
          risk_radar: snapshot.risk_radar,
          ai_recommendations: snapshot.ai_recommendations,
          scenario_config: snapshot.scenario_config,
        })
        .select()
        .single()
    );

    return this.mapRow(data);
  }

  static async delete(id: string, businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('forecast_snapshots.delete', (supabase) => {
      let query = supabase
        .from('forecast_snapshots')
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
