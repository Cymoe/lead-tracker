import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');
    const actorId = searchParams.get('actorId') || 'compass~crawler-google-places';
    
    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }
    
    const apifyToken = process.env.APIFY_API_TOKEN;
    
    if (!apifyToken) {
      return NextResponse.json({ 
        error: 'Apify API token not configured',
        setupInstructions: true 
      }, { status: 500 });
    }
    
    // Check run status
    const statusResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apifyToken}`
    );
    
    if (!statusResponse.ok) {
      return NextResponse.json({ error: 'Failed to check run status' }, { status: 500 });
    }
    
    const runData = await statusResponse.json();
    const status = runData.data.status;
    
    // If still running, return status
    if (status === 'RUNNING' || status === 'READY') {
      return NextResponse.json({ 
        status,
        message: runData.data.statusMessage || 'Processing...'
      });
    }
    
    // If failed, return error
    if (status !== 'SUCCEEDED') {
      return NextResponse.json({ 
        status,
        error: runData.data.statusMessage || 'Run failed',
        details: runData.data
      }, { status: 500 });
    }
    
    // Get results
    const datasetId = runData.data.defaultDatasetId;
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
    );
    
    if (!resultsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }
    
    const results = await resultsResponse.json();
    
    // Transform results to match our format
    const enrichedResults = results.map((place: any) => ({
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
      reviews: place.reviews || [],
      images: place.images || [],
      // Scoring
      opportunity_score: calculateOpportunityScore(place),
      quality_signals: getQualitySignals(place),
      import_ready: {
        company_name: place.title,
        address: place.address,
        phone: place.phone || '',
        website: place.website || '',
        service_type: '', // Will be set by frontend
        source: 'Apify Google Maps',
        notes: generateNotes(place)
      }
    }));
    
    // Sort by opportunity score
    enrichedResults.sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);
    
    // Calculate cost estimate
    const costEstimate = calculateCostEstimate(results.length, {
      includeReviews: results.some((r: any) => r.reviews?.length > 0),
      includeContacts: results.some((r: any) => r.emails?.length > 0),
      includeImages: results.some((r: any) => r.images?.length > 0),
      hasFilters: false
    });
    
    return NextResponse.json({ 
      status: 'SUCCEEDED',
      results: enrichedResults,
      total: enrichedResults.length,
      cost_estimate: costEstimate,
      apify_run_id: runId
    });
    
  } catch (error) {
    console.error('Error checking Apify status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

function calculateOpportunityScore(place: any): number {
  let score = 50; // Base score
  
  if (!place.website) {
    score += 30;
  }
  
  if (place.reviewsCount && place.reviewsCount < 50) {
    score += 20;
  } else if (place.reviewsCount && place.reviewsCount < 100) {
    score += 10;
  }
  
  if (place.totalScore && place.totalScore >= 3.5 && place.totalScore <= 4.2) {
    score += 15;
  }
  
  if (place.emails && place.emails.length > 0) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function getQualitySignals(place: any): string[] {
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

function generateNotes(place: any): string {
  const notes = [];
  
  if (!place.website) {
    notes.push('No website found - high priority lead');
  }
  
  if (place.totalScore) {
    notes.push(`${place.totalScore}⭐ rating with ${place.reviewsCount || 0} reviews`);
  }
  
  if (place.emails && place.emails.length > 0) {
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
    place_details: placeCount * 0.002,
    contact_enrichment: options.includeContacts ? placeCount * 0.002 : 0,
    reviews: options.includeReviews ? placeCount * 10 * 0.0005 : 0,
    images: options.includeImages ? placeCount * 5 * 0.0005 : 0,
  };
  
  const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  
  return {
    total_cost: Math.round(total * 1000) / 1000,
    breakdown: costs,
    cost_per_lead: Math.round((total / placeCount) * 1000) / 1000
  };
}