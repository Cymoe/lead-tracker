-- Update the lead_source check constraint to include 'CSV Import'
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_lead_source_check;

ALTER TABLE leads 
ADD CONSTRAINT leads_lead_source_check 
CHECK (lead_source IN ('FB Ad Library', 'Instagram Manual', 'Google Maps', 'CSV Import'));