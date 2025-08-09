import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveLead } from '@/lib/supabase-api';
import { createImportOperation } from '@/lib/import-operations-api';
import { trackImportMetrics } from '@/lib/market-coverage-api';
import { updateMarketCoverageFromLeads } from '@/lib/update-market-coverage';
import { createMarketId, createMarketName } from '@/utils/market-id';
import { Lead } from '@/types';

export async function POST(request: Request) {
  console.log('=== APIFY IMPORT PROCESS START ===');
  const supabase = createClient();

  try {
    const { searchResultId } = await request.json();
    console.log('Search result ID:', searchResultId);

    if (!searchResultId) {
      return NextResponse.json({ error: 'Search result ID is required' }, { status: 400 });
    }

    // Get the current user
    console.log('Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User auth result:', { user: user?.id, error: userError });
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the search result with stored data
    const { data: searchResult, error: fetchError } = await supabase
      .from('apify_search_results')
      .select('*')
      .eq('id', searchResultId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !searchResult) {
      return NextResponse.json({ 
        error: 'Search result not found or unauthorized' 
      }, { status: 404 });
    }

    // Check if already imported
    if (searchResult.import_status === 'completed') {
      return NextResponse.json({ 
        error: 'This data has already been imported',
        leadsImported: searchResult.leads_imported
      }, { status: 409 });
    }

    // Check if import is in progress
    if (searchResult.import_status === 'processing') {
      return NextResponse.json({ 
        error: 'Import is already in progress',
        status: searchResult.import_status
      }, { status: 409 });
    }

    // Update status to processing
    await supabase
      .from('apify_search_results')
      .update({ 
        import_status: 'processing',
        import_started_at: new Date().toISOString()
      })
      .eq('id', searchResultId);

    try {
      // Extract leads from results
      const leads = searchResult.results as any[];
      
      // Extract the searched location from search params
      // Handle both object and string formats
      const searchParams = typeof searchResult.search_params === 'string' 
        ? JSON.parse(searchResult.search_params) 
        : searchResult.search_params;
        
      const locationQuery = searchParams?.locationQuery || '';
      
      console.log('Search params debug:', {
        raw: searchResult.search_params,
        parsed: searchParams,
        locationQuery,
        searchParamsType: typeof searchResult.search_params,
        hasLocationQuery: !!searchParams?.locationQuery
      });
      
      // First try to get parsed city/state from search params
      let overrideCity = searchParams?.parsedCity || '';
      let overrideState = searchParams?.parsedState || '';
      
      // If not available, parse from locationQuery
      if ((!overrideCity || !overrideState) && locationQuery) {
        const parts = locationQuery.split(',').map((p: string) => p.trim());
        if (parts.length > 0) {
          overrideCity = overrideCity || parts[0];
          if (parts.length > 1) {
            overrideState = overrideState || parts[parts.length - 1];
          }
        }
      }
      
      // Fallback: If no location query, find most common city in results
      if (!overrideCity && leads.length > 0) {
        const cityCounts = new Map<string, number>();
        leads.forEach((lead) => {
          const leadData = lead.import_ready || lead;
          if (leadData.city && leadData.state) {
            const key = `${leadData.city}|${leadData.state}`;
            cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
          }
        });
        
        let maxCount = 0;
        let mostCommon = '';
        cityCounts.forEach((count, cityState) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = cityState;
          }
        });
        
        if (mostCommon) {
          const [city, state] = mostCommon.split('|');
          overrideCity = city;
          overrideState = state;
          console.log(`Using most common city as fallback: ${city}, ${state} (${maxCount}/${leads.length} leads)`);
        }
      }
      
      console.log('Import process using location override:', { 
        locationQuery, 
        city: overrideCity, 
        state: overrideState 
      });
      
      // Add a small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let importOperation;
      try {
        importOperation = await createImportOperation(
          'google_maps_import',
          'Google Maps',
          leads.length,
          {
            apify_run_id: searchResult.apify_run_id,
            search_result_id: searchResultId,
            location: locationQuery,
            high_quality_leads: leads.filter((r: any) => r.opportunity_score >= 80).length,
            contacts_found: leads.filter((r: any) => r.formatted_phone_number).length,
            emails_found: leads.filter((r: any) => r.emails?.length > 0).length
          },
          supabase,  // Pass the server-side Supabase client
          user.id    // Pass the user ID
        );

        if (!importOperation) {
          throw new Error('Failed to create import operation - no data returned');
        }
      } catch (opError) {
        console.error('Import operation creation failed:', {
          error: opError,
          message: opError instanceof Error ? opError.message : 'Unknown error',
          stack: opError instanceof Error ? opError.stack : undefined,
          leadCount: leads.length,
          hasSupabase: !!supabase,
          hasUser: !!user.id
        });
        
        // Check if it's a specific database error
        if (opError && typeof opError === 'object' && 'code' in opError) {
          const dbError = opError as any;
          if (dbError.code === '23505') {
            throw new Error('Duplicate import operation detected');
          } else if (dbError.code === '23503') {
            throw new Error('Foreign key constraint violation - check user authentication');
          } else if (dbError.code === '23514') {
            throw new Error('Check constraint violation - invalid source value');
          }
        }
        
        throw new Error(`Failed to create import operation: ${opError instanceof Error ? opError.message : 'Unknown error'}`);
      }

      // Import leads in batches
      const BATCH_SIZE = 20;
      let successCount = 0;
      const errors: any[] = [];

      for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(leads.length/BATCH_SIZE)} (${batch.length} leads)`);
        
        const savePromises = batch.map(async (lead) => {
          // Extract lead data from import_ready
          const leadData = lead.import_ready || lead;
          
          // Always use override if available, otherwise use lead data
          const finalCity = overrideCity || leadData.city || '';
          const finalState = overrideState || leadData.state || '';
          
          console.log(`Importing ${leadData.company_name}: city="${finalCity}", state="${finalState}" (override: ${!!overrideCity})`);
          
          // Debug: log the exact data being passed
          const leadToSave = {
              company_name: leadData.company_name,
              address: leadData.address,
              city: finalCity,
              state: finalState,
              phone: leadData.phone,
              website: leadData.website,
              service_type: leadData.service_type,
              lead_source: leadData.source || 'Google Maps',
              notes: leadData.notes,
              rating: lead.rating,
              review_count: lead.user_ratings_total,
              google_maps_url: lead.google_maps_url || lead.url,
              email: lead.emails?.[0],
              email2: lead.emails?.[1],
              email3: lead.emails?.[2],
              instagram_url: lead.social_media?.instagram?.[0],
              facebook_url: lead.social_media?.facebook?.[0],
              linkedin_url: lead.social_media?.linkedin?.[0],
              twitter_url: lead.social_media?.twitter?.[0],
              import_operation_id: importOperation.id,
              user_id: user.id,
              search_query: leadData.search_query || searchParams?.searchQuery || ''
            };
            
            console.log('Lead data to save:', {
              company_name: leadToSave.company_name,
              city: leadToSave.city,
              state: leadToSave.state,
              cityType: typeof leadToSave.city,
              stateType: typeof leadToSave.state,
              cityLength: leadToSave.city?.length,
              stateLength: leadToSave.state?.length
            });
            
            try {
              console.log('Calling saveLead with auth:', { userId: user.id, hasSupabase: !!supabase });
              
              // Add timeout to prevent hanging
              const savePromise = saveLead(leadToSave, supabase, user.id);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Save timeout after 5 seconds')), 5000)
              );
              
              const savedLead = await Promise.race([savePromise, timeoutPromise]) as Lead;
              console.log('Lead saved successfully:', savedLead.id);
              return { success: true, lead: savedLead };
            } catch (error) {
              console.error('Failed to import lead:', leadToSave.company_name, error);
              console.error('Full error details:', {
                error,
                leadData: leadToSave,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
              });
              return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error',
                lead: leadToSave
              };
            }
        });
        
        const results = await Promise.all(savePromises);
        successCount += results.filter(r => r.success).length;
        errors.push(...results.filter(r => !r.success));
      }

      // Track import metrics for market coverage
      if (overrideCity && overrideState && importOperation) {
        const marketId = createMarketId(overrideCity, overrideState);
        const marketName = createMarketName(overrideCity, overrideState);
        const serviceType = searchParams?.searchQuery ? 
          searchParams.searchQuery.split(' in ')[0] : 
          'General';
          
        console.log('Tracking import metrics for market:', {
          marketId,
          city: overrideCity,
          state: overrideState,
          serviceType,
          successCount,
          totalLeads: leads.length
        });
        
        try {
          await trackImportMetrics(
            marketId,
            1, // Phase 1 for Google Maps
            importOperation.id,
            {
              totalFound: leads.length,
              duplicates: leads.length - successCount,
              imported: successCount,
              serviceType: serviceType,
              searchQuery: searchParams?.searchQuery || `${serviceType} in ${overrideCity}, ${overrideState}`
            },
            supabase
          );
          console.log('Import metrics tracked successfully');
          
          // Also update the market coverage with the new search
          const updated = await updateMarketCoverageFromLeads(
            supabase,
            user.id,
            marketId,
            marketName
          );
          
          if (updated) {
            console.log('Market coverage updated automatically');
          } else {
            console.error('Failed to auto-update market coverage');
          }
        } catch (metricsError) {
          console.error('Failed to track import metrics:', metricsError);
          // Don't fail the import if metrics tracking fails
        }
      }
      
      // Update search result with import status
      const importStatus = successCount === 0 ? 'failed' : 'completed';
      await supabase
        .from('apify_search_results')
        .update({ 
          import_status: importStatus,
          import_completed_at: new Date().toISOString(),
          leads_imported: successCount,
          import_operation_id: importOperation.id,
          import_error: errors.length > 0 ? JSON.stringify(errors) : null
        })
        .eq('id', searchResultId);

      return NextResponse.json({ 
        success: true,
        imported: successCount,
        failed: errors.length,
        total: leads.length,
        importOperationId: importOperation.id,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (importError) {
      // Update status to failed
      await supabase
        .from('apify_search_results')
        .update({ 
          import_status: 'failed',
          import_error: importError instanceof Error ? importError.message : 'Unknown error'
        })
        .eq('id', searchResultId);

      throw importError;
    }

  } catch (error) {
    console.error('Error processing import:', error);
    return NextResponse.json(
      { error: 'Failed to process import', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Check import status
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const searchResultId = searchParams.get('id');

  if (!searchResultId) {
    return NextResponse.json({ error: 'Search result ID is required' }, { status: 400 });
  }

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the search result status
    const { data: searchResult, error: fetchError } = await supabase
      .from('apify_search_results')
      .select('id, import_status, leads_imported, import_error, import_started_at, import_completed_at')
      .eq('id', searchResultId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !searchResult) {
      return NextResponse.json({ 
        error: 'Search result not found or unauthorized' 
      }, { status: 404 });
    }

    return NextResponse.json({
      id: searchResult.id,
      status: searchResult.import_status,
      leadsImported: searchResult.leads_imported,
      error: searchResult.import_error,
      startedAt: searchResult.import_started_at,
      completedAt: searchResult.import_completed_at
    });

  } catch (error) {
    console.error('Error checking import status:', error);
    return NextResponse.json(
      { error: 'Failed to check import status' },
      { status: 500 }
    );
  }
}