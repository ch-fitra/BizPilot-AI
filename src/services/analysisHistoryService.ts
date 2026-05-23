import { AnalysisHistoryRecord } from '../types/analysis';

export class AnalysisHistoryService {
  static async getAll(): Promise<AnalysisHistoryRecord[]> {
    try {
      const response = await fetch('/api/analysis-history');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
      throw error;
    }
  }

  static async getLatest(): Promise<AnalysisHistoryRecord | null> {
    try {
      const response = await fetch('/api/analysis-history/latest');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to fetch latest analysis:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<AnalysisHistoryRecord | null> {
    try {
      const response = await fetch(`/api/analysis-history/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch analysis record ${id}:`, error);
      throw error;
    }
  }

  static async create(record: Omit<AnalysisHistoryRecord, 'analysis_id' | 'created_at' | 'updated_at'>): Promise<AnalysisHistoryRecord> {
    try {
      const response = await fetch('/api/analysis-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Server rejected creation of history item.');
      }
      return result.data;
    } catch (error) {
      console.error('Failed to create history record:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/analysis-history/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error(`Failed to delete history record ${id}:`, error);
      throw error;
    }
  }
}
