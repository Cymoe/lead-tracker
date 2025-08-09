import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const { searchResultId } = await request.json();

    if (!searchResultId) {
      return NextResponse.json({ error: 'Search result ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset the import status
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
      .eq('id', searchResultId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error resetting import:', updateError);
      return NextResponse.json({ error: 'Failed to reset import' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in reset-failed-import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}