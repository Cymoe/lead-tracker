import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ApifySearchParams {
  serviceType: string;
  city: string;
  radius?: number;
  maxResults?: number;
  includeReviews?: boolean;
  includeContacts?: boolean;
  includeImages?: boolean;
  minRating?: number;
  onlyNoWebsite?: boolean;
}

interface ApifyPlace {
  title: string;
  address: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  categoryName?: string;
  placeId: string;
  url: string;
  location?: {
    lat: number;
    lng: number;
  };
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  emails?: string[];
  instagrams?: string[];
  facebooks?: string[];
  linkedIns?: string[];
  twitters?: string[];
  reviews?: any[];
  images?: any[];
}

export const maxDuration = 300; // 5 minutes for Vercel

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
    }: ApifySearchParams = await request.json();
    
    if (!serviceType || !city) {
      return NextResponse.json({ error: 'Service type and city are required' }, { status: 400 });
    }
    
    const apifyToken = process.env.APIFY_API_TOKEN;
    
    if (!apifyToken) {
      return NextResponse.json({ 
        error: 'Apify API token not configured. Please add APIFY_API_TOKEN to your .env.local file',
        setupInstructions: true 
      }, { status: 500 });
    }
    
    // Prepare Apify input
    const apifyInput = {
      searchStringsArray: [`${serviceType} in ${city}`],
      locationQuery: city,
      // If maxResults is 9999 or higher, don't set a limit (gets all)
      ...(maxResults < 9999 && { maxCrawledPlacesPerSearch: maxResults }),
      language: 'en',
      // Filters
      ...(minRating && { placeMinimumStars: minRating }),
      // Only add website filter if explicitly requested
      ...(onlyNoWebsite && { website: 'withoutWebsite' }),
      // Add-ons
      ...(includeContacts && { scrapeContacts: true }),
      ...(includeReviews && { maxReviews: 10 }), // Limit to 10 reviews per place
      ...(includeImages && { maxImages: 5 }), // Limit to 5 images per place
      // Always get these for better lead scoring
      scrapePlaceDetailPage: true,
      skipClosedPlaces: true
    };
    
    // Start the Apify actor
    const actorId = 'compass~crawler-google-places';
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`;
    
    console.log('Starting Apify Google Maps scraper...');
    
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
      console.error('Input that failed:', JSON.stringify(apifyInput, null, 2));
      
      // Try to parse error for more details
      let errorMessage = 'Failed to start Apify scraper';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error.message || errorData.error;
        }
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorText,
        input: apifyInput 
      }, { status: 500 });
    }
    
    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    // For searches with contact extraction, increase timeout
    const maxWaitTime = includeContacts ? 600000 : 300000; // 10 minutes for contacts, 5 for regular
    const checkInterval = 5000; // Check every 5 seconds
    const startTime = Date.now();
    
    let runStatus = 'RUNNING';
    let runResult: any;
    
    console.log(`Waiting for run to complete (timeout: ${maxWaitTime/1000}s)...`);
    
    while (runStatus === 'RUNNING' && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apifyToken}`
      );
      
      if (statusResponse.ok) {
        runResult = await statusResponse.json();
        runStatus = runResult.data.status;
        
        // Log progress
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`Run status: ${runStatus} (${elapsed}s elapsed)`);
      }
    }
    
    if (runStatus !== 'SUCCEEDED') {
      console.error('Apify run did not complete successfully:', runStatus);
      console.error('Run details:', JSON.stringify(runResult.data, null, 2));
      
      // Get more details about the failure
      let errorDetails = '';
      if (runResult.data.statusMessage) {
        errorDetails = runResult.data.statusMessage;
      }
      
      return NextResponse.json({ 
        error: `Apify scraper ${runStatus.toLowerCase()}: ${errorDetails || 'Unknown error'}`,
        status: runStatus,
        runId: runId,
        details: runResult.data
      }, { status: 500 });
    }
    
    // Get the results from the dataset
    const datasetId = runResult.data.defaultDatasetId;
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
    );
    
    if (!resultsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch Apify results' }, { status: 500 });
    }
    
    const results = await resultsResponse.json();
    
    // Transform Apify results to match our format
    const enrichedResults = results.map((place: ApifyPlace) => ({
      place_id: place.placeId,
      name: place.title,
      formatted_address: place.address,
      formatted_phone_number: place.phone,
      website: place.website,
      rating: place.totalScore,
      user_ratings_total: place.reviewsCount,
      types: place.categoryName ? [place.categoryName] : [],
      geometry: place.location ? {
        location: {
          lat: place.location.lat,
          lng: place.location.lng
        }
      } : undefined,
      url: place.url,
      permanently_closed: place.permanentlyClosed,
      temporarily_closed: place.temporarilyClosed,
      // Apify-specific enriched data
      emails: place.emails || [],
      social_media: {
        instagram: place.instagrams || [],
        facebook: place.facebooks || [],
        linkedin: place.linkedIns || [],
        twitter: place.twitters || []
      },
      reviews: includeReviews ? (place.reviews || []) : [],
      images: includeImages ? (place.images || []) : [],
      // Scoring
      opportunity_score: calculateOpportunityScore(place),
      quality_signals: getQualitySignals(place),
      import_ready: {
        company_name: place.title,
        address: place.address,
        phone: place.phone || '',
        website: place.website || '',
        service_type: serviceType,
        source: 'Apify Google Maps',
        notes: generateNotes(place, includeContacts)
      }
    }));
    
    // Sort by opportunity score
    enrichedResults.sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);
    
    // Calculate cost estimate
    const costEstimate = calculateCostEstimate(results.length, {
      includeReviews,
      includeContacts,
      includeImages,
      hasFilters: !!minRating || onlyNoWebsite
    });
    
    return NextResponse.json({ 
      results: enrichedResults,
      total: enrichedResults.length,
      search_params: { serviceType, city, radius, maxResults },
      cost_estimate: costEstimate,
      apify_run_id: runId
    });
    
  } catch (error) {
    console.error('Error with Apify Google Maps search:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: `Apify search failed: ${errorMessage}`,
      details: errorStack
    }, { status: 500 });
  }
}

