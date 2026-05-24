-- Phase 5: Business Memory System (RAG) with pgvector

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.business_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metric_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(768),
  source TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  importance_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memory_retrieval_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  matched_memory_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_business_memories_period_type
  ON public.business_memories(business_id, memory_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_business_memories_business_id ON public.business_memories(business_id);
CREATE INDEX IF NOT EXISTS idx_business_memories_memory_type ON public.business_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_business_memories_created_at ON public.business_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_memories_period_start ON public.business_memories(period_start);
CREATE INDEX IF NOT EXISTS idx_business_memories_period_end ON public.business_memories(period_end);
CREATE INDEX IF NOT EXISTS idx_business_memories_embedding_ivfflat
  ON public.business_memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_memory_retrieval_logs_business_id ON public.memory_retrieval_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_memory_retrieval_logs_created_at ON public.memory_retrieval_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.match_business_memories(
  p_business_id UUID,
  p_query_embedding vector(768),
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  title TEXT,
  content TEXT,
  period_start DATE,
  period_end DATE,
  importance_score NUMERIC,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    bm.id,
    bm.memory_type,
    bm.title,
    bm.content,
    bm.period_start,
    bm.period_end,
    bm.importance_score,
    bm.created_at,
    1 - (bm.embedding <=> p_query_embedding) AS similarity
  FROM public.business_memories bm
  WHERE bm.business_id = p_business_id
    AND bm.embedding IS NOT NULL
  ORDER BY bm.embedding <=> p_query_embedding
  LIMIT LEAST(GREATEST(p_match_count, 1), 10);
$$;

ALTER TABLE public.business_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.memory_retrieval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_retrieval_logs FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_memories, public.memory_retrieval_logs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_memories, public.memory_retrieval_logs TO authenticated;

DROP POLICY IF EXISTS business_memories_select_member ON public.business_memories;
CREATE POLICY business_memories_select_member ON public.business_memories
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_memories_insert_member ON public.business_memories;
CREATE POLICY business_memories_insert_member ON public.business_memories
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_memories_update_member ON public.business_memories;
CREATE POLICY business_memories_update_member ON public.business_memories
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS business_memories_delete_owner ON public.business_memories;
CREATE POLICY business_memories_delete_owner ON public.business_memories
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));

DROP POLICY IF EXISTS memory_retrieval_logs_select_member ON public.memory_retrieval_logs;
CREATE POLICY memory_retrieval_logs_select_member ON public.memory_retrieval_logs
FOR SELECT TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS memory_retrieval_logs_insert_member ON public.memory_retrieval_logs;
CREATE POLICY memory_retrieval_logs_insert_member ON public.memory_retrieval_logs
FOR INSERT TO authenticated
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS memory_retrieval_logs_update_member ON public.memory_retrieval_logs;
CREATE POLICY memory_retrieval_logs_update_member ON public.memory_retrieval_logs
FOR UPDATE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_member(business_id))
WITH CHECK (business_id IS NOT NULL AND public.is_business_member(business_id));

DROP POLICY IF EXISTS memory_retrieval_logs_delete_owner ON public.memory_retrieval_logs;
CREATE POLICY memory_retrieval_logs_delete_owner ON public.memory_retrieval_logs
FOR DELETE TO authenticated
USING (business_id IS NOT NULL AND public.is_business_owner(business_id));
