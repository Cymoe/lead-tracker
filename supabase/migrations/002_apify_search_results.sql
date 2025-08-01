-- Create table for storing Apify search results temporarily
CREATE TABLE public.apify_search_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_type TEXT CHECK (search_type IN ('google_maps', 'facebook_ads')) NOT NULL,
    search_params JSONB NOT NULL, -- Store search parameters (service_type, city, radius, etc.)
    results JSONB NOT NULL, -- Store the raw results array
    result_count INTEGER NOT NULL,
    search_mode TEXT, -- 'standard' or 'apify'
    cost_estimate JSONB, -- Store cost breakdown if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL -- Auto-expire after 48 hours
);

-- Create index for efficient queries
CREATE INDEX idx_apify_search_results_user_id ON public.apify_search_results(user_id);
CREATE INDEX idx_apify_search_results_created_at ON public.apify_search_results(created_at DESC);
CREATE INDEX idx_apify_search_results_expires_at ON public.apify_search_results(expires_at);
CREATE INDEX idx_apify_search_results_search_type ON public.apify_search_results(search_type);

-- Enable RLS
ALTER TABLE public.apify_search_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own search results" ON public.apify_search_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search results" ON public.apify_search_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search results" ON public.apify_search_results
    FOR DELETE USING (auth.uid() = user_id);

-- Function to clean up expired search results
CREATE OR REPLACE FUNCTION public.cleanup_expired_search_results()
RETURNS void AS $$
BEGIN
    DELETE FROM public.apify_search_results 
    WHERE expires_at < TIMEZONE('utc'::text, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- This would need to be set up separately in Supabase dashboard
-- SELECT cron.schedule('cleanup-search-results', '0 * * * *', 'SELECT public.cleanup_expired_search_results();');