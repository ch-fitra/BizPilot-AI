import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';
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
    shortTerm: string[]; // 24 hours
    mediumTerm: string[]; // 7 days
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

const SNAPSHOTS_FILE_PATH = path.join(process.cwd(), 'forecast_snapshots.json');

export class ForecastRepository {
  private static async ensureFileExists() {
    try {
      await fs.access(SNAPSHOTS_FILE_PATH);
    } catch {
      await fs.writeFile(SNAPSHOTS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  // Get all snapshot records sorted descending based on date
  static async getAll(businessId?: string | null): Promise<ForecastSnapshot[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('forecast_snapshots')
            .select('*')
            .order('created_at', { ascending: false });

          if (businessId) {
            query = query.eq('business_id', businessId);
          }

          const { data, error } = await query;

          if (error) {
            const isMissingTable = 
              error.message.includes('Could not find the table') || 
              error.message.includes('relation "') || 
              error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
              console.warn('⚠️ forecast_snapshots table is missing in Supabase. Falling back on offline local JSON.');
            } else {
              console.error('Supabase error retrieving forecast snapshots:', error.message);
            }
          } else if (data) {
            return data.map((row: any) => ({
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
                operationalExecutionRisk: 'Low'
              },
              ai_recommendations: row.ai_recommendations || {
                whyMatters: 'Belum ada AI rekomendasi.',
                causes: [],
                shortTerm: [],
                mediumTerm: [],
                monitorNext: []
              },
              scenario_config: row.scenario_config || {
                expectedDailyGrowth: 0,
                stockReorderDelayDays: 0,
                leadConversionRate: 0,
                promoBoost: 0
              },
              created_at: row.created_at,
              updated_at: row.updated_at
            }));
          }
        } catch (err: any) {
          console.error('Exception reading forecast snapshots from DB:', err.message || err);
        }
      }
    }

    // Local JSON Fallback Read
    try {
      await this.ensureFileExists();
      const content = await fs.readFile(SNAPSHOTS_FILE_PATH, 'utf-8');
      const data = JSON.parse(content) as any[];
      const filtered = businessId ? data.filter((snapshot) => snapshot.business_id === businessId) : data;
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fallback reading forecast_snapshots.json:', error);
      return [];
    }
  }

  // Get latest snapshot
  static async getLatest(businessId?: string | null): Promise<ForecastSnapshot | null> {
    const list = await this.getAll(businessId);
    return list.length > 0 ? list[0] : null;
  }

  // Get by business ID
  static async getById(id: string): Promise<ForecastSnapshot | null> {
    const list = await this.getAll();
    return list.find(s => s.id === id) || null;
  }

  // Save new snapshot
  static async create(snapshot: Omit<ForecastSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<ForecastSnapshot> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let linkedBusinessId = snapshot.business_id;
          if (!linkedBusinessId) {
            const activeProfile = await BusinessProfileRepository.getActiveProfile();
            if (activeProfile) {
              linkedBusinessId = activeProfile.id;
            }
          }

          const { data, error } = await supabase
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
              scenario_config: snapshot.scenario_config
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase write error in ForecastRepository:', error.message);
          } else if (data) {
            return {
              id: data.id,
              business_id: data.business_id,
              forecast_range: data.forecast_range as any,
              projected_revenue: Number(data.projected_revenue ?? 0),
              projected_transactions: Number(data.projected_transactions ?? 0),
              risk_level: data.risk_level as any,
              confidence_level: data.confidence_level as any,
              sales_forecast: data.sales_forecast,
              inventory_forecast: data.inventory_forecast,
              crm_forecast: data.crm_forecast,
              risk_radar: data.risk_radar,
              ai_recommendations: data.ai_recommendations,
              scenario_config: data.scenario_config,
              created_at: data.created_at,
              updated_at: data.updated_at
            };
          }
        } catch (err: any) {
          console.error('Exception database write in ForecastRepository:', err.message || err);
        }
      }
    }

    // JSON Fallback Write
    await this.ensureFileExists();
    const content = await fs.readFile(SNAPSHOTS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as any[];

    const localId = `fct_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const newRecord: ForecastSnapshot = {
      ...snapshot,
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.push(newRecord);
    await fs.writeFile(SNAPSHOTS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return newRecord;
  }

  // Delete snapshot
  static async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('forecast_snapshots')
            .delete()
            .eq('id', id);

          if (!error) return true;
          console.error('Supabase error deleting snapshot:', error.message);
        } catch (err: any) {
          console.error('Exception database delete in ForecastRepository:', err.message || err);
        }
      }
    }

    // Fallback Delete
    await this.ensureFileExists();
    const content = await fs.readFile(SNAPSHOTS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as any[];
    const filtered = list.filter(item => item.id !== id);

    if (filtered.length === list.length) return false;

    await fs.writeFile(SNAPSHOTS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
}
