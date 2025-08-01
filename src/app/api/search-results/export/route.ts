import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

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

    // Fetch the search result
    const { data, error } = await supabase
      .from('apify_search_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Search result not found' }, { status: 404 });
    }

    // Convert results to CSV
    const results = data.results as any[];
    const headers = [
      'Company Name',
      'Address',
      'City',
      'Phone',
      'Website',
      'Email',
      'Rating',
      'Reviews',
      'Opportunity Score',
      'Quality Signals',
      'Social Media',
      'Service Type',
      'Search Location'
    ];

    const csvRows = [
      headers.join(','), // Header row
      ...results.map(result => {
        const socialMedia = [];
        if (result.social_media?.facebook?.length) socialMedia.push(`Facebook: ${result.social_media.facebook[0]}`);
        if (result.social_media?.instagram?.length) socialMedia.push(`Instagram: ${result.social_media.instagram[0]}`);
        if (result.social_media?.linkedin?.length) socialMedia.push(`LinkedIn: ${result.social_media.linkedin[0]}`);
        
        const row = [
          `"${result.name || ''}"`,
          `"${result.formatted_address || ''}"`,
          `"${data.search_params.city || ''}"`,
          `"${result.formatted_phone_number || ''}"`,
          `"${result.website || ''}"`,
          `"${result.emails?.join('; ') || ''}"`,
          result.rating || '',
          result.user_ratings_total || '',
          result.opportunity_score || '',
          `"${result.quality_signals?.join('; ') || ''}"`,
          `"${socialMedia.join('; ') || ''}"`,
          `"${data.search_params.serviceType || ''}"`,
          `"${data.search_params.city || ''}"`,
        ];
        return row.join(',');
      })
    ];

    const csv = csvRows.join('\n');
    const filename = `search-results-${data.search_params.serviceType}-${data.search_params.city}-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting search results:', error);
    return NextResponse.json(
      { error: 'Failed to export search results' },
      { status: 500 }
    );
  }
}