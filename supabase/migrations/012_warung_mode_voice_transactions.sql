-- Phase 6: Warung Mode voice transactions

CREATE TABLE IF NOT EXISTS public.voice_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'warung_mode',
  transcript TEXT,
  items JSONB NOT NULL,
  total NUMERIC,
  validation_status TEXT NOT NULL DEFAULT 'partial',
  idempotency_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_voice_transactions_business_idempotency
  ON public.voice_transactions(business_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voice_transactions_business_id ON public.voice_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_voice_transactions_created_at ON public.voice_transactions(created_at DESC);

ALTER TABLE public.voice_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_transactions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.voice_transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_transactions TO authenticated;

DROP POLICY IF EXISTS voice_transactions_select_member ON public.voice_transactions;
CREATE POLICY voice_transactions_select_member ON public.voice_transactions
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS voice_transactions_insert_member ON public.voice_transactions;
CREATE POLICY voice_transactions_insert_member ON public.voice_transactions
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS voice_transactions_update_member ON public.voice_transactions;
CREATE POLICY voice_transactions_update_member ON public.voice_transactions
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS voice_transactions_delete_owner ON public.voice_transactions;
CREATE POLICY voice_transactions_delete_owner ON public.voice_transactions
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));
