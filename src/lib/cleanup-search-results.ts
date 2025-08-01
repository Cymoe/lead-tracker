import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Clean up expired search results from the database
 * This can be called from an API route or scheduled job
 */
export async function cleanupExpiredSearchResults() {
  const cookieStore = cookies();
  const supabase = createClient();

  try {
    // Call the cleanup function we created in the migration
    const { error } = await supabase.rpc('cleanup_expired_search_results');
    
    if (error) {
      console.error('Error cleaning up expired search results:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in cleanup:', error);
    return { success: false, error: 'Failed to cleanup expired search results' };
  }
}