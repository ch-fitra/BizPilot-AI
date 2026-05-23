import { ForecastSnapshot, SimulationResult } from '../types/forecast';

export class ForecastService {
  /**
   * Fetches all snapshots from database/local file
   */
  static async getAllSnapshots(): Promise<ForecastSnapshot[]> {
    try {
      const response = await fetch('/api/forecast');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed loading templates');
      }
      return data.snapshots || [];
    } catch (error) {
      console.error('ForecastService: Error getting snapshots:', error);
      return [];
    }
  }

  /**
   * Fetches the latest snapshot. If none exists, server initializes one
   */
  static async getLatestSnapshot(): Promise<ForecastSnapshot | null> {
    try {
      const response = await fetch('/api/forecast/latest');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed loading latest');
      }
      return data.snapshot || null;
    } catch (error) {
      console.error('ForecastService: Error loading latest snapshot:', error);
      return null;
    }
  }

  /**
   * Triggers the forecasting service to generate a new snapshot
   */
  static async generateSnapshot(range: '7d' | '14d' | '30d'): Promise<ForecastSnapshot | null> {
    try {
      const response = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ range })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ggal memproses snapshot');
      }
      return data.snapshot || null;
    } catch (error: any) {
      console.error('ForecastService: Exception generating snapshot:', error);
      throw new Error(error.message || 'Gagal memproses kecerdasan prediktif.');
    }
  }

  /**
   * Summons the simulation calculator
   */
  static async simulateScenario(params: {
    snapshot_id?: string;
    expectedDailyGrowth: number;
    stockReorderDelayDays: number;
    leadConversionRate: number;
    promoBoost: number;
  }): Promise<SimulationResult | null> {
    try {
      const response = await fetch('/api/forecast/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghitung simulasi');
      }
      return data.results || null;
    } catch (error: any) {
      console.error('ForecastService: Error run simulation payload:', error);
      throw new Error(error.message || 'Gagal menghidupkan simulator.');
    }
  }

  /**
   * Deletes a forecast snapshot
   */
  static async deleteSnapshot(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/forecast/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return !!data.success;
    } catch (error) {
      console.error(`ForecastService: Error deleting snapshot with ID ${id}:`, error);
      return false;
    }
  }
}
