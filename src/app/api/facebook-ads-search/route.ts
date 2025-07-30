import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FacebookAdResult {
  id: string;
  page_name: string;
  page_id?: string;
  ad_creative_body?: string;
  ad_creative_link_caption?: string;
  ad_creative_link_description?: string;
  ad_creative_link_title?: string;
  call_to_action?: string;
  started_running?: string;
  currency?: string;
  spend?: {
    lower_bound?: string;
    upper_bound?: string;
  };
  impressions?: {
    lower_bound?: string;
    upper_bound?: string;
  };
  targeting?: {
    location?: string[];
    age_range?: string;
    gender?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { keyword, location, limit = 50 } = await request.json();
    
    if (!keyword || !location) {
      return NextResponse.json({ error: 'Keyword and location are required' }, { status: 400 });
    }
    
    const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
    
    if (!scrapingBeeKey) {
      console.error('ScrapingBee API key not found in environment variables');
      return NextResponse.json({ 
        error: 'ScrapingBee API key not configured. Please add SCRAPINGBEE_API_KEY to your .env.local file',
        setupInstructions: true 
      }, { status: 500 });
    }
    
    console.log(`ScrapingBee API Key: ${scrapingBeeKey.substring(0, 10)}...`);
    console.log(`Searching Facebook Ad Library for: ${keyword} in ${location}`);
    
    // Test mode for development
    const testMode = keyword.toLowerCase() === 'test';
    if (testMode) {
      console.log('Running in test mode with mock data');
      const mockResults = generateMockResults(keyword, location, limit);
      return NextResponse.json({ 
        results: mockResults,
        total: mockResults.length,
        search_params: { keyword, location, limit },
        test_mode: true
      });
    }
    
    // Build the Facebook Ad Library URL
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
    
    // Use ScrapingBee with JavaScript rendering
    const response = await fetch(`https://app.scrapingbee.com/api/v1/?` + new URLSearchParams({
      api_key: scrapingBeeKey,
      url: searchUrl,
      render_js: 'true',
      wait: '5000',
      js_scenario: JSON.stringify({
        instructions: [
          { wait: 2000 },
          { scroll_y: 1000 },
          { wait: 2000 },
          { scroll_y: 2000 },
          { wait: 2000 },
          { scroll_y: 3000 },
          { wait: 2000 },
          { scroll_y: 4000 },
          { wait: 2000 }
        ]
      })
    }).toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ScrapingBee error response:', errorText);
      console.error('Response status:', response.status);
      throw new Error(`ScrapingBee request failed: ${response.statusText} - ${errorText}`);
    }
    
    const html = await response.text();
    console.log('Received HTML length:', html.length);
    
    // Parse the Facebook Ad Library results
    const results = parseFacebookAds(html, location, limit);
    
    // Enrich and score the results
    const enrichedResults = results.map(ad => ({
      ...ad,
      import_ready: {
        company_name: ad.page_name,
        service_type: detectServiceType(ad.page_name, ad.ad_creative_body || ''),
        lead_source: 'FB Ad Library',
        running_ads: true,
        ad_start_date: ad.started_running,
        ad_copy: ad.ad_creative_body,
        ad_call_to_action: ad.call_to_action,
        notes: generateNotes(ad),
        city: location.split(',')[0].trim(),
        state: location.split(',')[1]?.trim() || ''
      },
      quality_score: calculateQualityScore(ad),
      signals: getQualitySignals(ad)
    }));
    
    // Sort by quality score
    enrichedResults.sort((a, b) => b.quality_score - a.quality_score);
    
    return NextResponse.json({ 
      results: enrichedResults,
      total: enrichedResults.length,
      search_params: { keyword, location, limit }
    });
    
  } catch (error) {
    console.error('Error searching Facebook ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to search Facebook ads',
      details: errorMessage,
      hint: errorMessage.includes('401') ? 'Invalid API key - please check your ScrapingBee API key' : 
            errorMessage.includes('402') ? 'ScrapingBee credits exhausted - please check your account' :
            errorMessage.includes('429') ? 'Rate limit exceeded - please try again in a moment' :
            'Check server logs for more details'
    }, { status: 500 });
  }
}

