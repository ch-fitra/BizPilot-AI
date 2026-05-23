import fs from 'fs/promises';
import path from 'path';

export interface AnalysisHistoryRecord {
  analysis_id: string;
  business_name: string;
  business_type: string;
  input_source: 'file' | 'text' | 'both' | 'demo';
  uploaded_file_name?: string;
  raw_input_summary: string;
  ai_result: any; // BusinessHealthState JSON content
  health_score: number;
  total_sales: number;
  total_transactions: number;
  top_products: any[];
  inventory_alerts: string[];
  customer_sentiment: string; // Overall sentiment text or summary representation
  customer_reviews_summary?: any[];
  action_plan: any[];
  created_at: string;
  updated_at: string;
}

const HISTORY_FILE_PATH = path.join(process.cwd(), 'history.json');

export class AnalysisHistoryStore {
  private static async ensureFileExists() {
    try {
      await fs.access(HISTORY_FILE_PATH);
    } catch {
      // Create empty list file if not present
      await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  static async getAll(): Promise<AnalysisHistoryRecord[]> {
    try {
      await this.ensureFileExists();
      const content = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      // Sort descending by created_at (latest first)
      return data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error reading analysis history:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<AnalysisHistoryRecord | null> {
    const list = await this.getAll();
    return list.find(item => item.analysis_id === id) || null;
  }

  static async getLatest(): Promise<AnalysisHistoryRecord | null> {
    const list = await this.getAll();
    return list.length > 0 ? list[0] : null;
  }

  static async create(record: Omit<AnalysisHistoryRecord, 'analysis_id' | 'created_at' | 'updated_at'>): Promise<AnalysisHistoryRecord> {
    const list = await this.getAll();
    
    const newRecord: AnalysisHistoryRecord = {
      ...record,
      analysis_id: `anl_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.push(newRecord);
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return newRecord;
  }

  static async delete(id: string): Promise<boolean> {
    const list = await this.getAll();
    const filtered = list.filter(item => item.analysis_id !== id);
    if (filtered.length === list.length) {
      return false; // Not found to delete
    }
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
}
