import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function deleteAllLeads() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Authenticating...');
  
  // First, we need to authenticate as a user
  // For now, let's just query to see what we can access
  const { data: leads, error: fetchError, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  if (fetchError) {
    console.error('Error fetching leads:', fetchError);
    return;
  }
  
  console.log(`Found ${count} leads`);
  
  if (count && count > 0) {
    // Delete all leads
    const { error: deleteError, count: deletedCount } = await supabase
      .from('leads')
      .delete()
      .gte('created_at', '1900-01-01'); // This ensures we match all records
    
    if (deleteError) {
      console.error('Error deleting leads:', deleteError);
      console.error('Details:', deleteError.message);
      console.error('Hint:', deleteError.hint);
    } else {
      console.log(`Successfully deleted ${deletedCount || 'all'} leads!`);
    }
  } else {
    console.log('No leads to delete');
  }
}

deleteAllLeads().catch(console.error);