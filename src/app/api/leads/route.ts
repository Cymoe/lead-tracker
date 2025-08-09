import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dbToAppLead } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const serviceType = searchParams.get('serviceType');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (city && city !== 'All') {
      query = query.ilike('city', city);
    }
    
    if (serviceType && serviceType !== 'All') {
      query = query.ilike('service_type', `%${serviceType}%`);
    }
    
    if (source) {
      query = query.eq('lead_source', source);
    }
    
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,handle.ilike.%${search}%,city.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    const leads = (data || []).map(dbToAppLead);

    return NextResponse.json({
      leads,
      totalCount: count || 0,
      page,
      pageSize,
      hasMore: to < (count || 0) - 1
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}