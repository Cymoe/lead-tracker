import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveLeadsBatch } from '@/lib/supabase-api';
import { trackImportMetrics } from '@/lib/market-coverage-api';
import { updateMarketCoverageFromLeads } from '@/lib/update-market-coverage';
import { generateNotesFromLead } from '@/utils/lead-notes-generator';
import { Lead } from '@/types';

export async function POST(request: Request) {
  console.log('=== GOOGLE MAPS BATCH IMPORT START ===');
  const supabase = await createClient();

  try {
    const { results, metadata } = await request.json();
    console.log(`Processing batch import of ${results.length} leads`);

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'No results to import' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract Google Maps URLs for duplicate check
    const googleMapsUrls = results
      .map((result: any) => {
        if (result.place_id) {
          return `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;
        }
        return result.google_maps_url || result.url;
      })
      .filter(Boolean);

    // Check for existing leads with these URLs
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('google_maps_url')
      .eq('user_id', user.id)
      .in('google_maps_url', googleMapsUrls);

    const existingUrlSet = new Set(existingLeads?.map(l => l.google_maps_url) || []);

    // Prepare leads for batch insert
    const leadsToInsert: Partial<Lead>[] = [];
    const skippedDuplicates: any[] = [];

    for (const result of results) {
      const googleMapsUrl = result.place_id 
        ? `https://www.google.com/maps/place/?q=place_id:${result.place_id}`
        : result.google_maps_url || result.url;

      // Skip if duplicate
      if (existingUrlSet.has(googleMapsUrl)) {
        skippedDuplicates.push({
          company_name: result.import_ready?.company_name || result.name,
          google_maps_url: googleMapsUrl
        });
        continue;
      }

      // Extract lead data
      const importData = result.import_ready || {};
      
      // Parse city and state
      let leadCity = metadata.city || '';
      let leadState = '';
      
      const cityParts = leadCity.split(',').map((p: string) => p.trim());
      if (cityParts.length > 1) {
        leadCity = cityParts[0];
        leadState = cityParts[cityParts.length - 1];
      }

      // Extract social media handles
      let instagramHandle = null;
      let instagramUrl = null;
      
      if (result.social_media?.instagram && result.social_media.instagram.length > 0) {
        instagramUrl = result.social_media.instagram[0];
        const match = instagramUrl.match(/instagram\.com\/([^\/\?]+)/);
        if (match) {
          instagramHandle = `@${match[1]}`;
        }
      }

      const leadToSave = {
        company_name: importData.company_name || result.name,
        address: result.formatted_address || importData.address || '',
        city: leadCity,
        state: leadState,
        phone: importData.phone || result.formatted_phone_number || '',
        website: importData.website || result.website || '',
        service_type: importData.service_type || metadata.service_type || '',
        lead_source: 'Google Maps',
        notes: '', // Will be generated after construction
        rating: result.rating || null,
        review_count: result.user_ratings_total || null,
        google_maps_url: googleMapsUrl,
        email: result.emails?.[0] || null,
        instagram_url: instagramUrl,
        facebook_url: result.social_media?.facebook?.[0] || null,
        linkedin_url: result.social_media?.linkedin?.[0] || null,
        twitter_url: result.social_media?.twitter?.[0] || null,
        handle: instagramHandle,
        user_id: user.id,
        score: result.opportunity_score >= 90 ? 'A++' : 
               result.opportunity_score >= 80 ? 'A+' : 
               result.opportunity_score >= 70 ? 'A' : 
               result.opportunity_score >= 60 ? 'B' : 'C'
      };

      // Generate notes based on actual lead data
      leadToSave.notes = generateNotesFromLead(leadToSave);
      
      leadsToInsert.push(leadToSave);
    }

    // Batch insert all leads
    let successCount = 0;
    const errors = [];

    if (leadsToInsert.length > 0) {
      console.log(`Batch inserting ${leadsToInsert.length} leads (skipped ${skippedDuplicates.length} duplicates)...`);
      
      try {
        const CHUNK_SIZE = 100;
        for (let i = 0; i < leadsToInsert.length; i += CHUNK_SIZE) {
          const chunk = leadsToInsert.slice(i, i + CHUNK_SIZE);
          const savedLeads = await saveLeadsBatch(chunk, supabase, user.id);
          successCount += savedLeads.length;
        }
      } catch (error) {
        console.error('Batch insert error:', error);
        errors.push({
          error: error instanceof Error ? error.message : 'Unknown batch insert error'
        });
      }
    }

    // Track import metrics if market info available
    if (metadata.market_id && metadata.market_name) {
      try {
        await trackImportMetrics(
          metadata.market_id,
          metadata.phase || 1,
          null, // import operation id removed
          {
            totalFound: results.length,
            duplicates: skippedDuplicates.length,
            imported: successCount,
            serviceType: metadata.service_type || '',
            searchQuery: metadata.coverage_context?.search_query || ''
          },
          supabase
        );

        // Update market coverage
        await updateMarketCoverageFromLeads(
          supabase,
          user.id,
          metadata.market_id,
          metadata.market_name
        );
      } catch (metricsError) {
        console.error('Failed to track import metrics:', metricsError);
      }
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      skipped: skippedDuplicates.length,
      total: results.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error processing batch import:', error);
    return NextResponse.json(
      { error: 'Failed to process batch import', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}