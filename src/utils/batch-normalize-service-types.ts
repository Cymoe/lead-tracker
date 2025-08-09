import { createClient } from '@/lib/supabase/client';
import { normalizeServiceType } from './service-type-normalization';

export async function batchNormalizeServiceTypes() {
  const supabase = createClient();
  
  console.log('Starting batch normalization of service types...');
  
  // Fetch all leads that have a service_type but no normalized_service_type
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, service_type')
    .not('service_type', 'is', null)
    .is('normalized_service_type', null);
  
  if (fetchError) {
    console.error('Error fetching leads:', fetchError);
    return { success: false, error: fetchError };
  }
  
  if (!leads || leads.length === 0) {
    console.log('No leads need normalization');
    return { success: true, normalized: 0 };
  }
  
  console.log(`Found ${leads.length} leads to normalize`);
  
  // Prepare batch updates
  const updates = leads.map(lead => {
    const normalizedType = normalizeServiceType(lead.service_type);
    return {
      id: lead.id,
      normalized_service_type: normalizedType
    };
  }).filter(update => update.normalized_service_type !== null);
  
  console.log(`Normalizing ${updates.length} leads with valid service types`);
  
  // Update in batches of 100
  const batchSize = 100;
  let totalUpdated = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    // Update each lead in the batch
    const promises = batch.map(update => 
      supabase
        .from('leads')
        .update({ normalized_service_type: update.normalized_service_type })
        .eq('id', update.id)
    );
    
    const results = await Promise.all(promises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error(`Errors in batch ${i / batchSize + 1}:`, errors);
    }
    
    totalUpdated += batch.length - errors.length;
    console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(updates.length / batchSize)}`);
  }
  
  console.log(`Batch normalization complete. Updated ${totalUpdated} leads`);
  
  return { 
    success: true, 
    normalized: totalUpdated,
    total: leads.length 
  };
}

// Function to get normalization statistics
export async function getNormalizationStats() {
  const supabase = createClient();
  
  // Get counts of normalized vs non-normalized
  const { data: stats, error } = await supabase
    .from('leads')
    .select('service_type, normalized_service_type')
    .not('service_type', 'is', null);
  
  if (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
  
  const total = stats.length;
  const normalized = stats.filter(lead => lead.normalized_service_type !== null).length;
  const notNormalized = total - normalized;
  
  // Count unique service types before and after normalization
  const originalTypes = new Set(stats.map(lead => lead.service_type).filter(Boolean));
  const normalizedTypes = new Set(stats.map(lead => lead.normalized_service_type).filter(Boolean));
  
  return {
    total,
    normalized,
    notNormalized,
    uniqueOriginalTypes: originalTypes.size,
    uniqueNormalizedTypes: normalizedTypes.size,
    reductionRatio: originalTypes.size > 0 
      ? ((originalTypes.size - normalizedTypes.size) / originalTypes.size * 100).toFixed(1) + '%'
      : '0%'
  };
}