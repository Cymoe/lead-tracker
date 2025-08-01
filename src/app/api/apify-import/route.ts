import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { runId, actorId } = await request.json();

    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Apify API key from environment
    const apifyApiKey = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
    console.log('Checking Apify API key:', {
      exists: !!apifyApiKey,
      length: apifyApiKey?.length,
      firstChars: apifyApiKey?.substring(0, 10) + '...'
    });
    
    if (!apifyApiKey) {
      return NextResponse.json({ 
        error: 'Apify API key not configured',
        setupInstructions: true,
        debug: {
          envKeys: Object.keys(process.env).filter(k => k.includes('APIFY')),
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 });
    }

    // First, get the run details to find the dataset ID
    const runUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`;
    console.log('Fetching run from:', runUrl.replace(apifyApiKey, 'REDACTED'));
    
    const runResponse = await fetch(runUrl);
    
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify API error:', runResponse.status, errorText);
      
      if (runResponse.status === 404) {
        return NextResponse.json({ 
          error: 'Run not found. Please check the run ID and ensure it exists.',
          hint: 'Make sure to use the run ID (e.g., "cj0hg4MwJnfX0Qz2C") not the dataset ID',
          runId: runId
        }, { status: 404 });
      }
      return NextResponse.json({ 
        error: 'Failed to fetch run details from Apify',
        details: errorText,
        status: runResponse.status
      }, { status: runResponse.status });
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      return NextResponse.json({ 
        error: 'No dataset found for this run. The run may still be in progress or failed.' 
      }, { status: 404 });
    }

    // Now fetch dataset items
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyApiKey}`;
    const response = await fetch(datasetUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apify API error:', errorText);
      
      if (response.status === 404) {
        return NextResponse.json({ 
          error: 'Dataset not found. Make sure the run ID is correct and the run has completed.' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch data from Apify',
        details: errorText
      }, { status: response.status });
    }

    const rawResults = await response.json();

    // Log first result to see structure
    console.log('Apify results count:', rawResults.length);
    if (rawResults.length > 0) {
      console.log('First Apify result keys:', Object.keys(rawResults[0]));
      console.log('Sample Apify data:', {
        title: rawResults[0].title,
        totalScore: rawResults[0].totalScore,
        reviewsCount: rawResults[0].reviewsCount,
        emails: rawResults[0].emails,
        address: rawResults[0].address,
        city: rawResults[0].city,
        state: rawResults[0].state,
        phone: rawResults[0].phone,
        url: rawResults[0].url,
        website: rawResults[0].website
      });
      
      // Log a result with email if found
      const resultWithEmail = rawResults.find((r: any) => r.emails && r.emails.length > 0);
      if (resultWithEmail) {
        console.log('Example result with email:', {
          title: resultWithEmail.title,
          emails: resultWithEmail.emails,
          phone: resultWithEmail.phone
        });
      }
      
      // Log any results missing city
      const resultsWithoutCity = rawResults.filter((r: any) => !r.city || r.city === 'null');
      if (resultsWithoutCity.length > 0) {
        console.log(`Found ${resultsWithoutCity.length} results without city. Example:`, {
          title: resultsWithoutCity[0].title,
          address: resultsWithoutCity[0].address,
          city: resultsWithoutCity[0].city,
          state: resultsWithoutCity[0].state
        });
      }
    }

    // Transform Apify results to match our format
    const transformedResults = rawResults.map((result: any) => {
      // Use Apify's exact field names, handling null values
      let city = (result.city && result.city !== 'null' && result.city !== null) ? result.city : '';
      let state = (result.state && result.state !== 'null' && result.state !== null) ? result.state : '';
      const street = (result.street && result.street !== 'null' && result.street !== null) ? result.street : '';
      
      // If city or state is empty, try to extract from address
      if ((!city || !state) && result.address) {
        // Try to parse city and state from address (format: "street, city, state zip")
        const addressParts = result.address.split(',');
        if (addressParts.length >= 3) {
          // Usually city is the second-to-last part
          if (!city) {
            city = addressParts[addressParts.length - 2].trim();
          }
          // State and zip are in the last part
          if (!state && addressParts[addressParts.length - 1]) {
            const stateZip = addressParts[addressParts.length - 1].trim();
            // Extract state abbreviation (e.g., "AZ 85260" -> "AZ")
            const stateMatch = stateZip.match(/^([A-Z]{2})\s+\d{5}/);
            if (stateMatch) {
              state = stateMatch[1];
            }
          }
        }
      }
      
      // Use direct address if available, otherwise build from components
      let fullAddress = '';
      if (result.address && result.address !== 'null' && result.address !== null) {
        fullAddress = result.address;
      } else {
        const addressParts = [street, city, state].filter(part => part && part !== 'null');
        fullAddress = addressParts.join(', ');
      }
      
      // Normalize phone number
      let phone = (result.phone && result.phone !== 'null') ? result.phone : '';
      // Remove +1 prefix if present for consistency
      if (phone.startsWith('+1 ')) {
        phone = phone.substring(3);
      } else if (phone.startsWith('+1')) {
        phone = phone.substring(2);
      }

      // Calculate opportunity score
      let opportunityScore = 50;
      const signals = [];

      if (!result.website) {
        opportunityScore += 20;
        signals.push('No website');
      }
      if (!result.reviewsCount || result.reviewsCount < 10) {
        opportunityScore += 15;
        signals.push('Few reviews');
      }
      if (result.totalScore && result.totalScore < 4) {
        opportunityScore += 10;
        signals.push('Low rating');
      }
      if (!phone) {
        opportunityScore += 5;
        signals.push('No phone number');
      }

      // Clean website URL - preserve exactly as provided by Apify
      let cleanWebsite = result.website || '';
      if (cleanWebsite && cleanWebsite !== 'null') {
        // Only fix the known malformed patterns
        if (cleanWebsite.includes('://http://') || cleanWebsite.includes('://https://')) {
          // Fix double protocol (https://http// or http://https://)
          cleanWebsite = cleanWebsite.replace(/^https?:\/\/https?:\/\//, 'https://');
        }
        // Don't add protocol if Apify didn't provide one - they handle it correctly
      } else {
        cleanWebsite = '';
      }

      return {
        place_id: result.url || crypto.randomUUID(),
        name: result.title || 'Unknown Business',
        formatted_address: fullAddress,
        formatted_phone_number: phone,
        website: cleanWebsite,
        rating: result.totalScore !== null ? result.totalScore : null,
        user_ratings_total: result.reviewsCount !== null ? result.reviewsCount : null,
        opportunity_score: Math.min(opportunityScore, 100),
        quality_signals: signals,
        import_ready: {
          company_name: result.title || 'Unknown Business',
          address: fullAddress,
          phone: phone,
          website: cleanWebsite,
          service_type: result.categoryName || 'General',
          source: 'Apify Import',
          notes: signals.length > 0 ? signals.join(', ') : '',
          city: city,
          state: state
        },
        // Include enriched data if available
        emails: result.emails || [],
        social_media: {
          instagram: result.instagrams || [],
          facebook: result.facebooks || [],
          linkedin: result.linkedIns || [],
          twitter: result.twitters || []
        },
        google_maps_url: result.url || '',
        url: result.url || '' // Also include original url field
      };
    });

    // Save to database for persistence
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: savedSearch, error: saveError } = await supabase
      .from('apify_search_results')
      .insert({
        user_id: user.id,
        search_type: 'google_maps',
        search_params: {
          source: 'apify_import',
          runId,
          actorId: actorId || 'compass/crawler-google-places',
          importedAt: new Date().toISOString()
        },
        results: transformedResults,
        result_count: transformedResults.length,
        search_mode: 'apify',
        expires_at: expiresAt.toISOString(),
        apify_run_id: runId,
        contacts_found: transformedResults.filter((r: any) => r.formatted_phone_number).length,
        emails_found: transformedResults.filter((r: any) => r.emails?.length > 0).length,
        high_quality_leads: transformedResults.filter((r: any) => r.opportunity_score >= 80).length
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving imported results:', saveError);
      // Continue even if save fails - we still return the results
    }

    return NextResponse.json({ 
      results: transformedResults,
      count: transformedResults.length,
      savedSearchId: savedSearch?.id
    });
  } catch (error) {
    console.error('Error importing from Apify:', error);
    return NextResponse.json(
      { error: 'Failed to import from Apify' },
      { status: 500 }
    );
  }
}