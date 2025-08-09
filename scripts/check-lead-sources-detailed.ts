import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function checkLeadSourcesDetailed() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Checking all lead sources in database...');
  
  // Get a sample of leads with their sources
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, company_name, lead_source')
    .limit(20);
  
  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }
  
  console.log('\nSample of leads:');
  leads?.forEach((lead, index) => {
    console.log(`${index + 1}. ${lead.company_name} - Source: "${lead.lead_source}"`);
  });
  
  // Get count by source
  const { data: allLeads, error: countError } = await supabase
    .from('leads')
    .select('lead_source');
    
  if (!countError && allLeads) {
    const sourceCounts = new Map<string, number>();
    allLeads.forEach(lead => {
      const source = lead.lead_source || 'null/undefined';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    
    console.log('\n\nTotal counts by source:');
    Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`  "${source}": ${count} leads`);
      });
  }
}

checkLeadSourcesDetailed().catch(console.error);