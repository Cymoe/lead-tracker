-- Add source column to import_operations table
ALTER TABLE import_operations 
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- Update existing rows to have a source based on operation_type
UPDATE import_operations 
SET source = CASE 
  WHEN operation_type = 'csv_import' THEN 'CSV Import'
  WHEN operation_type = 'google_maps_import' THEN 'Google Maps'
  WHEN operation_type = 'bulk_import' THEN 'Instagram Manual'
  ELSE 'Instagram Manual'
END
WHERE source IS NULL;

-- Make source column NOT NULL after updating existing rows
ALTER TABLE import_operations 
ALTER COLUMN source SET NOT NULL;

-- Add check constraint to ensure source matches expected values
ALTER TABLE import_operations 
ADD CONSTRAINT check_source_values CHECK (
  source IN ('FB Ad Library', 'Instagram Manual', 'Google Maps', 'CSV Import')
);