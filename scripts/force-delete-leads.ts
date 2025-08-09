import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function forceDeleteAllLeads() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Attempting to delete all leads...');
  console.log('Supabase URL:', supabaseUrl);
  
  // First, let's see what we can query
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, company_name, user_id')
    .limit(10);
  
  if (fetchError) {
    console.error('Error fetching leads:', fetchError);
    return;
  }
  
  console.log(`Sample leads found:`, leads);
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('No authenticated user. Trying to delete without user filter...');
    
    // Try to delete without user filter (will only work if RLS allows it)
    const { error: deleteError, count } = await supabase
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all non-zero IDs
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log(`Deleted ${count || 'all'} leads`);
    }
  } else {
    console.log('Authenticated as user:', user.id);
    
    // Delete for current user
    const { error: deleteError, count } = await supabase
      .from('leads')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log(`Deleted ${count || 'all'} leads for user ${user.id}`);
    }
  }
}

forceDeleteAllLeads().catch(console.error);