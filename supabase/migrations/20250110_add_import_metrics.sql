-- Add import metrics columns to market_coverage table for saturation tracking
ALTER TABLE public.market_coverage
ADD COLUMN IF NOT EXISTS phase_1_import_metrics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS phase_2_import_metrics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS phase_3_import_metrics JSONB DEFAULT '[]'::jsonb;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_market_coverage_phase_1_metrics ON public.market_coverage USING GIN (phase_1_import_metrics);
CREATE INDEX IF NOT EXISTS idx_market_coverage_phase_2_metrics ON public.market_coverage USING GIN (phase_2_import_metrics);
CREATE INDEX IF NOT EXISTS idx_market_coverage_phase_3_metrics ON public.market_coverage USING GIN (phase_3_import_metrics);

-- Add comment explaining the structure
COMMENT ON COLUMN public.market_coverage.phase_1_import_metrics IS 'Array of import metrics: {import_id, timestamp, total_found, duplicates, imported, service_type, search_query}';
COMMENT ON COLUMN public.market_coverage.phase_2_import_metrics IS 'Array of import metrics: {import_id, timestamp, total_found, duplicates, imported, service_type, search_query}';
COMMENT ON COLUMN public.market_coverage.phase_3_import_metrics IS 'Array of import metrics: {import_id, timestamp, total_found, duplicates, imported, service_type, search_query}';