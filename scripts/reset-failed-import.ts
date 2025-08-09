import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetFailedImports() {
  try {
    // Find all search results that were marked as completed but have 0 leads imported
    const { data: failedImports, error: fetchError } = await supabase
      .from('apify_search_results')
      .select('*')
      .eq('import_status', 'completed')
      .eq('leads_imported', 0);

    if (fetchError) {
      console.error('Error fetching failed imports:', fetchError);
      return;
    }

    if (!failedImports || failedImports.length === 0) {
      console.log('No failed imports found');
      return;
    }

    console.log(`Found ${failedImports.length} failed imports to reset`);

    // Reset each one
    for (const searchResult of failedImports) {
      console.log(`Resetting import for search ID: ${searchResult.id}`);
      
      const { error: updateError } = await supabase
        .from('apify_search_results')
        .update({
          import_status: 'ready',
          import_completed_at: null,
          leads_imported: 0,
          import_operation_id: null,
          import_error: null
        })
        .eq('id', searchResult.id);

      if (updateError) {
        console.error(`Error resetting import ${searchResult.id}:`, updateError);
      } else {
        console.log(`Successfully reset import ${searchResult.id}`);
      }
    }

    console.log('Done resetting failed imports');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetFailedImports();