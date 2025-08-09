-- Create market_coverage table to track systematic coverage progress
CREATE TABLE IF NOT EXISTS public.market_coverage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL, -- References the dynamic market ID (e.g., 'state-TX', 'city-Amarillo')
  market_name TEXT NOT NULL,
  market_type TEXT NOT NULL CHECK (market_type IN ('state', 'city', 'metro')),
  
  -- Phase 1: Google Maps Coverage
  phase_1_searches JSONB DEFAULT '[]'::jsonb, -- Array of completed search queries
  phase_1_service_types JSONB DEFAULT '[]'::jsonb, -- Array of service types covered
  phase_1_import_ids UUID[] DEFAULT '{}', -- Links to import_operations
  phase_1_lead_count INTEGER DEFAULT 0,
  phase_1_completed_at TIMESTAMPTZ,
  
  -- Phase 2: Facebook Ads Coverage  
  phase_2_searches JSONB DEFAULT '[]'::jsonb, -- Array of FB search queries
  phase_2_import_ids UUID[] DEFAULT '{}',
  phase_2_lead_count INTEGER DEFAULT 0,
  phase_2_completed_at TIMESTAMPTZ,
  
  -- Phase 3: Instagram Manual Coverage
  phase_3_handles JSONB DEFAULT '[]'::jsonb, -- Array of Instagram handles added
  phase_3_import_ids UUID[] DEFAULT '{}',
  phase_3_lead_count INTEGER DEFAULT 0,
  phase_3_completed_at TIMESTAMPTZ,
  
  -- Overall metrics
  total_lead_count INTEGER GENERATED ALWAYS AS (
    phase_1_lead_count + phase_2_lead_count + phase_3_lead_count
  ) STORED,
  coverage_percentage DECIMAL(5,2) DEFAULT 0, -- Estimated market coverage
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique market coverage per user
  UNIQUE(user_id, market_id)
);

-- Create indexes for performance
CREATE INDEX idx_market_coverage_user_market ON public.market_coverage(user_id, market_id);
CREATE INDEX idx_market_coverage_updated ON public.market_coverage(updated_at DESC);

-- Add RLS policies
ALTER TABLE public.market_coverage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own market coverage
CREATE POLICY "Users can view own market coverage" ON public.market_coverage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own market coverage
CREATE POLICY "Users can insert own market coverage" ON public.market_coverage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own market coverage
CREATE POLICY "Users can update own market coverage" ON public.market_coverage
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own market coverage
CREATE POLICY "Users can delete own market coverage" ON public.market_coverage
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_coverage_updated_at
  BEFORE UPDATE ON public.market_coverage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add phase tracking to import_operations metadata
-- This is done through the existing metadata JSONB field
-- Example metadata structure:
-- {
--   "phase": 1,
--   "market_id": "city-Amarillo",
--   "market_name": "Amarillo, TX",
--   "parent_phase_id": null, -- UUID of Phase 1 import for Phase 2/3
--   "coverage_context": {
--     "service_type": "Patio builder",
--     "search_query": "Patio builder in Amarillo, TX"
--   }
-- }

-- Function to update market coverage when import operation is created
CREATE OR REPLACE FUNCTION update_market_coverage_on_import()
RETURNS TRIGGER AS $$
DECLARE
  v_phase INTEGER;
  v_market_id TEXT;
  v_market_name TEXT;
  v_market_type TEXT;
  v_service_type TEXT;
  v_search_query TEXT;
BEGIN
  -- Extract phase and market info from metadata
  v_phase := (NEW.metadata->>'phase')::INTEGER;
  v_market_id := NEW.metadata->>'market_id';
  v_market_name := NEW.metadata->>'market_name';
  
  -- Only process if phase and market info exists
  IF v_phase IS NOT NULL AND v_market_id IS NOT NULL THEN
    -- Determine market type from market_id
    v_market_type := CASE 
      WHEN v_market_id LIKE 'state-%' THEN 'state'
      WHEN v_market_id LIKE 'metro-%' THEN 'metro'
      ELSE 'city'
    END;
    
    -- Extract additional context
    v_service_type := NEW.metadata->'coverage_context'->>'service_type';
    v_search_query := NEW.metadata->'coverage_context'->>'search_query';
    
    -- Insert or update market coverage
    INSERT INTO public.market_coverage (
      user_id, market_id, market_name, market_type
    ) VALUES (
      NEW.user_id, v_market_id, v_market_name, v_market_type
    )
    ON CONFLICT (user_id, market_id) DO NOTHING;
    
    -- Update the appropriate phase data
    IF v_phase = 1 THEN
      UPDATE public.market_coverage
      SET 
        phase_1_searches = CASE 
          WHEN v_search_query IS NOT NULL 
          THEN jsonb_insert(phase_1_searches, '{-1}', to_jsonb(v_search_query), true)
          ELSE phase_1_searches
        END,
        phase_1_service_types = CASE
          WHEN v_service_type IS NOT NULL 
          AND NOT phase_1_service_types @> to_jsonb(v_service_type)
          THEN phase_1_service_types || to_jsonb(v_service_type)
          ELSE phase_1_service_types
        END,
        phase_1_import_ids = array_append(phase_1_import_ids, NEW.id),
        phase_1_lead_count = phase_1_lead_count + NEW.lead_count
      WHERE user_id = NEW.user_id AND market_id = v_market_id;
      
    ELSIF v_phase = 2 THEN
      UPDATE public.market_coverage
      SET 
        phase_2_searches = CASE 
          WHEN v_search_query IS NOT NULL 
          THEN jsonb_insert(phase_2_searches, '{-1}', to_jsonb(v_search_query), true)
          ELSE phase_2_searches
        END,
        phase_2_import_ids = array_append(phase_2_import_ids, NEW.id),
        phase_2_lead_count = phase_2_lead_count + NEW.lead_count
      WHERE user_id = NEW.user_id AND market_id = v_market_id;
      
    ELSIF v_phase = 3 THEN
      UPDATE public.market_coverage
      SET 
        phase_3_import_ids = array_append(phase_3_import_ids, NEW.id),
        phase_3_lead_count = phase_3_lead_count + NEW.lead_count
      WHERE user_id = NEW.user_id AND market_id = v_market_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for import operations
CREATE TRIGGER update_market_coverage_after_import
  AFTER INSERT ON public.import_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_market_coverage_on_import();

-- Add comment for documentation
COMMENT ON TABLE public.market_coverage IS 'Tracks systematic market coverage progress across three phases: Google Maps, Facebook Ads, and Instagram Manual';