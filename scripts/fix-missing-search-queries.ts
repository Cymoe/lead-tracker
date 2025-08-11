import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the project root
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl ? 'Found' : 'Missing'
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', '));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingSearchQueries() {
  try {
    // Get all leads
    const { data: allLeads, error: fetchError } = await supabase
      .from('leads')
      .select('id, company_name, search_query, service_type, city, state, user_id')
      .eq('lead_source', 'Google Maps')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      return;
    }

    console.log(`Total Google Maps leads: ${allLeads?.length || 0}`);

    // Group by search_query to see distribution
    const searchQueryGroups = new Map<string, number>();
    const leadsNeedingFix: any[] = [];

    allLeads?.forEach(lead => {
      const searchQuery = lead.search_query || '(empty)';
      searchQueryGroups.set(searchQuery, (searchQueryGroups.get(searchQuery) || 0) + 1);
      
      if (!lead.search_query || lead.search_query.trim() === '') {
        leadsNeedingFix.push(lead);
      }
    });

    console.log('\nSearch query distribution:');
    Array.from(searchQueryGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([query, count]) => {
        console.log(`  "${query}": ${count} leads`);
      });

    console.log(`\nLeads needing search_query fix: ${leadsNeedingFix.length}`);

    if (leadsNeedingFix.length > 0) {
      console.log('\nFixing missing search queries...');
      
      let fixed = 0;
      for (const lead of leadsNeedingFix) {
        if (lead.service_type && lead.city && lead.state) {
          const searchQuery = `${lead.service_type} in ${lead.city}, ${lead.state}`;
          
          const { error: updateError } = await supabase
            .from('leads')
            .update({ search_query: searchQuery })
            .eq('id', lead.id);
            
          if (!updateError) {
            fixed++;
            console.log(`Fixed: ${lead.company_name} -> "${searchQuery}"`);
          } else {
            console.error(`Error fixing ${lead.company_name}:`, updateError);
          }
        } else {
          console.log(`Skipping ${lead.company_name} - missing required fields`);
        }
      }
      
      console.log(`\nFixed ${fixed} leads with search queries`);
    }

    // Re-check distribution
    const { data: updatedLeads } = await supabase
      .from('leads')
      .select('search_query')
      .eq('lead_source', 'Google Maps');

    const updatedGroups = new Map<string, number>();
    updatedLeads?.forEach(lead => {
      const searchQuery = lead.search_query || '(empty)';
      updatedGroups.set(searchQuery, (updatedGroups.get(searchQuery) || 0) + 1);
    });

    console.log('\nUpdated search query distribution:');
    Array.from(updatedGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([query, count]) => {
        console.log(`  "${query}": ${count} leads`);
      });

  } catch (error) {
    console.error('Error:', error);
  }
}

fixMissingSearchQueries();