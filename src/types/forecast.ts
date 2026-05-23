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

export interface SimulationResult {
  projectedRevenue: number;
  stockoutRiskCount: number;
  estimatedConversions: number;
  actionPriority: 'Low' | 'Medium' | 'High' | 'Critical';
  adjustedSalesForecast: { date: string; projectedSales: number; baselineSales: number }[];
  adjustedInventoryForecast: { name: string; currentStock: number; daysToStockout: number; riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' }[];
  adjustedCrmForecast: { leadName: string; probability: number; estimatedValue: number }[];
}
