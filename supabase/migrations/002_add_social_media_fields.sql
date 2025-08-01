-- Add new fields for enhanced lead tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email2 TEXT,
ADD COLUMN IF NOT EXISTS email3 TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS full_address TEXT,
ADD COLUMN IF NOT EXISTS search_query TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_facebook_url ON public.leads(facebook_url) WHERE facebook_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url ON public.leads(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_twitter_url ON public.leads(twitter_url) WHERE twitter_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_search_query ON public.leads(search_query) WHERE search_query IS NOT NULL;

-- Update the RLS policies to include new fields (they're already covered by existing policies)
-- No changes needed as existing policies work on entire rows

-- Add comment documentation
COMMENT ON COLUMN public.leads.email2 IS 'Secondary email address';
COMMENT ON COLUMN public.leads.email3 IS 'Tertiary email address';
COMMENT ON COLUMN public.leads.facebook_url IS 'Facebook page or profile URL';
COMMENT ON COLUMN public.leads.linkedin_url IS 'LinkedIn company or profile URL';
COMMENT ON COLUMN public.leads.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN public.leads.full_address IS 'Complete address as imported';
COMMENT ON COLUMN public.leads.search_query IS 'Original search query used to find this lead'; 