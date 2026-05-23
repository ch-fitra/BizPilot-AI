import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';
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

const HISTORY_FILE_PATH = path.join(process.cwd(), 'history.json');

export class AnalysisHistoryRepository {
  private static async ensureFileExists() {
    try {
      await fs.access(HISTORY_FILE_PATH);
    } catch {
      await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  // Determine risk level based on health score
  private static calculateRiskLevel(score: number): 'Excellent' | 'Good' | 'Warning' | 'Critical' {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Warning';
    return 'Critical';
  }

  // Retrieve all records sorted by date descending
  static async getAll(): Promise<AnalysisHistoryRecord[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('analysis_histories')
            .select('*, business_profiles(business_name, business_type, id)')
            .order('created_at', { ascending: false });

          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
              console.warn('⚠️ analysis_histories table is missing. Temporarily skipping Supabase integration to run on Local JSON.');
            } else {
              console.error('Supabase query error in analysis histories retrieval:', error.message);
            }
          } else if (data) {
            return data.map((row: any) => {
              // Extract profile elements if reference matches
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
                customer_reviews_summary: Array.isArray(row.customer_reviews_summary) ? row.customer_reviews_summary : (row.ai_result?.customer_reviews_summary || []),
                action_plan: Array.isArray(row.action_plan) ? row.action_plan : [],
                risk_level: (row.risk_level || this.calculateRiskLevel(row.health_score ?? 0)) as any,
                created_at: row.created_at,
                updated_at: row.updated_at
              };
            });
          }
        } catch (err: any) {
          console.error('Exception retrieving analysis records from DB - falling back locally:', err);
        }
      }
    }

    // Local JSON Fallback Read
    try {
      await this.ensureFileExists();
      const content = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
      const data = JSON.parse(content) as any[];

      // Map to ensure structured properties like risk_level
      const mapped = data.map((item: any) => ({
        ...item,
        // Ensure properties map correctly if schema names differ slightly
        analysis_id: item.analysis_id || item.id,
        business_id: item.business_id || null,
        risk_level: item.risk_level || this.calculateRiskLevel(item.health_score || 0)
      }));

      // Sort descending by created_at
      return mapped.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error reading local fallback analysis history list:', error);
      return [];
    }
  }

  // Retrieve single record by ID
  static async getById(id: string): Promise<AnalysisHistoryRecord | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('analysis_histories')
            .select('*, business_profiles(business_name, business_type, id)')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            const profile = data.business_profiles;
            return {
              analysis_id: data.id,
              business_id: data.business_id,
              business_name: profile?.business_name || 'Profil Tanpa Nama',
              business_type: profile?.business_type || 'Kategori Umum',
              input_source: data.input_source || 'text',
              uploaded_file_name: data.uploaded_file_name || undefined,
              raw_input_summary: data.raw_input_summary || '',
              ai_result: data.ai_result,
              health_score: data.health_score ?? 0,
              total_sales: Number(data.total_sales ?? 0),
              total_transactions: data.total_transactions ?? 0,
              top_products: Array.isArray(data.top_products) ? data.top_products : [],
              inventory_alerts: Array.isArray(data.inventory_alerts) ? data.inventory_alerts : [],
              customer_sentiment: data.customer_sentiment,
              customer_reviews_summary: Array.isArray(data.customer_reviews_summary) ? data.customer_reviews_summary : (data.ai_result?.customer_reviews_summary || []),
              action_plan: Array.isArray(data.action_plan) ? data.action_plan : [],
              risk_level: (data.risk_level || this.calculateRiskLevel(data.health_score ?? 0)) as any,
              created_at: data.created_at,
              updated_at: data.updated_at
            };
          }
        } catch (err) {
          console.error(`Exception finding DB record for id ${id}:`, err);
        }
      }
    }

    const list = await this.getAll();
    return list.find(item => item.analysis_id === id) || null;
  }

  // Get newest record
  static async getLatest(): Promise<AnalysisHistoryRecord | null> {
    const list = await this.getAll();
    return list.length > 0 ? list[0] : null;
  }

  // Save new record
  static async create(record: Omit<AnalysisHistoryRecord, 'analysis_id' | 'created_at' | 'updated_at' | 'risk_level'>): Promise<AnalysisHistoryRecord> {
    const calculatedRisk = this.calculateRiskLevel(record.health_score);

    // If supabase database active, insert to cloud
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Check if profile exists; if business_id is empty, link to the first active profile or none
          let linkedBusinessId = record.business_id;
          if (!linkedBusinessId) {
            const activeProfile = await BusinessProfileRepository.getActiveProfile();
            if (activeProfile) {
              linkedBusinessId = activeProfile.id;
            }
          }

          const { data, error } = await supabase
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
              customer_sentiment: record.customer_sentiment ? (typeof record.customer_sentiment === 'string' ? JSON.stringify(record.customer_sentiment) : record.customer_sentiment) : null,
              customer_reviews_summary: record.customer_reviews_summary || null,
              action_plan: record.action_plan,
              risk_level: calculatedRisk
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase write error in repository:', error.message);
          } else if (data) {
            // Find linked profile details to populate
            const activeProfile = linkedBusinessId ? await BusinessProfileRepository.getActiveProfile() : null;
            return {
              analysis_id: data.id,
              business_id: data.business_id,
              business_name: activeProfile?.business_name || record.business_name || 'Profil Tanpa Nama',
              business_type: activeProfile?.business_type || record.business_type || 'Kategori Umum',
              input_source: data.input_source,
              uploaded_file_name: data.uploaded_file_name || undefined,
              raw_input_summary: data.raw_input_summary || '',
              ai_result: data.ai_result,
              health_score: data.health_score ?? 0,
              total_sales: Number(data.total_sales ?? 0),
              total_transactions: data.total_transactions ?? 0,
              top_products: data.top_products || [],
              inventory_alerts: data.inventory_alerts || [],
              customer_sentiment: data.customer_sentiment,
              customer_reviews_summary: data.customer_reviews_summary || [],
              action_plan: data.action_plan || [],
              risk_level: data.risk_level as any,
              created_at: data.created_at,
              updated_at: data.updated_at
            };
          }
        } catch (err) {
          console.error('Unhandled DB exception saving analysis: falling back local stream:', err);
        }
      }
    }

    // Fallback: saving local
    await this.ensureFileExists();
    const content = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as any[];

    const localId = `anl_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const newRecord: AnalysisHistoryRecord = {
      ...record,
      analysis_id: localId,
      risk_level: calculatedRisk,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.push(newRecord);
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return newRecord;
  }

  // Delete analysis history record
  static async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('analysis_histories')
            .delete()
            .eq('id', id);

          if (!error) {
            return true;
          } else {
            console.error('Error deleting analysis record from DB:', error.message);
          }
        } catch (err) {
          console.error('DB deletion failed:', err);
        }
      }
    }

    // JSON Local Delete Fallback
    await this.ensureFileExists();
    const content = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as any[];
    const filtered = list.filter((item: any) => (item.analysis_id || item.id) !== id);

    if (filtered.length === list.length) {
      return false; 
    }

    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
}
