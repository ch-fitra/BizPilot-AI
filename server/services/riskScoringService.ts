import { AnalysisHistoryRecord } from '../repositories/analysisHistoryRepository';

export interface ThreatScorecard {
  salesRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  inventoryRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  customerSentimentRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  crmPipelineRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  operationalExecutionRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class RiskScoringService {
  /**
   * Assesses threats across all 5 key categories using active business metrics.
   */
  static assessRisks(
    latestAnalysis: AnalysisHistoryRecord | null,
    leads: any[] = [],
    activities: any[] = []
  ): ThreatScorecard {
    return {
      salesRisk: this.calculateSalesRisk(latestAnalysis),
      inventoryRisk: this.calculateInventoryRisk(latestAnalysis),
      customerSentimentRisk: this.calculateSentimentRisk(latestAnalysis),
      crmPipelineRisk: this.calculateCrmPipelineRisk(leads),
      operationalExecutionRisk: this.calculateOperationalRisk(leads, activities)
    };
  }

  /**
   * Maps a number score (0-100) to a clear risk string level.
   */
  static mapToRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 25) return 'Medium';
    return 'Low';
  }

  private static calculateSalesRisk(latest: AnalysisHistoryRecord | null): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (!latest) return 'Medium'; // Neutral baseline
    
    let penalty = 0;
    // Low total sales means vulnerability
    if (latest.total_sales < 5000000) penalty += 40;
    else if (latest.total_sales < 15000000) penalty += 20;

    // Transaction volume
    if (latest.total_transactions < 10) penalty += 30;
    else if (latest.total_transactions < 30) penalty += 15;

    // Health Score
    if (latest.health_score < 50) penalty += 40;
    else if (latest.health_score < 70) penalty += 20;

    return this.mapToRiskLevel(Math.min(100, penalty));
  }

  private static calculateInventoryRisk(latest: AnalysisHistoryRecord | null): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (!latest) return 'Low';

    const alertsCount = latest.inventory_alerts?.length ?? 0;
    if (alertsCount === 0) return 'Low';
    if (alertsCount > 5) return 'Critical';
    if (alertsCount > 2) return 'High';
    return 'Medium';
  }

  private static calculateSentimentRisk(latest: AnalysisHistoryRecord | null): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (!latest || !latest.customer_sentiment) return 'Low';

    const sentiment = latest.customer_sentiment;
    const score = sentiment.score ?? 75; // assume high starting score if unset
    
    // Low score implies high risk
    if (score < 40) return 'Critical';
    if (score < 65) return 'High';
    if (score < 80) return 'Medium';
    return 'Low';
  }

  private static calculateCrmPipelineRisk(leads: any[]): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (!leads || leads.length === 0) return 'Low';

    let riskScore = 0;
    const totalLeads = leads.length;
    
    // Count stale leads (no progression beyond introduction/first touch or negative interest)
    const coldLeads = leads.filter(l => 
      l.interest_level === 'Low' || 
      l.pipeline_stage === 'Prospect' || 
      l.pipeline_stage === 'lead'
    ).length;

    const percentCold = (coldLeads / totalLeads) * 100;
    if (percentCold > 70) riskScore += 40;
    else if (percentCold > 40) riskScore += 25;

    // High dependency on lost cases
    const averageScore = leads.reduce((sum, l) => sum + (l.lead_score || 50), 0) / totalLeads;
    if (averageScore < 40) riskScore += 30;
    else if (averageScore < 60) riskScore += 15;

    return this.mapToRiskLevel(Math.min(100, riskScore));
  }

  private static calculateOperationalRisk(leads: any[], activities: any[]): 'Low' | 'Medium' | 'High' | 'Critical' {
    let riskScore = 0;

    // Look at overdue follow ups in CRM
    const today = new Date();
    const overdueLeads = leads.filter(l => {
      if (!l.next_follow_up) return false;
      const followUpDate = new Date(l.next_follow_up);
      return followUpDate < today && l.pipeline_stage !== 'Closed Won' && l.pipeline_stage !== 'Closed Lost';
    }).length;

    if (overdueLeads > 3) riskScore += 45;
    else if (overdueLeads > 0) riskScore += 25;

    // Stale activities
    if (activities && activities.length > 0) {
      const pendingCount = activities.filter(a => a.status === 'Pending' || a.status === 'planned').length;
      if (pendingCount > 5) riskScore += 30;
      else if (pendingCount > 2) riskScore += 15;
    } else {
      // No recorded sales actions is a vulnerability
      riskScore += 20;
    }

    return this.mapToRiskLevel(Math.min(100, riskScore));
  }

  /**
   * Determines the absolute maximum overall threat level
   */
  static determineOverallRiskLevel(radar: ThreatScorecard): 'Low' | 'Medium' | 'High' | 'Critical' {
    const list = [radar.salesRisk, radar.inventoryRisk, radar.customerSentimentRisk, radar.crmPipelineRisk, radar.operationalExecutionRisk];
    if (list.includes('Critical')) return 'Critical';
    if (list.includes('High')) return 'High';
    if (list.includes('Medium')) return 'Medium';
    return 'Low';
  }
}
