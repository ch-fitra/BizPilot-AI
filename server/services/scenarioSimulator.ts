import { ForecastSnapshot } from '../repositories/forecastRepository';

export interface SimulationInput {
  expectedDailyGrowth: number;       // e.g. -5 to 50 (%)
  stockReorderDelayDays: number;     // e.g. 0 to 20 (days)
  leadConversionRate: number;        // e.g. 0 to 100 (%)
  promoBoost: number;                // e.g. 0 to 100 (%)
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

export class ScenarioSimulator {
  /**
   * Recalculates forecast fields on the fly using simulated parameter variations.
   */
  static run(baseSnapshot: ForecastSnapshot, input: SimulationInput): SimulationResult {
    const { expectedDailyGrowth, stockReorderDelayDays, leadConversionRate, promoBoost } = input;

    // 1. PROJECT REVENUE FORMULA
    // We adjust projected revenue based on expected daily growth AND promo boost
    // projected_revenue_adjusted = base_revenue * (1 + (daily_growth * days) / 100) * (1 + promo_boost / 100)
    const rangeInDays = baseSnapshot.forecast_range === '7d' ? 7 : baseSnapshot.forecast_range === '14d' ? 14 : 30;
    const compoundGrowthFactor = 1 + (expectedDailyGrowth * rangeInDays) / 100;
    const promoFactor = 1 + (promoBoost / 100);
    const adjustedRevenue = Math.max(0, parseFloat((baseSnapshot.projected_revenue * compoundGrowthFactor * promoFactor).toFixed(2)));

    // Adjust sales forecast chart points accordingly
    const adjustedSalesForecast = baseSnapshot.sales_forecast.map(point => {
      const pointGrowthFactor = 1 + (expectedDailyGrowth * 3) / 100; // soft dampening per point
      const pointPromoFactor = 1 + (promoBoost / 100);
      return {
        ...point,
        projectedSales: Math.max(0, Math.round(point.projectedSales * pointGrowthFactor * pointPromoFactor))
      };
    });

    // 2. INVENTORY STOCKOUT RISK FORMULA
    // Delayed reorders pull reorder safety limits down, accelerating stockout risk
    // We decrease "estimated days until stockout" by the reorder lag, and re-assess risk level
    let criticalStockouts = 0;
    const adjustedInventoryForecast = baseSnapshot.inventory_forecast.map(item => {
      // Days to stockout is reduced as delay stretches because safety stock can block deliveries longer
      const adjustedDays = Math.max(0, item.daysToStockout - Math.floor(stockReorderDelayDays / 3));
      
      let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
      if (adjustedDays <= 1) {
        riskLevel = 'Critical';
        criticalStockouts++;
      } else if (adjustedDays <= 3) {
        riskLevel = 'High';
        criticalStockouts++;
      } else if (adjustedDays <= 7) {
        riskLevel = 'Medium';
      }

      return {
        name: item.name,
        currentStock: item.currentStock,
        daysToStockout: adjustedDays,
        riskLevel
      };
    });

    // 3. LEAD CONVERSIONS EXTRACTOR
    // Re-index leads based on custom slider leadConversionRate (%) rather than baseline probability
    let estimatedConversionsCount = 0;
    const adjustedCrmForecast = baseSnapshot.crm_forecast.map(lead => {
      // Scale lead probability by the custom multiplier
      // If user sets conversion rate slider to 20%, we combine lead baseline probability with it
      const scaleFactor = leadConversionRate / 50; // 50% is standard baseline pivot
      const adjProbability = Math.min(100, Math.max(0, Math.round(lead.probability * scaleFactor)));
      
      if (adjProbability >= 65) {
        estimatedConversionsCount++;
      }

      return {
        leadName: lead.leadName,
        probability: adjProbability,
        estimatedValue: lead.estimatedValue
      };
    });

    // 4. ACTION PRIORITY DETERMINATION
    let actionPriority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (criticalStockouts > 3 || expectedDailyGrowth < -5) {
      actionPriority = 'Critical';
    } else if (criticalStockouts > 0 || leadConversionRate < 20) {
      actionPriority = 'High';
    } else if (expectedDailyGrowth > 10 && leadConversionRate > 50) {
      actionPriority = 'Medium';
    }

    return {
      projectedRevenue: adjustedRevenue,
      stockoutRiskCount: criticalStockouts,
      estimatedConversions: estimatedConversionsCount,
      actionPriority,
      adjustedSalesForecast,
      adjustedInventoryForecast,
      adjustedCrmForecast
    };
  }
}
