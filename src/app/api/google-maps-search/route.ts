import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { serviceType, city, radius = 10000 } = await request.json();
    
    if (!serviceType || !city) {
      return NextResponse.json({ error: 'Service type and city are required' }, { status: 400 });
    }
    
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleApiKey) {
      return NextResponse.json({ 
        error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your .env.local file',
        setupInstructions: true 
      }, { status: 500 });
    }
    
    // Geocode the city
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    
    // Collect all results from multiple pages
    let allResults: any[] = [];
    let nextPageToken: string | null = null;
    let pageCount = 0;
    const maxPages = 3; // Google allows max 3 pages (60 results total)
    
    // Search for businesses with pagination
    do {
      const searchQuery = `${serviceType} near ${city}`;
      let placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` + 
        new URLSearchParams({
          location: `${lat},${lng}`,
          radius: radius.toString(),
          keyword: searchQuery,
          key: googleApiKey,
          type: 'establishment'
        }).toString();
      
      // Add page token if we have one
      if (nextPageToken) {
        placesUrl += `&pagetoken=${nextPageToken}`;
        // Google requires a short delay between pagination requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();
      
      if (placesData.results) {
        allResults = [...allResults, ...placesData.results];
      }
      
      nextPageToken = placesData.next_page_token || null;
      pageCount++;
      
    } while (nextPageToken && pageCount < maxPages);
    
    if (allResults.length === 0) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }
    
    // Get detailed information for each place (limit to 60 to avoid rate limits)
    const detailedResults = await Promise.all(
      allResults.slice(0, 60).map(async (place: any) => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
          new URLSearchParams({
            place_id: place.place_id,
            fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,opening_hours',
            key: googleApiKey
          }).toString();
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        return detailsData.result;
      })
    );
    
    // Score and enrich the results
    const enrichedResults = detailedResults.map(place => ({
      ...place,
      opportunity_score: calculateOpportunityScore(place),
      quality_signals: getQualitySignals(place),
      import_ready: {
        company_name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number || '',
        website: place.website || '',
        service_type: serviceType,
        source: 'Google Maps',
        notes: generateNotes(place)
      }
    }));
    
    // Sort by opportunity score
    enrichedResults.sort((a, b) => b.opportunity_score - a.opportunity_score);
    
    return NextResponse.json({ 
      results: enrichedResults,
      total: enrichedResults.length,
      search_params: { serviceType, city, radius }
    });
    
  } catch (error) {
    console.error('Error searching Google Maps:', error);
    return NextResponse.json({ error: 'Failed to search Google Maps' }, { status: 500 });
  }
}

function calculateOpportunityScore(place: PlaceResult): number {
  let score = 50; // Base score
  
  // No website = high opportunity
  if (!place.website) {
    score += 30;
  }
  
  // Low review count = less established, more opportunity
  if (place.user_ratings_total && place.user_ratings_total < 50) {
    score += 20;
  } else if (place.user_ratings_total && place.user_ratings_total < 100) {
    score += 10;
  }
  
  // Medium rating = room for improvement
  if (place.rating && place.rating >= 3.5 && place.rating <= 4.2) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

function getQualitySignals(place: PlaceResult): string[] {
  const signals = [];
  
  if (!place.website) {
    signals.push('🚨 No Website');
  }
  
  if (place.user_ratings_total && place.user_ratings_total < 50) {
    signals.push('🌱 Growing Business');
  }
  
  if (place.rating && place.rating < 4.0) {
    signals.push('⚡ Reputation Opportunity');
  }
  
  if (place.opening_hours?.open_now !== undefined) {
    signals.push('✅ Active Business');
  }
  
  return signals;
}

function generateNotes(place: PlaceResult): string {
  const notes = [];
  
  if (!place.website) {
    notes.push('No website found - high priority lead');
  }
  
  if (place.rating) {
    notes.push(`${place.rating}⭐ rating with ${place.user_ratings_total || 0} reviews`);
  }
  
  return notes.join('. ');
} 