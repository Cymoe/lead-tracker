import { Lead } from '@/types';
import { createClient } from './supabase/client';

// Re-export all functions from supabase-api
export { fetchLeads, saveLead, updateLead, updateLeads, deleteLead, deleteLeads, extractWithAI, extractWithAIStream } from './supabase-api';

// New function to merge lead data from multiple sources
export async function mergeLeadData(existingLead: Lead, newData: Partial<Lead>): Promise<Lead> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create merged data, preferring new data where it exists but keeping existing data
  const mergedData: Partial<Lead> = {
    ...existingLead,
    // Merge contact info (keep existing if new is empty)
    phone: newData.phone || existingLead.phone,
    email: newData.email || existingLead.email,
    website: newData.website || existingLead.website,
    instagram_url: newData.instagram_url || existingLead.instagram_url,
    
    // Merge location data
    address: newData.address || existingLead.address,
    google_maps_url: newData.google_maps_url || existingLead.google_maps_url,
    
    // Merge business data
    rating: newData.rating || existingLead.rating,
    review_count: newData.review_count || existingLead.review_count,
    service_type: newData.service_type || existingLead.service_type,
    
    // Merge ad data
    running_ads: newData.running_ads || existingLead.running_ads,
    ad_copy: newData.ad_copy || existingLead.ad_copy,
    ad_start_date: newData.ad_start_date || existingLead.ad_start_date,
    ad_call_to_action: newData.ad_call_to_action || existingLead.ad_call_to_action,
    
    // Merge notes (append if both exist)
    notes: existingLead.notes && newData.notes 
      ? `${existingLead.notes}\n\n[Merged from ${newData.lead_source}]: ${newData.notes}`
      : newData.notes || existingLead.notes,
    
    // Update timestamp
    updated_at: new Date().toISOString(),
  };

  // If this is from a different source, upgrade the score
  if (newData.lead_source && newData.lead_source !== existingLead.lead_source) {
    // Multi-source bonus: upgrade score if not already A+ or A++
    if (existingLead.score === 'C') mergedData.score = 'B';
    else if (existingLead.score === 'B') mergedData.score = 'A';
    else if (existingLead.score === 'A') mergedData.score = 'A+';
    
    // Add note about multi-source
    mergedData.notes = mergedData.notes 
      ? `${mergedData.notes}\n\n🔗 Multi-source lead: Found in both ${existingLead.lead_source} and ${newData.lead_source}`
      : `🔗 Multi-source lead: Found in both ${existingLead.lead_source} and ${newData.lead_source}`;
  }

  const { updateLead } = await import('./supabase-api');
  return updateLead(existingLead.id, mergedData);
}