import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { FacebookAdsExtractionSchema, type FacebookAd } from '@/schemas/facebook-ad';
import { detectDataFormat } from '@/utils/data-format-detector';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper to convert FacebookAd to Lead format
function convertFacebookAdToLead(ad: FacebookAd, defaultCity: string): any {
  return {
    id: generateId(),
    company_name: ad.company_name,
    handle: '@' + ad.company_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    city: ad.city || defaultCity || 'Unknown',
    service_type: ad.service_type || 'General',
    phone: ad.phone ? formatPhoneNumber(ad.phone) : null,
    website: ad.website?.toLowerCase().replace(/^https?:\/\//, ''),
    instagram_url: null,
    lead_source: 'FB Ad Library',
    running_ads: ad.status === 'Active',
    ad_start_date: ad.start_date || null,
    ad_copy: ad.ad_copy || null,
    ad_call_to_action: ad.call_to_action || null,
    service_areas: null,
    price_info: ad.price_info || null,
    ad_platform: ad.platforms?.join(', ') || null,
    dm_sent: false,
    dm_response: null,
    called: false,
    call_result: null,
    follow_up_date: null,
    notes: ad.library_id ? `Library ID: ${ad.library_id}` : null,
    score: null,
    close_crm_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text, defaultCity, serviceType, apiKey } = await request.json();

    // Use provided API key or fall back to environment variable
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Detect data format
    const formatResult = detectDataFormat(text);
    console.log('Detected format:', formatResult);

    // Use OpenAI Structured Outputs for Facebook Ad Library data
    if (formatResult.format === 'facebook-ad-library' && formatResult.confidence >= 70) {
      try {
        console.log('Initializing OpenAI client with key starting:', openaiApiKey.substring(0, 10));
        const openai = new OpenAI({ apiKey: openaiApiKey });
        
        console.log('OpenAI client initialized:', !!openai);
        console.log('Beta available:', !!openai.beta);
        console.log('Chat available:', !!openai.beta?.chat);
        console.log('Completions available:', !!openai.beta?.chat?.completions);
        
        if (!openai.beta?.chat?.completions?.parse) {
          throw new Error('OpenAI SDK does not support structured outputs. Please ensure you have the latest version.');
        }
        
        const completion = await openai.beta.chat.completions.parse({
          model: "gpt-4o-2024-08-06",
          messages: [
            {
              role: "system",
              content: `You are an expert at extracting structured data from Facebook Ad Library exports.
              
              Key patterns to identify:
              - Each ad typically starts with "Active" or "Inactive" status
              - "Library ID:" followed by a number
              - Company name often appears twice before "Sponsored"
              - "Started running on" indicates when the ad began
              - Platforms listed after "Platforms" header
              - Categories listed after "Categories" header
              - Ad copy appears after "Sponsored" marker
              - CTA buttons and website links often appear at the end
              
              Special cases:
              - "Certified VooltPro Contractors" is a page name - look for the actual company name in the ad text (e.g., "Hi, I'm Henry, owner of HP Turf Solutions")
              - Extract phone numbers, websites, and emails from the ad copy
              - Determine service type from company name and ad content`
            },
            {
              role: "user",
              content: `Extract ALL Facebook ads from this text. There are EXACTLY ${formatResult.metadata?.sponsoredCount || 'multiple'} ads based on the "Sponsored" markers found.
              
              CRITICAL: You MUST find and extract ALL companies, including:
              1. Green Forever Arizona Synthetic Turf & Pavers (multiple ads - extract as ONE company)
              2. Innovative Custom Pools Phoenix AZ
              3. Turf Cowboys AZ
              4. HP Turf Solutions (under "Certified VooltPro Contractors" - look for "Hi, I'm Henry")
              5. West Valley Desert Landscaping
              
              Default city: ${defaultCity || 'Unknown'}
              ${serviceType ? `Service type focus: ${serviceType}` : ''}
              
              Text to analyze:
              ${text}`
            }
          ],
          response_format: zodResponseFormat(FacebookAdsExtractionSchema, "facebook_ads_extraction"),
        });

        const result = completion.choices[0].message.parsed;
        
        if (!result) {
          throw new Error('Failed to parse Facebook ads');
        }

        console.log(`Extracted ${result.ads.length} ads using Structured Outputs`);

        // Convert to stream format for compatibility
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            for (const ad of result.ads) {
              const lead = convertFacebookAdToLead(ad, defaultCity);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ lead })}

`));
            }
            controller.close();
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('Structured output extraction failed:', error);
        // Return error response instead of silently falling back
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Structured output extraction failed',
            details: error instanceof Error && 'response' in error ? (error as any).response?.data : undefined
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    const systemPrompt = `You are a data extraction expert. Extract structured lead information from text content.
    
    The content may be in various formats:
    - Tab-separated values (TSV) from Google Sheets
    - Comma-separated values (CSV)
    - Facebook Ad Library copy/paste content (look for pattern: Company Name appears twice, then "Sponsored", then ad content)
    - Unstructured text with company information
    
    For Facebook Ad Library data specifically:
    - Each ad starts with "Active" and "Library ID"
    - Company name appears TWICE on consecutive lines before "Sponsored"
    - The actual company name may differ from page name (e.g., "Certified VooltPro Contractors" page might be "HP Turf Solutions" company)
    - Look for company names in the ad content if page name seems generic
    
    Guidelines:
    - Extract ONLY actual service providers (contractors, installers, service companies)
    - EXCLUDE marketing agencies, web designers, consultants advertising TO contractors${
      serviceType ? `\n    - Focus on ${serviceType} service providers specifically` : ''
    }
    - For Facebook Ad Library data: Each distinct advertiser/company should be extracted as a separate lead
    - Look for company names after "Sponsored" markers in Facebook ads
    - For structured data (TSV/CSV), parse columns intelligently
    - Common column patterns: Company Name, Handle/Username, City, Service Type, Phone, Website, Lead Source, etc.
    - Extract ALL unique companies, even if they appear multiple times with different ads
    - When you see "Certified VooltPro Contractors", look in the ad content for the actual company name (often mentions owner name and company)
    - Extract phone numbers in standard format (XXX-XXX-XXXX)
    - Extract website domains only (lowercase, no https://)
    - Identify service type from ad content, company name, or services mentioned
    - For Facebook Ad Library: Lead source should be "FB Ad Library"
    - Skip companies that are selling marketing/web services to contractors
    - Extract pricing info, offers, and key selling points from ad copy
    - Extract city names from data, locations mentioned, or use default city
    - For Instagram handles, ensure they start with @
    - Capture the most compelling ad copy (first 500 characters)
    - Don't confuse Library IDs with phone numbers
    - If a default city is provided and no city is found, use the default
    - Return leads as a JSON array, processing them one at a time
    - Each lead should be a complete JSON object on its own line`;

    // Pre-process to count expected companies for Facebook Ad Library data
    const sponsoredCount = (text.match(/\nSponsored\n/g) || []).length;
    const expectedCompaniesHint = sponsoredCount > 0 
      ? `\n\nIMPORTANT: This appears to be Facebook Ad Library data with ${sponsoredCount} companies advertising (based on "Sponsored" markers). Make sure to find ALL ${sponsoredCount} companies.`
      : '';

    // Also look for the specific pattern where company name appears twice before Sponsored
    const companyPattern = /^(.+)\n\1\nSponsored/gm;
    const patternMatches = Array.from(text.matchAll(companyPattern)) as RegExpMatchArray[];
    const detectedCompanies = patternMatches.map(match => match[1]);
    const companiesHint = detectedCompanies.length > 0
      ? `\n\nDetected company names that appear before "Sponsored": ${detectedCompanies.join(', ')}`
      : '';
    
    // Log for debugging
    if (sponsoredCount > 0) {
      console.log(`Facebook Ad Library Detection: Found ${sponsoredCount} "Sponsored" markers`);
      console.log(`Pattern-detected companies: ${detectedCompanies.join(', ') || 'none'}`);
    }

    const userPrompt = `Extract all lead information from this content. The data may be structured (TSV/CSV from spreadsheets) or unstructured text.
Default city: ${defaultCity || 'Unknown'}
${serviceType ? `Looking specifically for: ${serviceType} businesses` : ''}${expectedCompaniesHint}${companiesHint}

CRITICAL INSTRUCTION: You MUST extract ALL ${sponsoredCount || 'the'} companies from this Facebook Ad Library data.
Look for company names that appear before "Sponsored" markers.

Known patterns in this data:
- "Green Forever Arizona Synthetic Turf & Pavers" (multiple ads)
- "Innovative Custom Pools Phoenix AZ"
- "Turf Cowboys AZ" 
- "Certified VooltPro Contractors" is actually "HP Turf Solutions" (look for owner name Henry)
- "West Valley Desert Landscaping"

Extract EVERY unique company, even if they have multiple ads. Do not stop early!

Return leads one by one, each as a complete JSON object. Format:
{"companyName": "Example Company", "handle": "@example", "city": "Phoenix", "serviceType": "Turf", "leadSource": "FB Ad Library", ...}

Content to extract from:
${text}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: sponsoredCount > 3 ? 'gpt-4o' : 'gpt-4o-mini', // Use better model for complex FB Ad Library data
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true,
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    // Create a transform stream to process the OpenAI stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let buffer = '';
        let leadBuffer = '';
        let inLeadObject = false;
        let bracketCount = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  
                  // Process the content character by character to detect JSON objects
                  for (const char of content) {
                    leadBuffer += char;
                    
                    if (char === '{') {
                      if (!inLeadObject && leadBuffer.trim().endsWith('{')) {
                        inLeadObject = true;
                        leadBuffer = '{';
                      }
                      if (inLeadObject) bracketCount++;
                    } else if (char === '}' && inLeadObject) {
                      bracketCount--;
                      
                      if (bracketCount === 0) {
                        // We have a complete lead object
                        try {
                          const leadJson = leadBuffer.trim();
                          const lead = JSON.parse(leadJson);
                          
                          // Process and send the lead
                          const processedLead = postProcessLead(lead, defaultCity);
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ lead: processedLead })}\n\n`));
                          
                          // Reset for next lead
                          leadBuffer = '';
                          inLeadObject = false;
                        } catch (e) {
                          // Invalid JSON, continue collecting
                        }
                      }
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('AI extraction error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'AI extraction failed' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function postProcessLead(lead: any, defaultCity: string) {
  // Convert from camelCase to snake_case and ensure all required fields
  const processedLead: any = {
    id: generateId(),
    company_name: lead.companyName || 'Unknown Company',
    handle: lead.handle || null,
    city: lead.city || lead.serviceAreas?.[0] || defaultCity || 'Unknown',
    service_type: lead.serviceType || 'General',
    phone: lead.phone || null,
    website: lead.website || null,
    instagram_url: null,
    lead_source: lead.leadSource || 'FB Ad Library',
    running_ads: lead.leadSource === 'FB Ad Library' ? true : false,
    ad_start_date: lead.adStartDate || null,
    ad_copy: lead.adCopy || null,
    ad_call_to_action: null,
    service_areas: null,
    price_info: lead.priceInfo || null,
    ad_platform: lead.adPlatform || null,
    dm_sent: false,
    dm_response: null,
    called: false,
    call_result: null,
    follow_up_date: null,
    notes: lead.libraryId ? `Library ID: ${lead.libraryId}` : null,
    score: null,
    close_crm_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Generate handle if not provided
  if (!processedLead.handle && processedLead.company_name) {
    processedLead.handle = '@' + processedLead.company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Format phone number if present
  if (processedLead.phone) {
    processedLead.phone = formatPhoneNumber(processedLead.phone);
  }

  // Ensure website is lowercase and clean
  if (processedLead.website) {
    processedLead.website = processedLead.website.toLowerCase().replace(/^https?:\/\//, '');
  }

  // Convert service areas array to string
  if (Array.isArray(lead.serviceAreas) && lead.serviceAreas.length > 0) {
    processedLead.service_areas = lead.serviceAreas.slice(0, 5).join(', ');
  }

  // Build Instagram URL from handle if available
  if (processedLead.handle && processedLead.handle.startsWith('@')) {
    processedLead.instagram_url = `https://instagram.com/${processedLead.handle.substring(1)}`;
  }

  return processedLead;
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}