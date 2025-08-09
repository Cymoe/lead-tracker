import { createClient } from '@supabase/supabase-js';
import { normalizeServiceType } from '../src/utils/service-type-normalization';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function normalizeExistingData() {
  console.log('Starting normalization of existing service types...');
  
  try {
    // Fetch all leads with service_type
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, service_type')
      .not('service_type', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      return;
    }
    
    if (!leads || leads.length === 0) {
      console.log('No leads found with service types');
      return;
    }
    
    console.log(`Found ${leads.length} leads with service types`);
    
    // Count unique types before normalization
    const uniqueBefore = new Set(leads.map(l => l.service_type));
    console.log(`Unique service types before: ${uniqueBefore.size}`);
    
    // Prepare updates
    const updates = leads.map(lead => ({
      id: lead.id,
      original: lead.service_type,
      normalized: normalizeServiceType(lead.service_type)
    }));
    
    // Count unique types after normalization
    const uniqueAfter = new Set(updates.map(u => u.normalized).filter(Boolean));
    console.log(`Unique service types after: ${uniqueAfter.size}`);
    console.log(`Reduction: ${uniqueBefore.size - uniqueAfter.size} types (${((uniqueBefore.size - uniqueAfter.size) / uniqueBefore.size * 100).toFixed(1)}%)`);
    
    // Show some examples
    console.log('\nNormalization examples:');
    const examples = new Map<string, Set<string>>();
    updates.forEach(u => {
      if (u.normalized && u.original !== u.normalized) {
        if (!examples.has(u.normalized)) {
          examples.set(u.normalized, new Set());
        }
        examples.get(u.normalized)!.add(u.original);
      }
    });
    
    Array.from(examples.entries()).slice(0, 10).forEach(([normalized, originals]) => {
      console.log(`  ${normalized}: ${Array.from(originals).slice(0, 5).join(', ')}${originals.size > 5 ? ` + ${originals.size - 5} more` : ''}`);
    });
    
    // Update in batches
    console.log('\nUpdating database...');
    const batchSize = 100;
    let totalUpdated = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Update each lead in the batch
      const promises = batch.map(update => 
        supabase
          .from('leads')
          .update({ normalized_service_type: update.normalized })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error(`Errors in batch ${Math.floor(i / batchSize) + 1}:`, errors[0].error);
      }
      
      totalUpdated += batch.length - errors.length;
      
      if ((i + batchSize) % 1000 === 0 || i + batchSize >= updates.length) {
        console.log(`Progress: ${Math.min(i + batchSize, updates.length)}/${updates.length} leads processed`);
      }
    }
    
    console.log(`\nNormalization complete! Updated ${totalUpdated} leads.`);
    
    // Show final stats
    const { data: finalStats } = await supabase
      .from('leads')
      .select('service_type, normalized_service_type')
      .not('service_type', 'is', null);
    
    if (finalStats) {
      const finalUnique = new Set(finalStats.map(l => l.normalized_service_type || l.service_type));
      console.log(`\nFinal unique service types: ${finalUnique.size}`);
    }
    
  } catch (error) {
    console.error('Error during normalization:', error);
  }
}

// Run the normalization
normalizeExistingData().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});