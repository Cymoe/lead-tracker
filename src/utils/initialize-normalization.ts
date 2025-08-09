import { createClient } from '@/lib/supabase/client';
import { normalizeServiceType } from './service-type-normalization';

let normalizationInitialized = false;

export async function initializeServiceTypeNormalization() {
  // Only run once per session
  if (normalizationInitialized) return;
  
  try {
    const supabase = createClient();
    
    // Check if we need to run normalization
    const { data: checkData } = await supabase
      .from('leads')
      .select('id')
      .not('service_type', 'is', null)
      .is('normalized_service_type', null)
      .limit(1);
    
    if (!checkData || checkData.length === 0) {
      console.log('All service types are already normalized');
      normalizationInitialized = true;
      return;
    }
    
    console.log('Found unnormalized service types, starting batch normalization...');
    
    // Fetch all leads that need normalization
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, service_type')
      .not('service_type', 'is', null)
      .is('normalized_service_type', null);
    
    if (fetchError || !leads) {
      console.error('Error fetching leads:', fetchError);
      return;
    }
    
    console.log(`Normalizing ${leads.length} leads...`);
    
    // Update in batches
    const batchSize = 50;
    let totalUpdated = 0;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      const promises = batch.map(lead => {
        const normalized = normalizeServiceType(lead.service_type);
        if (!normalized) return null;
        
        return supabase
          .from('leads')
          .update({ normalized_service_type: normalized })
          .eq('id', lead.id);
      }).filter(Boolean);
      
      await Promise.all(promises);
      totalUpdated += promises.length;
      
      // Log progress for large datasets
      if (leads.length > 100 && (i + batchSize) % 500 === 0) {
        console.log(`Normalized ${Math.min(i + batchSize, leads.length)}/${leads.length} leads`);
      }
    }
    
    console.log(`Service type normalization complete! Updated ${totalUpdated} leads.`);
    normalizationInitialized = true;
    
  } catch (error) {
    console.error('Error during auto-normalization:', error);
  }
}