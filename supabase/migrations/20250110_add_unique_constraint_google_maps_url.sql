-- Add unique constraint on google_maps_url per user to prevent duplicates
-- This ensures each user can only have one lead per Google Maps location

-- First, let's check for any existing duplicates and handle them
-- This query will show duplicate google_maps_urls for each user
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, google_maps_url, COUNT(*) as count
        FROM leads
        WHERE google_maps_url IS NOT NULL
        GROUP BY user_id, google_maps_url
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate google_maps_url entries. Keeping the most recent entry for each duplicate.', duplicate_count;
        
        -- Delete older duplicates, keeping the most recent one
        DELETE FROM leads
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY user_id, google_maps_url ORDER BY created_at DESC) as rn
                FROM leads
                WHERE google_maps_url IS NOT NULL
            ) t
            WHERE t.rn > 1
        );
        
        RAISE NOTICE 'Removed duplicate entries.';
    END IF;
END $$;

-- Now add the unique constraint
ALTER TABLE leads 
ADD CONSTRAINT unique_google_maps_url_per_user 
UNIQUE (user_id, google_maps_url);

-- Add an index to improve performance of duplicate checks
CREATE INDEX IF NOT EXISTS idx_leads_google_maps_url 
ON leads(google_maps_url) 
WHERE google_maps_url IS NOT NULL;

-- Add a comment to document this constraint
COMMENT ON CONSTRAINT unique_google_maps_url_per_user ON leads IS 
'Ensures each user can only have one lead per Google Maps URL, preventing duplicate imports of the same location';