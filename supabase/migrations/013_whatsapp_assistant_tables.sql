-- Phase 7: WhatsApp Assistant mapping and pending confirmation flow

ALTER TABLE public.whatsapp_logs
  ADD COLUMN IF NOT EXISTS phone_number_hash TEXT,
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS message_text TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_whatsapp_logs_provider_message_id
  ON public.whatsapp_logs(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.whatsapp_business_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  phone_number_hash TEXT NOT NULL,
  phone_last4 TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_whatsapp_business_links_active_hash
  ON public.whatsapp_business_links(business_id, phone_number_hash);
CREATE INDEX IF NOT EXISTS idx_whatsapp_business_links_business_id ON public.whatsapp_business_links(business_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_pending_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  phone_number_hash TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_pending_actions_business_id ON public.whatsapp_pending_actions(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_pending_actions_hash ON public.whatsapp_pending_actions(phone_number_hash);
CREATE INDEX IF NOT EXISTS idx_whatsapp_pending_actions_expires_at ON public.whatsapp_pending_actions(expires_at);

ALTER TABLE public.whatsapp_business_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_business_links FORCE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_pending_actions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.whatsapp_business_links, public.whatsapp_pending_actions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_business_links, public.whatsapp_pending_actions TO authenticated;

DROP POLICY IF EXISTS whatsapp_business_links_select_member ON public.whatsapp_business_links;
CREATE POLICY whatsapp_business_links_select_member ON public.whatsapp_business_links
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));
DROP POLICY IF EXISTS whatsapp_business_links_insert_owner ON public.whatsapp_business_links;
CREATE POLICY whatsapp_business_links_insert_owner ON public.whatsapp_business_links
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));
DROP POLICY IF EXISTS whatsapp_business_links_update_owner ON public.whatsapp_business_links;
CREATE POLICY whatsapp_business_links_update_owner ON public.whatsapp_business_links
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_owner(business_id));
DROP POLICY IF EXISTS whatsapp_business_links_delete_owner ON public.whatsapp_business_links;
CREATE POLICY whatsapp_business_links_delete_owner ON public.whatsapp_business_links
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS whatsapp_pending_actions_select_member ON public.whatsapp_pending_actions;
CREATE POLICY whatsapp_pending_actions_select_member ON public.whatsapp_pending_actions
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));
DROP POLICY IF EXISTS whatsapp_pending_actions_insert_member ON public.whatsapp_pending_actions;
CREATE POLICY whatsapp_pending_actions_insert_member ON public.whatsapp_pending_actions
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));
DROP POLICY IF EXISTS whatsapp_pending_actions_update_member ON public.whatsapp_pending_actions;
CREATE POLICY whatsapp_pending_actions_update_member ON public.whatsapp_pending_actions
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));
DROP POLICY IF EXISTS whatsapp_pending_actions_delete_owner ON public.whatsapp_pending_actions;
CREATE POLICY whatsapp_pending_actions_delete_owner ON public.whatsapp_pending_actions
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));
