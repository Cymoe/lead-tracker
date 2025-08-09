-- Remove CRM-related fields that belong in Close, not in lead gathering
ALTER TABLE leads 
DROP COLUMN IF EXISTS dm_sent,
DROP COLUMN IF EXISTS dm_response,
DROP COLUMN IF EXISTS called,
DROP COLUMN IF EXISTS call_result,
DROP COLUMN IF EXISTS follow_up_date;

-- Also remove other fields that are too detailed for lead gathering
ALTER TABLE leads 
DROP COLUMN IF EXISTS service_areas,
DROP COLUMN IF EXISTS price_info,
DROP COLUMN IF EXISTS ad_call_to_action,
DROP COLUMN IF EXISTS ad_start_date;