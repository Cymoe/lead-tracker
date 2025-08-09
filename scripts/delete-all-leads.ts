import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteAllLeads() {
  console.log('Deleting all leads...');
  
  // First count the leads
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Found ${count} leads to delete`);
  
  // Then delete them all
  const { error } = await supabase
    .from('leads')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    console.error('Error deleting leads:', error);
  } else {
    console.log(`Successfully deleted all leads!`);
  }
}

deleteAllLeads();