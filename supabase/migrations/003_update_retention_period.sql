-- Update retention period from 48 hours to 7 days
CREATE OR REPLACE FUNCTION cleanup_expired_search_results()
RETURNS void AS $$
BEGIN
  DELETE FROM apify_search_results
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add index on created_at for faster cleanup
CREATE INDEX IF NOT EXISTS idx_apify_search_results_created_at 
ON apify_search_results(created_at);

-- Add additional metadata columns for enhanced search history
ALTER TABLE apify_search_results
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS contacts_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS high_quality_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS search_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS apify_run_id TEXT;

-- Add column for tracking imported leads
ALTER TABLE apify_search_results
ADD COLUMN IF NOT EXISTS imported_lead_ids TEXT[] DEFAULT '{}';