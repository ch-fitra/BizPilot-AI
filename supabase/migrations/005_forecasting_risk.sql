-- 005_forecasting_risk.sql
-- Migration schema for Phase 8 Predictive Forecasting & Business Risk AI

CREATE TABLE IF NOT EXISTS forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  forecast_range TEXT NOT NULL, -- e.g. '7d', '14d', '30d'
  projected_revenue NUMERIC,
  projected_transactions INTEGER,
  risk_level TEXT, -- Low, Medium, High, Critical
  confidence_level TEXT, -- Low, Medium, High
  sales_forecast JSONB, -- Projected revenue trends
  inventory_forecast JSONB, -- Stockout probabilities
  crm_forecast JSONB, -- Opportunity closing rates
  risk_radar JSONB, -- Multi-dimensional threat vectors
  ai_recommendations JSONB, -- Guided direct tasks
  scenario_config JSONB, -- Last simulation parameters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index search optimization
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_business ON forecast_snapshots(business_id);
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_range ON forecast_snapshots(forecast_range);
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_created ON forecast_snapshots(created_at DESC);
