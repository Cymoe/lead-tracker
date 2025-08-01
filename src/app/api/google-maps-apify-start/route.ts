import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      serviceType,
      city,
      radius = 10000,
      maxResults = 50,
      includeReviews = false,
      includeContacts = false,
      includeImages = false,
      minRating,
      onlyNoWebsite = false
    } = await request.json();
    
    if (!serviceType || !city) {
      return NextResponse.json({ error: 'Service type and city are required' }, { status: 400 });
    }
    
    const apifyToken = process.env.APIFY_API_TOKEN;
    
    if (!apifyToken) {
      return NextResponse.json({ 
        error: 'Apify API token not configured',
        setupInstructions: true 
      }, { status: 500 });
    }
    
    // Prepare Apify input
    const apifyInput = {
      searchStringsArray: [`${serviceType} in ${city}`],
      locationQuery: city,
      ...(maxResults < 9999 && { maxCrawledPlacesPerSearch: maxResults }),
      language: 'en',
      ...(minRating && { placeMinimumStars: minRating }),
      ...(onlyNoWebsite && { website: 'withoutWebsite' }),
      ...(includeContacts && { scrapeContacts: true }),
      ...(includeReviews && { maxReviews: 10 }),
      ...(includeImages && { maxImages: 5 }),
      scrapePlaceDetailPage: true,
      skipClosedPlaces: true
    };
    
    // Start the Apify actor
    const actorId = 'compass~crawler-google-places';
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`;
    
    console.log('Starting Apify Google Maps scraper...');
    console.log('Input:', JSON.stringify(apifyInput, null, 2));
    
    const runResponse = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apifyInput),
    });
    
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run failed:', errorText);
      return NextResponse.json({ error: 'Failed to start Apify scraper' }, { status: 500 });
    }
    
    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    // Return the run ID immediately so the client can poll for status
    return NextResponse.json({ 
      runId,
      actorId,
      message: 'Apify scraper started successfully'
    });
    
  } catch (error) {
    console.error('Error starting Apify search:', error);
    return NextResponse.json({ error: 'Failed to start Apify search' }, { status: 500 });
  }
}