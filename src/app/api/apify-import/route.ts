import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const { runId, actorId, targetCity } = await request.json();

    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this Apify run has already been imported
    const { data: existingImport, error: checkError } = await supabase
      .from('apify_search_results')
      .select('id, import_status, leads_imported, import_error')
      .eq('user_id', user.id)
      .eq('apify_run_id', runId)
      .maybeSingle();  // Use maybeSingle instead of single to avoid error when not found
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing import:', checkError);
    }

    if (existingImport) {
      // Import already exists
      if (existingImport.import_status === 'completed') {
        return NextResponse.json({ 
          error: 'This Apify run has already been imported',
          existingImport: {
            id: existingImport.id,
            status: existingImport.import_status,
            leadsImported: existingImport.leads_imported
          }
        }, { status: 409 }); // Conflict
      } else if (existingImport.import_status === 'processing') {
        return NextResponse.json({ 
          error: 'This import is already in progress',
          existingImport: {
            id: existingImport.id,
            status: existingImport.import_status
          }
        }, { status: 409 });
      } else if (existingImport.import_status === 'failed') {
        // Allow retry of failed imports
        console.log('Retrying failed import:', existingImport.id);
      }
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

    // Extract locationQuery and searchQuery from the run's input data
    let locationQuery = '';
    let searchQuery = '';
    if (runData.data?.defaultKeyValueStoreId) {
      try {
        // Fetch the INPUT from the key-value store
        const inputUrl = `https://api.apify.com/v2/key-value-stores/${runData.data.defaultKeyValueStoreId}/records/INPUT?token=${apifyApiKey}`;
        const inputResponse = await fetch(inputUrl);
        
        if (inputResponse.ok) {
          const inputData = await inputResponse.json();
          
          // Extract the actual search query (e.g., "Patio builder in Amarillo, TX")
          searchQuery = inputData.searchStringsArray?.[0] || 
                       inputData.searchString || 
                       '';
          
          // Extract location query (e.g., "Amarillo, TX")
          locationQuery = inputData.locationQuery || 
                         inputData.location || 
                         '';
                         
          // If no locationQuery but we have searchQuery, try to extract location from it
          if (!locationQuery && searchQuery) {
            // Extract location from search query like "Patio builder in Amarillo, TX"
            const inMatch = searchQuery.match(/\s+in\s+(.+)$/i);
            if (inMatch) {
              locationQuery = inMatch[1];
            }
          }
          
          // Fallback to other fields if still no location
          if (!locationQuery) {
            locationQuery = inputData.coordinates?.string ||
                           inputData.customGeolocation?.string ||
                           '';
          }
          
          // If we have coordinates array, try to extract the location string
          if (!locationQuery && inputData.coordinates && Array.isArray(inputData.coordinates)) {
            const firstCoord = inputData.coordinates[0];
            if (firstCoord?.string) {
              locationQuery = firstCoord.string;
            }
          }
          
          console.log('Apify run input data:', {
            searchQuery,
            locationQuery,
            searchStringsArray: inputData.searchStringsArray,
            allKeys: Object.keys(inputData)
          });
          console.log('Extracted searchQuery:', searchQuery);
          console.log('Extracted locationQuery:', locationQuery);
        }
      } catch (error) {
        console.error('Error fetching run input:', error);
      }
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

    // Extract city and state from targetCity or locationQuery
    let overrideCity = '';
    let overrideState = '';
    const citySource = targetCity || locationQuery; // Use targetCity if provided, otherwise use Apify's locationQuery
    
    console.log('City source determination:', {
      targetCity,
      locationQuery,
      citySource,
      source: targetCity ? 'manual' : locationQuery ? 'apify' : 'none'
    });
    
    if (citySource) {
      const cityParts = citySource.split(',').map((part: string) => part.trim());
      if (cityParts.length > 0) {
        overrideCity = cityParts[0];
        if (cityParts.length > 1) {
          overrideState = cityParts[cityParts.length - 1];
        }
      }
      console.log('Using city override:', { 
        city: overrideCity, 
        state: overrideState, 
        source: targetCity ? 'manual' : 'apify',
        originalString: citySource
      });
    } else {
      console.log('WARNING: No city source found! Will try to use the most common city from results.');
      
      // Fallback: Find the most common city in the results
      const cityCounts = new Map<string, number>();
      rawResults.forEach((result: any) => {
        if (result.city && result.city !== 'null') {
          const cityState = `${result.city}, ${result.state || ''}`.trim();
          cityCounts.set(cityState, (cityCounts.get(cityState) || 0) + 1);
        }
      });
      
      // Get the most common city
      let mostCommonCity = '';
      let maxCount = 0;
      cityCounts.forEach((count, cityState) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonCity = cityState;
        }
      });
      
      if (mostCommonCity) {
        const parts = mostCommonCity.split(',').map(p => p.trim());
        overrideCity = parts[0];
        overrideState = parts[1] || '';
        console.log(`Using most common city from results: ${overrideCity}, ${overrideState} (found in ${maxCount}/${rawResults.length} results)`);
      }
    }

    // Transform Apify results to match our format
    const transformedResults = rawResults.map((result: any) => {
      // ALWAYS use the searched city from locationQuery, ignore individual result cities
      let city = overrideCity;
      let state = overrideState;
      const street = (result.street && result.street !== 'null' && result.street !== null) ? result.street : '';
      
      // Only try to extract from address if we don't have override values
      if ((!overrideCity || !overrideState) && result.address) {
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

      // Debug logging for city/state
      if (!city || !state) {
        console.log(`Missing city/state for ${result.title}:`, {
          city,
          state,
          overrideCity,
          overrideState,
          resultCity: result.city,
          resultState: result.state,
          address: result.address,
          fullAddress
        });
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
          source: 'Google Maps',
          notes: signals.length > 0 ? signals.join(', ') : '',
          city: city || '',
          state: state || '',
          search_query: searchQuery || ''
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

    // Save to database with import tracking
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update the search result record
    const searchResultData = {
      user_id: user.id,
      search_type: 'google_maps' as const,
      search_params: {
        source: 'apify_import',
        runId,
        actorId: actorId || 'compass/crawler-google-places',
        importedAt: new Date().toISOString(),
        locationQuery: locationQuery || targetCity || '',
        searchQuery: searchQuery || '',
        // Also store the parsed city/state for easier access
        parsedCity: overrideCity,
        parsedState: overrideState
      },
      results: transformedResults,
      result_count: transformedResults.length,
      search_mode: 'apify',
      expires_at: expiresAt.toISOString(),
      apify_run_id: runId || null,  // Ensure null if no runId
      import_status: 'pending',
      import_started_at: new Date().toISOString()
    };

    let savedSearch;
    let saveError;
    
    console.log('Attempting to save search result:', {
      existingImport: !!existingImport,
      runId,
      resultCount: transformedResults.length,
      locationQuery
    });
    
    if (existingImport) {
      // Update existing record
      console.log('Updating existing import:', existingImport.id);
      const { data, error } = await supabase
        .from('apify_search_results')
        .update(searchResultData)
        .eq('id', existingImport.id)
        .select()
        .single();
      savedSearch = data;
      saveError = error;
    } else {
      // Insert new record
      console.log('Creating new import record');
      const { data, error } = await supabase
        .from('apify_search_results')
        .insert(searchResultData)
        .select()
        .single();
      savedSearch = data;
      saveError = error;
    }

    if (saveError) {
      console.error('Error saving imported results:', saveError);
      
      // Check if it's a duplicate key error
      if (saveError.code === '23505' && saveError.message?.includes('unique_apify_run_id')) {
        return NextResponse.json({ 
          error: 'This Apify run has already been imported',
          hint: 'The run ID already exists in the database'
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to save import record',
        details: saveError.message,
        code: saveError.code
      }, { status: 500 });
    }

    // Return results with import tracking info
    return NextResponse.json({ 
      results: transformedResults,
      count: transformedResults.length,
      savedSearchId: savedSearch?.id,
      importStatus: {
        id: savedSearch?.id,
        status: 'pending',
        message: 'Import data ready. Use the import button to complete the process.'
      }
    });
  } catch (error) {
    console.error('Error importing from Apify:', error);
    return NextResponse.json(
      { error: 'Failed to import from Apify' },
      { status: 500 }
    );
  }
}