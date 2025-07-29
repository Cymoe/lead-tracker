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
      return NextResponse.json({ 
        error: 'ScrapingBee API key not configured. Please add SCRAPINGBEE_API_KEY to your .env.local file',
        setupInstructions: true 
      }, { status: 500 });
    }
    
    console.log(`Searching Facebook Ad Library for: ${keyword} in ${location}`);
    
    // Build the Facebook Ad Library URL
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
    
    // Use ScrapingBee with JavaScript rendering
    const response = await fetch(`https://app.scrapingbee.com/api/v1/?` + new URLSearchParams({
      api_key: scrapingBeeKey,
      url: searchUrl,
      render_js: 'true',
      wait: '5000',
      wait_for: '.x1xka2u1', // Wait for ad containers
      scroll: 'true', // Enable auto-scrolling
      js_scenario: JSON.stringify({
        instructions: [
          { wait: 2000 },
          { scroll_y: 1000 },
          { wait: 2000 },
          { scroll_y: 2000 },
          { wait: 2000 },
          { scroll_y: 3000 },
          { wait: 2000 }
        ]
      })
    }).toString());
    
    if (!response.ok) {
      throw new Error(`ScrapingBee request failed: ${response.statusText}`);
    }
    
    const html = await response.text();
    
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
    return NextResponse.json({ error: 'Failed to search Facebook ads' }, { status: 500 });
  }
}

function parseFacebookAds(html: string, location: string, limit: number): FacebookAdResult[] {
  const results: FacebookAdResult[] = [];
  
  // Extract ads using regex patterns (Facebook's class names are obfuscated)
  // Look for ad containers
  const adPattern = /<div[^>]*class="[^"]*x1xka2u1[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  const matches = Array.from(html.matchAll(adPattern));
  
  for (const match of matches) {
    const adHtml = match[1];
    
    // Extract page name
    const pageNameMatch = adHtml.match(/<span[^>]*>([^<]+)<\/span>/);
    if (!pageNameMatch) continue;
    
    const pageName = pageNameMatch[1].trim();
    
    // Skip if it's not a business name (filter out UI elements)
    if (pageName.length < 3 || pageName.includes('Sponsored') || pageName.includes('Ad Library')) {
      continue;
    }
    
    // Extract ad text
    const adTextMatch = adHtml.match(/<div[^>]*class="[^"]*xdj266r[^"]*"[^>]*>([^<]+)<\/div>/);
    const adText = adTextMatch ? adTextMatch[1].trim() : '';
    
    // Extract CTA
    const ctaMatch = adHtml.match(/<div[^>]*role="button"[^>]*>([^<]+)<\/div>/);
    const cta = ctaMatch ? ctaMatch[1].trim() : '';
    
    // Extract started running date
    const dateMatch = adHtml.match(/Started running on ([^<]+)/);
    const startedRunning = dateMatch ? dateMatch[1].trim() : '';
    
    results.push({
      id: `fb_${Date.now()}_${results.length}`,
      page_name: pageName,
      ad_creative_body: adText,
      call_to_action: cta,
      started_running: startedRunning,
      targeting: {
        location: [location]
      }
    });
    
    if (results.length >= limit) break;
  }
  
  // If parsing failed, try alternative approach
  if (results.length === 0) {
    // Look for any text that might be business names
    const businessNamePattern = /(?:LLC|Inc|Corp|Co\.|Company|Services?|Plumbing|HVAC|Landscaping|Roofing|Electrical|Painting|Construction|Contractors?|Repair|Maintenance)\b/gi;
    const potentialNames = html.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:LLC|Inc|Corp|Co\.|Company|Services?)/g) || [];
    
    for (const name of potentialNames.slice(0, limit)) {
      results.push({
        id: `fb_${Date.now()}_${results.length}`,
        page_name: name.trim(),
        targeting: {
          location: [location]
        }
      });
    }
  }
  
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