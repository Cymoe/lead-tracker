import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractServiceTypeFromQuery } from '@/utils/extract-service-type';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads for the user
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .eq('lead_source', 'Google Maps');

    if (leadsError) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Group leads by market to calculate service types
    const marketData = new Map<string, { 
      serviceTypes: Set<string>, 
      searches: Set<string>,
      leadCount: number 
    }>();

    leads?.forEach(lead => {
      if (!lead.city || !lead.state) return;
      
      // Determine market ID
      const marketId = `city-${lead.city}-${lead.state}`;
      
      if (!marketData.has(marketId)) {
        marketData.set(marketId, {
          serviceTypes: new Set(),
          searches: new Set(),
          leadCount: 0
        });
      }
      
      const market = marketData.get(marketId)!;
      market.leadCount++;
      
      // Extract service type from search query if not already set
      let serviceType = lead.service_type;
      if (!serviceType && lead.search_query) {
        serviceType = extractServiceTypeFromQuery(lead.search_query);
        if (serviceType) {
          console.log(`Extracted service type "${serviceType}" from query "${lead.search_query}"`);
        }
      }
      
      if (serviceType) {
        market.serviceTypes.add(serviceType);
      } else if (lead.search_query) {
        console.log(`No service type found for query: ${lead.search_query}`);
      }
      
      if (lead.search_query) {
        market.searches.add(lead.search_query);
      }
    });

    // Update market coverage for each market
    const updates = [];
    for (const [marketId, data] of marketData) {
      const marketParts = marketId.split('-');
      const city = marketParts[1];
      const state = marketParts[2];
      
      // First ensure the market coverage record exists
      const { data: existing } = await supabase
        .from('market_coverage')
        .select('id')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .single();

      if (!existing) {
        // Create the record first
        await supabase
          .from('market_coverage')
          .insert({
            user_id: user.id,
            market_id: marketId,
            market_name: `${city}, ${state}`,
            market_type: 'city'
          });
      }

      // Update with the actual data
      const { error: updateError } = await supabase
        .from('market_coverage')
        .update({
          phase_1_service_types: Array.from(data.serviceTypes),
          phase_1_searches: Array.from(data.searches),
          phase_1_lead_count: data.leadCount
        })
        .eq('user_id', user.id)
        .eq('market_id', marketId);

      if (updateError) {
        console.error('Error updating market:', marketId, updateError);
      } else {
        updates.push(marketId);
      }
    }

    // Remove any state-level coverage records that might have been created
    // We only want city-level tracking
    const { error: deleteError } = await supabase
      .from('market_coverage')
      .delete()
      .eq('user_id', user.id)
      .eq('market_type', 'state');
      
    if (deleteError) {
      console.error('Error removing state-level coverage:', deleteError);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Fixed coverage for ${updates.length} markets`,
      markets: updates 
    });
  } catch (error) {
    console.error('Error fixing market coverage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}