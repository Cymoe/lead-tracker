import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts of different lead states
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, company_name, city, state, search_query, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    // Analyze the leads
    const analysis = {
      total: allLeads?.length || 0,
      withSearchQuery: 0,
      withoutSearchQuery: 0,
      withLocation: 0,
      withoutLocation: 0,
      recentLeadsWithoutQuery: [],
      leadsBySearchQuery: new Map<string, number>(),
      leadsByLocation: new Map<string, number>()
    };

    allLeads?.forEach(lead => {
      // Count search queries
      if (lead.search_query) {
        analysis.withSearchQuery++;
        const key = lead.search_query;
        analysis.leadsBySearchQuery.set(key, (analysis.leadsBySearchQuery.get(key) || 0) + 1);
      } else {
        analysis.withoutSearchQuery++;
        // Track recent leads without query
        if (analysis.recentLeadsWithoutQuery.length < 10) {
          analysis.recentLeadsWithoutQuery.push({
            id: lead.id,
            company_name: lead.company_name,
            city: lead.city || 'null',
            state: lead.state || 'null',
            created_at: lead.created_at
          });
        }
      }

      // Count locations
      if (lead.city && lead.state) {
        analysis.withLocation++;
        const locKey = `${lead.city}, ${lead.state}`;
        analysis.leadsByLocation.set(locKey, (analysis.leadsByLocation.get(locKey) || 0) + 1);
      } else {
        analysis.withoutLocation++;
      }
    });

    return NextResponse.json({
      analysis: {
        ...analysis,
        leadsBySearchQuery: Object.fromEntries(analysis.leadsBySearchQuery),
        leadsByLocation: Object.fromEntries(analysis.leadsByLocation)
      },
      summary: {
        percentWithSearchQuery: ((analysis.withSearchQuery / analysis.total) * 100).toFixed(1),
        percentWithLocation: ((analysis.withLocation / analysis.total) * 100).toFixed(1)
      }
    });

  } catch (error) {
    console.error('Error in debug:', error);
    return NextResponse.json(
      { error: 'Failed to debug leads' },
      { status: 500 }
    );
  }
}