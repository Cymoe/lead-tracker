import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads to analyze
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('id, company_name, search_query, service_type, city, state')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Analyze search_query field
    const analysis = {
      totalLeads: allLeads?.length || 0,
      withSearchQuery: 0,
      withoutSearchQuery: 0,
      searchQueryDistribution: {} as Record<string, number>,
      missingSearchQueryExamples: [] as any[],
      phoenixLeads: {
        total: 0,
        withSearchQuery: 0,
        withoutSearchQuery: 0
      }
    };

    allLeads?.forEach(lead => {
      if (lead.search_query && lead.search_query.trim() !== '') {
        analysis.withSearchQuery++;
        const query = lead.search_query.trim();
        analysis.searchQueryDistribution[query] = (analysis.searchQueryDistribution[query] || 0) + 1;
      } else {
        analysis.withoutSearchQuery++;
        if (analysis.missingSearchQueryExamples.length < 10) {
          analysis.missingSearchQueryExamples.push({
            company_name: lead.company_name,
            service_type: lead.service_type,
            city: lead.city,
            state: lead.state
          });
        }
      }

      // Check Phoenix leads specifically
      if (lead.city === 'Phoenix' && lead.state === 'AZ') {
        analysis.phoenixLeads.total++;
        if (lead.search_query && lead.search_query.trim() !== '') {
          analysis.phoenixLeads.withSearchQuery++;
        } else {
          analysis.phoenixLeads.withoutSearchQuery++;
        }
      }
    });

    // Sort search queries by count
    const sortedQueries = Object.entries(analysis.searchQueryDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return NextResponse.json({
      ...analysis,
      topSearchQueries: sortedQueries,
      searchQueryDistribution: undefined // Remove the full distribution from response
    });

  } catch (error) {
    console.error('Error analyzing search queries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}