function parseFacebookAds(html: string, location: string, limit: number): FacebookAdResult[] {
  const results: FacebookAdResult[] = [];
  
  console.log('Starting to parse Facebook ads from HTML...');
  
  // First, check if we're on the Ad Library page
  if (html.includes('Ad Library') || html.includes('Ads about social issues')) {
    console.log('Confirmed: Facebook Ad Library page detected');
  }
  
  // Try multiple parsing strategies
  
  // Strategy 1: Look for advertiser names with common patterns
  const advertiserPatterns = [
    /data-testid="[^"]*"[^>]*>([^<]+(?:LLC|Inc|Corp|Co\.|Company|Services?|Plumbing|HVAC|Landscaping|Roofing|Electrical|Painting|Construction|Contractors?|Repair|Maintenance)[^<]*)</gi,
    /<a[^>]*href="[^"]*facebook\.com[^"]*"[^>]*>([^<]+)<\/a>/gi,
    /<span[^>]*>([A-Z][^<]+(?:LLC|Inc|Corp|Services?|Plumbing|HVAC|Landscaping|Roofing)[^<]*)<\/span>/gi
  ];
  
  const foundNames = new Set<string>();
  
  for (const pattern of advertiserPatterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      const name = match[1].trim();
      // Filter out UI elements and common false positives
      if (name.length > 3 && 
          !name.includes('Facebook') && 
          !name.includes('Meta') && 
          !name.includes('Ad Library') &&
          !name.includes('See more') &&
          !name.includes('Filter') &&
          !name.includes('Search') &&
          !name.includes('Loading') &&
          !name.includes('Privacy') &&
          !name.includes('Terms') &&
          !name.includes('Settings')) {
        foundNames.add(name);
      }
    }
  }
  
  console.log(`Found ${foundNames.size} potential advertisers`);
  
  // Convert found names to results
  let index = 0;
  const namesArray = Array.from(foundNames);
  for (const name of namesArray) {
    if (index >= limit) break;
    
    results.push({
      id: `fb_${Date.now()}_${index}`,
      page_name: name,
      ad_creative_body: '', // We'll try to extract this in a future update
      call_to_action: '',
      started_running: '',
      targeting: {
        location: [location]
      }
    });
    index++;
  }
  
  // If we didn't find enough results, try a simpler approach
  if (results.length < 5) {
    console.log('Trying fallback parsing strategy...');
    
    // Look for any business-like names
    const simplePattern = /([A-Z][a-zA-Z\s&'-]+)\s+(Services?|LLC|Inc|Corp|Co\.|Company|Plumbing|HVAC|AC|Air|Landscaping|Lawn|Roofing|Roof|Electrical|Electric|Painting|Paint|Construction|Contractor|Repair|Maintenance)/g;
    const simpleMatches = Array.from(html.matchAll(simplePattern));
    
    for (const match of simpleMatches) {
      if (results.length >= limit) break;
      
      const fullName = match[0].trim();
      if (!foundNames.has(fullName)) {
        results.push({
          id: `fb_${Date.now()}_${results.length}`,
          page_name: fullName,
          targeting: {
            location: [location]
          }
        });
      }
    }
  }
  
  console.log(`Final result count: ${results.length}`);
  return results;
}

function detectServiceType(companyName: string, adText: string): string {
  const combined = `${companyName} ${adText}`.toLowerCase();
  
  const servicePatterns = [
    { pattern: /\b(hvac|heating|cooling|air\s*condition|ac\s*repair|furnace)\b/i, type: 'HVAC' },
    { pattern: /\b(plumb|pipe|drain|water\s*heater|leak)\b/i, type: 'Plumbing' },
    { pattern: /\b(landscap|lawn|garden|tree|yard|mowing)\b/i, type: 'Landscaping' },
    { pattern: /\b(roof|shingle|gutter)\b/i, type: 'Roofing' },
    { pattern: /\b(paint|coating|stain)\b/i, type: 'Painting' },
    { pattern: /\b(electric|wire|circuit|outlet)\b/i, type: 'Electrical' },
    { pattern: /\b(pest|termite|exteminat|rodent)\b/i, type: 'Pest Control' },
    { pattern: /\b(pool|spa|hot\s*tub)\b/i, type: 'Pool Service' },
    { pattern: /\b(window|glass|glazing)\b/i, type: 'Window Installation' },
    { pattern: /\b(floor|carpet|tile|hardwood)\b/i, type: 'Flooring' },
    { pattern: /\b(fence|gate)\b/i, type: 'Fencing' },
    { pattern: /\b(concrete|asphalt|paving|driveway)\b/i, type: 'Concrete' },
    { pattern: /\b(remodel|renovation|kitchen|bathroom)\b/i, type: 'Remodeling' },
    { pattern: /\b(clean|maid|janitor)\b/i, type: 'Cleaning Service' },
    { pattern: /\b(secur|alarm|camera)\b/i, type: 'Security' }
  ];
  
  for (const { pattern, type } of servicePatterns) {
    if (pattern.test(combined)) {
      return type;
    }
  }
  
  return 'General Contractor';
}

function calculateQualityScore(ad: FacebookAdResult): number {
  let score = 50; // Base score
  
  // Has ad copy = engaged advertiser
  if (ad.ad_creative_body && ad.ad_creative_body.length > 50) {
    score += 20;
  }
  
  // Has CTA = professional ad
  if (ad.call_to_action) {
    score += 15;
  }
  
  // Long-running ad = established
  if (ad.started_running) {
    const startDate = new Date(ad.started_running);
    const daysRunning = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysRunning > 30) score += 10;
    if (daysRunning > 90) score += 5;
  }
  
  // Has spend data = serious advertiser
  if (ad.spend) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function getQualitySignals(ad: FacebookAdResult): string[] {
  const signals = [];
  
  if (ad.call_to_action) {
    signals.push('✅ Professional Ad');
  }
  
  if (ad.started_running) {
    const startDate = new Date(ad.started_running);
    const daysRunning = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRunning > 30) {
      signals.push(`📅 Active ${daysRunning}+ days`);
    }
  }
  
  if (ad.spend?.lower_bound) {
    signals.push('💰 Ad Spend Data');
  }
  
  if (ad.ad_creative_body && ad.ad_creative_body.length > 100) {
    signals.push('📝 Detailed Ad Copy');
  }
  
  return signals;
}

