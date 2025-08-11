import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { runId, searchQuery, city } = await request.json();
    
    // Create client AFTER reading body to avoid stream issues
    const supabase = await createClient();

    // Validate inputs
    if (!runId || !searchQuery || !city) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Run ID, Search Query, and City are all required'
      }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse city and state from the city input
    const cityParts = city.split(',').map((p: string) => p.trim());
    const cityName = cityParts[0] || '';
    let stateName = '';
    
    // Only extract state if it's a valid 2-letter state code
    if (cityParts[1]) {
      const potentialState = cityParts[1].replace(/[^A-Z]/gi, '').toUpperCase();
      // Check if it's a valid 2-letter state code
      if (potentialState.length === 2) {
        // List of valid US state codes
        const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                           'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
                           'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
                           'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
                           'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
        if (validStates.includes(potentialState)) {
          stateName = potentialState;
        }
      }
    }

    console.log('=== DIRECT IMPORT START ===');
    console.log('Run ID:', runId);
    console.log('Search Query:', searchQuery);
    console.log('City Input:', city);
    console.log('Parsed City:', cityName);
    console.log('Parsed State:', stateName);

    // Get Apify API key
    const apifyApiKey = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
    if (!apifyApiKey) {
      return NextResponse.json({ error: 'Apify API key not configured' }, { status: 500 });
    }

    // Fetch run details from Apify
    const runUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`;
    console.log('Fetching Apify run from:', runUrl.replace(apifyApiKey, 'REDACTED'));
    
    let runResponse;
    try {
      runResponse = await fetch(runUrl);
    } catch (fetchError) {
      console.error('Network error fetching Apify run:', fetchError);
      return NextResponse.json({ 
        error: 'Network error connecting to Apify',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown network error'
      }, { status: 500 });
    }
    
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run fetch failed:', runResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch Apify run',
        status: runResponse.status,
        details: errorText
      }, { status: runResponse.status });
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      return NextResponse.json({ 
        error: 'No dataset found for this run'
      }, { status: 404 });
    }

    // Fetch dataset items
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyApiKey}`;
    const datasetResponse = await fetch(datasetUrl);
    
    if (!datasetResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch dataset'
      }, { status: datasetResponse.status });
    }

    const rawResults = await datasetResponse.json();
    console.log(`Fetched ${rawResults.length} results from Apify`);

    // Check for existing Google Maps URLs to avoid duplicates
    const googleMapsUrls = rawResults
      .map((r: any) => r.url)
      .filter((url: string) => url && url.trim() !== '');

    console.log(`Checking ${googleMapsUrls.length} URLs for duplicates`);

    let existingUrlSet = new Set<string>();
    
    if (googleMapsUrls.length > 0) {
      const { data: existingLeads, error: fetchError } = await supabase
        .from('leads')
        .select('google_maps_url')
        .eq('user_id', user.id)
        .in('google_maps_url', googleMapsUrls);

      if (fetchError) {
        console.error('Error checking duplicates:', fetchError);
      } else {
        existingUrlSet = new Set(existingLeads?.map(l => l.google_maps_url).filter(url => url) || []);
        console.log(`Found ${existingUrlSet.size} existing leads`);
      }
    }

    // Transform and insert leads directly
    let successCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const result of rawResults) {
      // Skip if no URL
      if (!result.url || result.url.trim() === '') {
        console.log('Skipping lead with no URL:', result.title);
        skippedCount++;
        continue;
      }

      // Skip duplicates
      if (existingUrlSet.has(result.url)) {
        console.log('Skipping duplicate:', result.title);
        skippedCount++;
        continue;
      }

      // Build the lead object with EXACTLY the manual values provided
      const lead = {
        user_id: user.id,
        company_name: result.title || 'Unknown Business',
        address: result.address || '',
        city: cityName, // ALWAYS use manual city
        state: stateName, // ALWAYS use manual state
        phone: result.phone?.replace(/^\+1\s*/, '') || '',
        website: result.website || '',
        email: result.emails?.[0] || null,
        email2: result.emails?.[1] || null,
        email3: result.emails?.[2] || null,
        service_type: result.categoryName || 'General',
        lead_source: 'Google Maps' as const,
        search_query: searchQuery, // ALWAYS use manual search query
        rating: result.totalScore || null,
        review_count: result.reviewsCount || null,
        google_maps_url: result.url || '',
        instagram_url: result.instagrams?.[0] || null,
        facebook_url: result.facebooks?.[0] || null,
        linkedin_url: result.linkedIns?.[0] || null,
        twitter_url: result.twitters?.[0] || null,
        notes: ''
      };

      // Generate notes based on signals
      const signals = [];
      if (!lead.website) signals.push('No website');
      if (!lead.review_count || lead.review_count < 10) signals.push('Few reviews');
      if (lead.rating && lead.rating < 4) signals.push('Low rating');
      if (!lead.phone) signals.push('No phone');
      lead.notes = signals.join(', ');

      // Insert the lead
      const { error: insertError } = await supabase
        .from('leads')
        .insert(lead);

      if (insertError) {
        console.error('Failed to insert lead:', result.title, insertError);
        errors.push({ lead: result.title, error: insertError.message });
      } else {
        successCount++;
        // Add to existing set to prevent duplicates within same batch
        existingUrlSet.add(result.url);
      }
    }

    console.log('=== DIRECT IMPORT COMPLETE ===');
    console.log('Success:', successCount);
    console.log('Skipped:', skippedCount);
    console.log('Errors:', errors.length);
    
    // Log sample of imported data for debugging
    if (successCount > 0) {
      console.log('Sample imported lead:', {
        city: cityName,
        state: stateName,
        search_query: searchQuery,
        source: 'Google Maps'
      });
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      skipped: skippedCount,
      failed: errors.length,
      total: rawResults.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}