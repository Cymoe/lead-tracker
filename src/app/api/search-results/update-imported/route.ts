import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { searchResultId, importedLeadIds } = await request.json();

    if (!searchResultId || !importedLeadIds) {
      return NextResponse.json({ error: 'searchResultId and importedLeadIds are required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the imported lead IDs
    const { error } = await supabase
      .from('apify_search_results')
      .update({ 
        imported_lead_ids: importedLeadIds 
      })
      .eq('id', searchResultId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating imported lead IDs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update imported API:', error);
    return NextResponse.json(
      { error: 'Failed to update imported lead IDs' },
      { status: 500 }
    );
  }
}