function generateNotes(ad: FacebookAdResult): string {
  const notes = [];
  
  if (ad.started_running) {
    notes.push(`Running ads since ${ad.started_running}`);
  }
  
  if (ad.call_to_action) {
    notes.push(`CTA: ${ad.call_to_action}`);
  }
  
  if (ad.spend?.lower_bound && ad.spend?.upper_bound) {
    notes.push(`Estimated spend: $${ad.spend.lower_bound}-$${ad.spend.upper_bound}`);
  }
  
  return notes.join('. ');
}

function generateMockResults(keyword: string, location: string, limit: number): any[] {
  const mockBusinessTypes = [
    'Plumbing', 'HVAC', 'Landscaping', 'Roofing', 'Electrical',
    'Painting', 'Concrete', 'Pool Service', 'Pest Control', 'Remodeling'
  ];
  
  const mockResults = [];
  const count = Math.min(limit, 20);
  
  for (let i = 0; i < count; i++) {
    const businessType = mockBusinessTypes[i % mockBusinessTypes.length];
    const days = Math.floor(Math.random() * 180) + 1;
    const score = Math.floor(Math.random() * 40) + 60;
    
    mockResults.push({
      id: `fb_test_${i}`,
      page_name: `${location.split(',')[0]} ${businessType} Services ${i + 1}`,
      ad_creative_body: `Professional ${businessType.toLowerCase()} services in ${location}. Licensed and insured. Call today for a free estimate!`,
      call_to_action: 'Learn More',
      started_running: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString(),
      import_ready: {
        company_name: `${location.split(',')[0]} ${businessType} Services ${i + 1}`,
        service_type: businessType,
        lead_source: 'FB Ad Library',
        running_ads: true,
        ad_start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString(),
        ad_copy: `Professional ${businessType.toLowerCase()} services in ${location}`,
        ad_call_to_action: 'Learn More',
        notes: `Running ads for ${days} days`,
        city: location.split(',')[0].trim(),
        state: location.split(',')[1]?.trim() || ''
      },
      quality_score: score,
      signals: [
        score >= 80 ? '✅ Professional Ad' : '',
        days > 30 ? `📅 Active ${days} days` : '',
        '📝 Detailed Ad Copy'
      ].filter(Boolean)
    });
  }
  
  return mockResults;
} 