import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads
    const { data: allLeads, error: allError } = await supabase
      .from('leads')
      .select('id, search_query, city, state')
      .eq('user_id', user.id);

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    // Count by search query
    const searchQueryCounts = new Map<string, number>();
    let emptySearchQueryCount = 0;
    let phoenixLeadsWithoutQuery = 0;

    allLeads?.forEach(lead => {
      if (!lead.search_query || lead.search_query.trim() === '') {
        emptySearchQueryCount++;
        if (lead.city === 'Phoenix' && lead.state === 'AZ') {
          phoenixLeadsWithoutQuery++;
        }
      } else {
        searchQueryCounts.set(lead.search_query, (searchQueryCounts.get(lead.search_query) || 0) + 1);
      }
    });

    // Get turf-related searches
    const turfSearches = Array.from(searchQueryCounts.entries())
      .filter(([query]) => query.toLowerCase().includes('turf'))
      .sort((a, b) => b[1] - a[1]);

    return NextResponse.json({
      totalLeads: allLeads?.length || 0,
      emptySearchQueryCount,
      phoenixLeadsWithoutQuery,
      searchQueryCounts: Object.fromEntries(searchQueryCounts),
      turfSearches,
      topSearchQueries: Array.from(searchQueryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}