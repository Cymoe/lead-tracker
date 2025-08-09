import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function checkLeadSources() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Checking lead sources in database...');
  
  // Get all unique lead sources
  const { data: leads, error } = await supabase
    .from('leads')
    .select('lead_source')
    .limit(1000);
  
  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }
  
  // Count occurrences of each lead source
  const sourceCounts = new Map<string, number>();
  
  leads?.forEach(lead => {
    const source = lead.lead_source || 'Unknown';
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  });
  
  console.log('\nLead sources found:');
  Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count} leads`);
    });
}

checkLeadSources().catch(console.error);