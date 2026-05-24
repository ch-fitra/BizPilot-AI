-- Phase 3: strict OCR extraction metadata and dedupe support

ALTER TABLE public.nota_scans
  ADD COLUMN IF NOT EXISTS raw_extraction_json JSONB,
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'partial' CHECK (validation_status IN ('valid', 'partial', 'invalid')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  ADD COLUMN IF NOT EXISTS warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_hash TEXT,
  ADD COLUMN IF NOT EXISTS extraction_version TEXT;

CREATE INDEX IF NOT EXISTS idx_nota_scans_image_hash ON public.nota_scans(image_hash);
CREATE UNIQUE INDEX IF NOT EXISTS uq_nota_scans_business_id_image_hash
  ON public.nota_scans(business_id, image_hash)
  WHERE image_hash IS NOT NULL;