function calculateOpportunityScore(place: ApifyPlace): number {
  let score = 50; // Base score
  
  // No website = high opportunity
  if (!place.website) {
    score += 30;
  }
  
  // Low review count = less established, more opportunity
  if (place.reviewsCount && place.reviewsCount < 50) {
    score += 20;
  } else if (place.reviewsCount && place.reviewsCount < 100) {
    score += 10;
  }
  
  // Medium rating = room for improvement
  if (place.totalScore && place.totalScore >= 3.5 && place.totalScore <= 4.2) {
    score += 15;
  }
  
  // Has contact info = easier to reach
  if (place.emails && place.emails.length > 0) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function getQualitySignals(place: ApifyPlace): string[] {
  const signals = [];
  
  if (!place.website) {
    signals.push('🚨 No Website');
  }
  
  if (place.reviewsCount && place.reviewsCount < 50) {
    signals.push('🌱 Growing Business');
  }
  
  if (place.totalScore && place.totalScore < 4.0) {
    signals.push('⚡ Reputation Opportunity');
  }
  
  if (place.emails && place.emails.length > 0) {
    signals.push('📧 Email Available');
  }
  
  if (place.facebooks && place.facebooks.length > 0) {
    signals.push('📱 Social Media Present');
  }
  
  return signals;
}

function generateNotes(place: ApifyPlace, includeContacts: boolean): string {
  const notes = [];
  
  if (!place.website) {
    notes.push('No website found - high priority lead');
  }
  
  if (place.totalScore) {
    notes.push(`${place.totalScore}⭐ rating with ${place.reviewsCount || 0} reviews`);
  }
  
  if (includeContacts && place.emails && place.emails.length > 0) {
    notes.push(`Contact email available: ${place.emails[0]}`);
  }
  
  return notes.join('. ');
}

function calculateCostEstimate(
  placeCount: number, 
  options: {
    includeReviews: boolean;
    includeContacts: boolean;
    includeImages: boolean;
    hasFilters: boolean;
  }
): {
  total_cost: number;
  breakdown: Record<string, number>;
  cost_per_lead: number;
} {
  const costs = {
    actor_start: 0.007,
    place_scraped: placeCount * 0.004,
    filters: options.hasFilters ? placeCount * 0.001 : 0,
    place_details: placeCount * 0.002, // Always enabled for better data
    contact_enrichment: options.includeContacts ? placeCount * 0.002 : 0,
    reviews: options.includeReviews ? placeCount * 10 * 0.0005 : 0, // Assuming avg 10 reviews
    images: options.includeImages ? placeCount * 5 * 0.0005 : 0, // Assuming avg 5 images
  };
  
  const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  
  return {
    total_cost: Math.round(total * 1000) / 1000, // Round to 3 decimals
    breakdown: costs,
    cost_per_lead: Math.round((total / placeCount) * 1000) / 1000
  };
}