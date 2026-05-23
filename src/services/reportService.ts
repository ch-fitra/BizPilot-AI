import { AnalysisHistoryRecord } from '../types/analysis';

export interface ReportListResponse {
  success: boolean;
  count: number;
  data: AnalysisHistoryRecord[];
}

export interface ReportDetailResponse {
  success: boolean;
  data: AnalysisHistoryRecord | null;
}

export class ReportService {
  /**
   * Fetches all analysis reports
   */
  static async getAllReports(): Promise<ReportListResponse> {
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      return {
        success: false,
        count: 0,
        data: []
      };
    }
  }

  /**
   * Fetches details for a single report by ID
   */
  static async getReportDetail(analysisId: string): Promise<ReportDetailResponse> {
    try {
      const response = await fetch(`/api/reports/${analysisId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error(`Failed to load report detail for ${analysisId}:`, err);
      return {
        success: false,
        data: null
      };
    }
  }

  /**
   * Returns backend CSV export URL
   */
  static getCsvExportUrl(analysisId: string): string {
    return `/api/reports/${analysisId}/csv`;
  }
}
