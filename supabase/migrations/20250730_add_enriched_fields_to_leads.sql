-- Add enriched data fields to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review_count integer CHECK (review_count >= 0);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads(rating);
CREATE INDEX IF NOT EXISTS idx_leads_review_count ON leads(review_count);

-- Add comment to document the new fields
COMMENT ON COLUMN leads.email IS 'Contact email for the business';
COMMENT ON COLUMN leads.address IS 'Full street address of the business';
COMMENT ON COLUMN leads.state IS 'State or province of the business';
COMMENT ON COLUMN leads.rating IS 'Average rating from Google reviews (0-5 stars)';
COMMENT ON COLUMN leads.review_count IS 'Total number of Google reviews';