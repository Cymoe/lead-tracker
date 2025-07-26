import { NextRequest } from 'next/server';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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

    const systemPrompt = `You are a data extraction expert. Extract structured lead information from text content.
    
    The content may be in various formats:
    - Tab-separated values (TSV) from Google Sheets
    - Comma-separated values (CSV)
    - Facebook Ad Library copy/paste content
    - Unstructured text with company information
    
    Guidelines:
    - Extract ONLY actual service providers (contractors, installers, service companies)
    - EXCLUDE marketing agencies, web designers, consultants advertising TO contractors${
      serviceType ? `\n    - Focus on ${serviceType} service providers specifically` : ''
    }
    - For structured data (TSV/CSV), parse columns intelligently
    - Common column patterns: Company Name, Handle/Username, City, Service Type, Phone, Website, Lead Source, etc.
    - Include company names that appear multiple times only once
    - Extract phone numbers in standard format (XXX-XXX-XXXX)
    - Extract website domains only (lowercase, no https://)
    - Identify service type from content or column headers
    - Extract lead source EXACTLY as it appears in the data (e.g., "Instagram Manual", "FB Ad Library", "Google Maps")
    - Skip companies that are selling marketing/web services to contractors
    - Extract pricing info like "$2995" or "15% off"
    - Extract city names from data, hashtags, or content
    - For Instagram handles, ensure they start with @
    - Limit ad copy to first 500 characters
    - Don't confuse Library IDs with phone numbers
    - If a default city is provided and no city is found, use the default
    - Return leads as a JSON array, processing them one at a time
    - Each lead should be a complete JSON object on its own line`;

    const userPrompt = `Extract all lead information from this content. The data may be structured (TSV/CSV from spreadsheets) or unstructured text.
Default city: ${defaultCity || 'Unknown'}
${serviceType ? `Looking specifically for: ${serviceType} businesses` : ''}

Return leads one by one, each as a complete JSON object. Format:
{"companyName": "Example Company", "handle": "@example", "city": "Phoenix", "serviceType": "Turf", "leadSource": "Instagram Manual", ...}
{"companyName": "Another Company", "handle": "@another", "city": "Dallas", "serviceType": "Remodeling", "leadSource": "FB Ad Library", ...}

Content to extract from:
${text}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true,
        temperature: 0.1
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