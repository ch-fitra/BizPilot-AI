-- Phase 4: Passive Intelligence Engine tables

CREATE TABLE IF NOT EXISTS public.business_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'passive_intelligence',
  status TEXT NOT NULL DEFAULT 'active',
  dedupe_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.business_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  revenue NUMERIC NOT NULL DEFAULT 0,
  expenses NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  transaction_count INT NOT NULL DEFAULT 0,
  average_transaction_value NUMERIC NOT NULL DEFAULT 0,
  top_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, metric_date)
);

CREATE TABLE IF NOT EXISTS public.insight_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL,
  run_status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_business_alerts_business_id ON public.business_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_business_alerts_status ON public.business_alerts(status);
CREATE INDEX IF NOT EXISTS idx_business_alerts_created_at ON public.business_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_alerts_dedupe_key ON public.business_alerts(dedupe_key);

CREATE INDEX IF NOT EXISTS idx_business_daily_metrics_business_id ON public.business_daily_metrics(business_id);
CREATE INDEX IF NOT EXISTS idx_business_daily_metrics_metric_date ON public.business_daily_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_insight_runs_business_id ON public.insight_runs(business_id);
CREATE INDEX IF NOT EXISTS idx_insight_runs_started_at ON public.insight_runs(started_at DESC);

CREATE OR REPLACE TRIGGER update_business_daily_metrics_modtime
  BEFORE UPDATE ON public.business_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.business_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_alerts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_daily_metrics FORCE ROW LEVEL SECURITY;
ALTER TABLE public.insight_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_runs FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_alerts, public.business_daily_metrics, public.insight_runs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_alerts, public.business_daily_metrics, public.insight_runs TO authenticated;

DROP POLICY IF EXISTS business_alerts_select_member ON public.business_alerts;
CREATE POLICY business_alerts_select_member ON public.business_alerts
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_alerts_insert_member ON public.business_alerts;
CREATE POLICY business_alerts_insert_member ON public.business_alerts
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_alerts_update_member ON public.business_alerts;
CREATE POLICY business_alerts_update_member ON public.business_alerts
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_alerts_delete_owner ON public.business_alerts;
CREATE POLICY business_alerts_delete_owner ON public.business_alerts
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_daily_metrics_select_member ON public.business_daily_metrics;
CREATE POLICY business_daily_metrics_select_member ON public.business_daily_metrics
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_daily_metrics_insert_member ON public.business_daily_metrics;
CREATE POLICY business_daily_metrics_insert_member ON public.business_daily_metrics
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_daily_metrics_update_member ON public.business_daily_metrics;
CREATE POLICY business_daily_metrics_update_member ON public.business_daily_metrics
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_daily_metrics_delete_owner ON public.business_daily_metrics;
CREATE POLICY business_daily_metrics_delete_owner ON public.business_daily_metrics
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS insight_runs_select_member ON public.insight_runs;
CREATE POLICY insight_runs_select_member ON public.insight_runs
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS insight_runs_insert_member ON public.insight_runs;
CREATE POLICY insight_runs_insert_member ON public.insight_runs
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS insight_runs_update_member ON public.insight_runs;
CREATE POLICY insight_runs_update_member ON public.insight_runs
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS insight_runs_delete_owner ON public.insight_runs;
CREATE POLICY insight_runs_delete_owner ON public.insight_runs
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));
