-- Add import tracking fields to apify_search_results
ALTER TABLE apify_search_results 
ADD COLUMN apify_run_id VARCHAR(255),
ADD COLUMN import_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN import_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN import_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN leads_imported INTEGER DEFAULT 0,
ADD COLUMN import_error TEXT,
ADD COLUMN import_operation_id UUID REFERENCES import_operations(id);

-- Add unique constraint to prevent duplicate imports from same Apify run
ALTER TABLE apify_search_results
ADD CONSTRAINT unique_apify_run_id UNIQUE (user_id, apify_run_id);

-- Add index for faster lookups
CREATE INDEX idx_apify_search_results_status ON apify_search_results(user_id, import_status);
CREATE INDEX idx_apify_search_results_run_id ON apify_search_results(apify_run_id);

-- Add comment
COMMENT ON COLUMN apify_search_results.import_status IS 'Status of import: pending, processing, completed, failed, cancelled';