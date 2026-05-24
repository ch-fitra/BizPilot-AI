-- 008_rls_multi_tenant_security.sql
-- PostgreSQL-level tenant isolation for BizPilot AI.
-- This secures the existing schema; it does not create new product/ERP tables.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = target_business_id
      AND bm.user_id = public.current_app_user_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = target_business_id
      AND bm.user_id = public.current_app_user_id()
      AND bm.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner(UUID) TO authenticated;

-- Enable and force RLS on all existing tenant/user tables.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_histories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nota_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_scans FORCE ROW LEVEL SECURITY;

-- Remove broad anonymous table access. Authenticated access is still constrained by RLS.
REVOKE ALL ON
  public.user_profiles,
  public.business_profiles,
  public.business_members,
  public.analysis_histories,
  public.business_settings,
  public.business_chat_messages,
  public.crm_leads,
  public.notifications,
  public.automation_rules,
  public.whatsapp_logs,
  public.forecast_snapshots,
  public.cashflow_entries,
  public.nota_scans
FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.user_profiles,
  public.business_profiles,
  public.business_members,
  public.analysis_histories,
  public.business_settings,
  public.business_chat_messages,
  public.crm_leads,
  public.notifications,
  public.automation_rules,
  public.whatsapp_logs,
  public.forecast_snapshots,
  public.cashflow_entries,
  public.nota_scans
TO authenticated;

-- RLS predicates and backend tenant-scoped queries rely on these indexes as data grows.
CREATE INDEX IF NOT EXISTS idx_analysis_histories_business_id ON public.analysis_histories(business_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON public.business_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_chat_messages_business_id ON public.business_chat_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_business_id ON public.crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON public.notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_business_id ON public.automation_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_business_id ON public.whatsapp_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_business_id ON public.forecast_snapshots(business_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_business_id ON public.cashflow_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_nota_scans_business_id ON public.nota_scans(business_id);

-- user_profiles: users can see and update only themselves.
DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
CREATE POLICY user_profiles_select_own
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = public.current_app_user_id());

DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = public.current_app_user_id());

DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = public.current_app_user_id())
WITH CHECK (id = public.current_app_user_id());

DROP POLICY IF EXISTS user_profiles_delete_own ON public.user_profiles;
CREATE POLICY user_profiles_delete_own
ON public.user_profiles
FOR DELETE
TO authenticated
USING (id = public.current_app_user_id());

-- business_profiles: visible/mutable only to assigned members; destructive access is owner-only.
DROP POLICY IF EXISTS business_profiles_select_member ON public.business_profiles;
CREATE POLICY business_profiles_select_member
ON public.business_profiles
FOR SELECT
TO authenticated
USING (public.is_business_member(id));

DROP POLICY IF EXISTS business_profiles_insert_authenticated ON public.business_profiles;
CREATE POLICY business_profiles_insert_authenticated
ON public.business_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.current_app_user_id() IS NOT NULL);

DROP POLICY IF EXISTS business_profiles_update_owner ON public.business_profiles;
CREATE POLICY business_profiles_update_owner
ON public.business_profiles
FOR UPDATE
TO authenticated
USING (public.is_business_owner(id))
WITH CHECK (public.is_business_owner(id));

DROP POLICY IF EXISTS business_profiles_delete_owner ON public.business_profiles;
CREATE POLICY business_profiles_delete_owner
ON public.business_profiles
FOR DELETE
TO authenticated
USING (public.is_business_owner(id));

