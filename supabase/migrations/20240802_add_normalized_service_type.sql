-- Add normalized_service_type column to leads table
ALTER TABLE leads 
ADD COLUMN normalized_service_type TEXT;

-- Create index for better query performance
CREATE INDEX idx_leads_normalized_service_type ON leads(normalized_service_type);

-- Add comment explaining the column
COMMENT ON COLUMN leads.normalized_service_type IS 'Standardized service type derived from original service_type field to eliminate duplicates and variations';