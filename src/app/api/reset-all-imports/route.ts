import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset ALL import statuses for the current user
    const { error: updateError } = await supabase
      .from('apify_search_results')
      .update({
        import_status: 'ready',
        import_completed_at: null,
        leads_imported: 0,
        import_operation_id: null,
        import_error: null,
        import_started_at: null
      })
      .eq('user_id', user.id)
      .in('import_status', ['completed', 'failed', 'processing']);

    if (updateError) {
      console.error('Error resetting imports:', updateError);
      return NextResponse.json({ error: 'Failed to reset imports' }, { status: 500 });
    }

    // Get count of reset imports
    const { count } = await supabase
      .from('apify_search_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('import_status', 'ready');

    return NextResponse.json({ 
      success: true, 
      message: `Reset ${count || 0} import records` 
    });
  } catch (error) {
    console.error('Error in reset-all-imports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}