-- business_members: members can read team list; only owners can mutate membership.
DROP POLICY IF EXISTS business_members_select_member ON public.business_members;
CREATE POLICY business_members_select_member
ON public.business_members
FOR SELECT
TO authenticated
USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS business_members_insert_owner ON public.business_members;
CREATE POLICY business_members_insert_owner
ON public.business_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_members_update_owner ON public.business_members;
CREATE POLICY business_members_update_owner
ON public.business_members
FOR UPDATE
TO authenticated
USING (public.is_business_owner(business_id))
WITH CHECK (public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_members_delete_owner ON public.business_members;
CREATE POLICY business_members_delete_owner
ON public.business_members
FOR DELETE
TO authenticated
USING (public.is_business_owner(business_id));

-- Shared helper pattern for all business_id scoped data.
DROP POLICY IF EXISTS analysis_histories_select_member ON public.analysis_histories;
CREATE POLICY analysis_histories_select_member ON public.analysis_histories
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS analysis_histories_insert_member ON public.analysis_histories;
CREATE POLICY analysis_histories_insert_member ON public.analysis_histories
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS analysis_histories_update_member ON public.analysis_histories;
CREATE POLICY analysis_histories_update_member ON public.analysis_histories
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS analysis_histories_delete_owner ON public.analysis_histories;
CREATE POLICY analysis_histories_delete_owner ON public.analysis_histories
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_settings_select_member ON public.business_settings;
CREATE POLICY business_settings_select_member ON public.business_settings
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_settings_insert_owner ON public.business_settings;
CREATE POLICY business_settings_insert_owner ON public.business_settings
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_settings_update_owner ON public.business_settings;
CREATE POLICY business_settings_update_owner ON public.business_settings
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_settings_delete_owner ON public.business_settings;
CREATE POLICY business_settings_delete_owner ON public.business_settings
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS business_chat_messages_select_member ON public.business_chat_messages;
CREATE POLICY business_chat_messages_select_member ON public.business_chat_messages
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_chat_messages_insert_member ON public.business_chat_messages;
CREATE POLICY business_chat_messages_insert_member ON public.business_chat_messages
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_chat_messages_update_member ON public.business_chat_messages;
CREATE POLICY business_chat_messages_update_member ON public.business_chat_messages
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_chat_messages_delete_owner ON public.business_chat_messages;
CREATE POLICY business_chat_messages_delete_owner ON public.business_chat_messages
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS crm_leads_select_member ON public.crm_leads;
CREATE POLICY crm_leads_select_member ON public.crm_leads
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS crm_leads_insert_member ON public.crm_leads;
CREATE POLICY crm_leads_insert_member ON public.crm_leads
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS crm_leads_update_member ON public.crm_leads;
CREATE POLICY crm_leads_update_member ON public.crm_leads
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS crm_leads_delete_owner ON public.crm_leads;
CREATE POLICY crm_leads_delete_owner ON public.crm_leads
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS notifications_select_member ON public.notifications;
CREATE POLICY notifications_select_member ON public.notifications
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS notifications_insert_member ON public.notifications;
CREATE POLICY notifications_insert_member ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS notifications_update_member ON public.notifications;
CREATE POLICY notifications_update_member ON public.notifications
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS notifications_delete_owner ON public.notifications;
CREATE POLICY notifications_delete_owner ON public.notifications
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS automation_rules_select_member ON public.automation_rules;
CREATE POLICY automation_rules_select_member ON public.automation_rules
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS automation_rules_insert_owner ON public.automation_rules;
CREATE POLICY automation_rules_insert_owner ON public.automation_rules
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS automation_rules_update_owner ON public.automation_rules;
CREATE POLICY automation_rules_update_owner ON public.automation_rules
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS automation_rules_delete_owner ON public.automation_rules;
CREATE POLICY automation_rules_delete_owner ON public.automation_rules
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS whatsapp_logs_select_member ON public.whatsapp_logs;
CREATE POLICY whatsapp_logs_select_member ON public.whatsapp_logs
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS whatsapp_logs_insert_member ON public.whatsapp_logs;
CREATE POLICY whatsapp_logs_insert_member ON public.whatsapp_logs
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS whatsapp_logs_update_owner ON public.whatsapp_logs;
CREATE POLICY whatsapp_logs_update_owner ON public.whatsapp_logs
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS whatsapp_logs_delete_owner ON public.whatsapp_logs;
CREATE POLICY whatsapp_logs_delete_owner ON public.whatsapp_logs
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS forecast_snapshots_select_member ON public.forecast_snapshots;
CREATE POLICY forecast_snapshots_select_member ON public.forecast_snapshots
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS forecast_snapshots_insert_member ON public.forecast_snapshots;
CREATE POLICY forecast_snapshots_insert_member ON public.forecast_snapshots
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS forecast_snapshots_update_member ON public.forecast_snapshots;
CREATE POLICY forecast_snapshots_update_member ON public.forecast_snapshots
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS forecast_snapshots_delete_owner ON public.forecast_snapshots;
CREATE POLICY forecast_snapshots_delete_owner ON public.forecast_snapshots
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS cashflow_entries_select_member ON public.cashflow_entries;
CREATE POLICY cashflow_entries_select_member ON public.cashflow_entries
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS cashflow_entries_insert_member ON public.cashflow_entries;
CREATE POLICY cashflow_entries_insert_member ON public.cashflow_entries
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS cashflow_entries_update_member ON public.cashflow_entries;
CREATE POLICY cashflow_entries_update_member ON public.cashflow_entries
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS cashflow_entries_delete_owner ON public.cashflow_entries;
CREATE POLICY cashflow_entries_delete_owner ON public.cashflow_entries
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS nota_scans_select_member ON public.nota_scans;
CREATE POLICY nota_scans_select_member ON public.nota_scans
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS nota_scans_insert_member ON public.nota_scans;
CREATE POLICY nota_scans_insert_member ON public.nota_scans
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS nota_scans_update_member ON public.nota_scans;
CREATE POLICY nota_scans_update_member ON public.nota_scans
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS nota_scans_delete_owner ON public.nota_scans;
CREATE POLICY nota_scans_delete_owner ON public.nota_scans
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));
