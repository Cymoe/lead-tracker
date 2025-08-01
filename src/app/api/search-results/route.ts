import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { 
      searchType, 
      searchParams, 
      results, 
      searchMode, 
      costEstimate,
      searchDuration,
      apifyRunId 
    } = await request.json();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Calculate additional metrics
    const contactsFound = results.filter((r: any) => 
      (r.emails && r.emails.length > 0) || 
      (r.formatted_phone_number && r.formatted_phone_number.length > 0)
    ).length;
    
    const emailsFound = results.filter((r: any) => 
      r.emails && r.emails.length > 0
    ).length;
    
    const highQualityLeads = results.filter((r: any) => 
      r.opportunity_score >= 80
    ).length;

    // Save the search results with enhanced metadata
    const { data, error } = await supabase
      .from('apify_search_results')
      .insert({
        user_id: user.id,
        search_type: searchType,
        search_params: searchParams,
        results: results,
        result_count: results.length,
        search_mode: searchMode || null,
        cost_estimate: costEstimate || null,
        expires_at: expiresAt.toISOString(),
        total_cost: costEstimate?.total_cost || null,
        contacts_found: contactsFound,
        emails_found: emailsFound,
        high_quality_leads: highQualityLeads,
        search_duration_seconds: searchDuration || null,
        apify_run_id: apifyRunId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving search results:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, expiresAt: data.expires_at });
  } catch (error) {
    console.error('Error in search results API:', error);
    return NextResponse.json(
      { error: 'Failed to save search results' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { searchParams } = new URL(request.url);
    const searchType = searchParams.get('searchType');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('apify_search_results')
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by search type if provided
    if (searchType) {
      query = query.eq('search_type', searchType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching search results:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: data || [] });
  } catch (error) {
    console.error('Error in search results API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the search result (RLS will ensure user owns it)
    const { error } = await supabase
      .from('apify_search_results')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting search result:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in search results API:', error);
    return NextResponse.json(
      { error: 'Failed to delete search result' },
      { status: 500 }
    );
  }
}