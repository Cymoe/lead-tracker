import { SupabaseClient } from '@supabase/supabase-js';
import { extractServiceTypeFromQuery } from '@/utils/extract-service-type';

export async function updateMarketCoverageFromLeads(
  supabase: SupabaseClient,
  userId: string,
  marketId: string,
  marketName: string
) {
  try {
    console.log('Updating market coverage for:', { marketId, marketName });
    
    // Get all Google Maps leads for this market
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('service_type, search_query')
      .eq('user_id', userId)
      .eq('lead_source', 'Google Maps')
      .eq('city', marketName.split(',')[0].trim())
      .eq('state', marketName.split(',')[1]?.trim() || '');

    if (leadsError) {
      console.error('Error fetching leads for coverage update:', leadsError);
      return false;
    }

    if (!leads || leads.length === 0) {
      console.log('No leads found for market');
      return false;
    }

    // Extract unique service types and searches
    const serviceTypes = new Set<string>();
    const searches = new Set<string>();
    
    leads.forEach(lead => {
      // Extract service type
      let serviceType = lead.service_type;
      if (!serviceType && lead.search_query) {
        serviceType = extractServiceTypeFromQuery(lead.search_query);
      }
      
      if (serviceType) {
        serviceTypes.add(serviceType);
      }
      
      if (lead.search_query) {
        searches.add(lead.search_query);
      }
    });

    console.log('Found service types:', Array.from(serviceTypes));
    console.log('Found searches:', Array.from(searches));

    // Check if coverage record exists
    const { data: existing } = await supabase
      .from('market_coverage')
      .select('id')
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .single();

    if (!existing) {
      // Create new record
      const { error: insertError } = await supabase
        .from('market_coverage')
        .insert({
          user_id: userId,
          market_id: marketId,
          market_name: marketName,
          market_type: 'city',
          phase_1_service_types: Array.from(serviceTypes),
          phase_1_searches: Array.from(searches),
          phase_1_lead_count: leads.length
        });
        
      if (insertError) {
        console.error('Error creating market coverage:', insertError);
        return false;
      }
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('market_coverage')
        .update({
          phase_1_service_types: Array.from(serviceTypes),
          phase_1_searches: Array.from(searches),
          phase_1_lead_count: leads.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('market_id', marketId);
        
      if (updateError) {
        console.error('Error updating market coverage:', updateError);
        return false;
      }
    }

    console.log('Market coverage updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateMarketCoverageFromLeads:', error);
    return false;
  }
}