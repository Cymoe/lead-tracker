-- Add missing columns to the leads table
-- This migration adds email2, email3, facebook_url, linkedin_url, and twitter_url columns

-- Add email2 column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email2 TEXT;

-- Add email3 column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email3 TEXT;

-- Add facebook_url column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Add linkedin_url column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add twitter_url column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN public.leads.email2 IS 'Secondary email address for the lead';
COMMENT ON COLUMN public.leads.email3 IS 'Tertiary email address for the lead';
COMMENT ON COLUMN public.leads.facebook_url IS 'Facebook page or profile URL';
COMMENT ON COLUMN public.leads.linkedin_url IS 'LinkedIn company or profile URL';
COMMENT ON COLUMN public.leads.twitter_url IS 'Twitter/X profile URL';