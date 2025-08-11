import { createClient } from './supabase/client';
import { Lead } from '@/types';
import { Database } from './supabase/database.types';
import { normalizeServiceType } from '@/utils/service-type-normalization';

type DbLead = Database['public']['Tables']['leads']['Row'];
type DbLeadInsert = Database['public']['Tables']['leads']['Insert'];
type DbLeadUpdate = Database['public']['Tables']['leads']['Update'];

// Convert database lead to app format
export function dbToAppLead(dbLead: DbLead): Lead {
  return {
    id: dbLead.id,
    user_id: dbLead.user_id,
    handle: dbLead.handle,
    company_name: dbLead.company_name,
    service_type: dbLead.service_type,
    // normalized_service_type will be calculated on the fly
    city: dbLead.city,
    state: dbLead.state,
    phone: dbLead.phone,
    email: dbLead.email,
    email2: dbLead.email2,
    email3: dbLead.email3,
    instagram_url: dbLead.instagram_url,
    facebook_url: dbLead.facebook_url,
    linkedin_url: dbLead.linkedin_url,
    twitter_url: dbLead.twitter_url,
    website: dbLead.website,
    google_maps_url: dbLead.google_maps_url,
    address: dbLead.address,
    full_address: dbLead.full_address,
    search_query: dbLead.search_query,
    rating: dbLead.rating,
    review_count: dbLead.review_count,
    lead_source: dbLead.lead_source,
    running_ads: dbLead.running_ads,
    ad_start_date: dbLead.ad_start_date,
    ad_copy: dbLead.ad_copy,
    ad_platform: dbLead.ad_platform,
    notes: dbLead.notes,
    score: dbLead.score,
    close_crm_id: dbLead.close_crm_id,
    created_at: dbLead.created_at,
    updated_at: dbLead.updated_at,
  };
}

// Convert app lead to database format for insert
function appToDbLead(lead: Partial<Lead>, userId: string): DbLeadInsert {
  return {
    user_id: userId,
    handle: lead.handle || null,
    company_name: lead.company_name!,
    service_type: lead.service_type || null,
    // Don't save normalized_service_type to database - calculate on the fly
    // Preserve city/state values - only convert falsy values to null
    city: lead.city || null,
    state: lead.state || null,
    phone: lead.phone || null,
    email: lead.email || null,
    email2: lead.email2 || null,
    email3: lead.email3 || null,
    instagram_url: lead.instagram_url || null,
    facebook_url: lead.facebook_url || null,
    linkedin_url: lead.linkedin_url || null,
    twitter_url: lead.twitter_url || null,
    website: lead.website || null,
    google_maps_url: lead.google_maps_url || null,
    address: lead.address || null,
    full_address: lead.full_address || null,
    search_query: lead.search_query || null,
    rating: lead.rating || null,
    review_count: lead.review_count || null,
    lead_source: lead.lead_source || 'Instagram Manual', // Default to Instagram Manual instead of null
    running_ads: lead.running_ads ?? false,
    ad_start_date: lead.ad_start_date || null,
    ad_copy: lead.ad_copy || null,
    ad_platform: lead.ad_platform || null,
    notes: lead.notes || null,
    score: lead.score || null,
    close_crm_id: lead.close_crm_id || null,
  };
}

// Fetch leads with pagination
export async function fetchLeadsPaginated(page: number = 0, pageSize: number = 100): Promise<{ leads: Lead[]; totalCount: number; hasMore: boolean }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // Get total count
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    const totalCount = count || 0;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    // Fetch page of data
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    const leads = (data || []).map(dbToAppLead);
    const hasMore = to < totalCount - 1;
    
    console.log(`Fetched page ${page + 1}: ${leads.length} leads (total: ${totalCount})`);
    
    return { leads, totalCount, hasMore };
  } catch (error) {
    console.error('fetchLeadsPaginated error:', error);
    throw error;
  }
}

// Legacy function - only for CSV import
export async function fetchLeads(limitToLoad?: number): Promise<Lead[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // First, get the total count
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    console.log(`Total leads in database: ${count}`);
    
    if (!count || count === 0) {
      return [];
    }

    // Determine how many leads to load
    const leadsToLoad = limitToLoad && limitToLoad < count ? limitToLoad : count;
    const pageSize = 1000;
    const totalPages = Math.ceil(leadsToLoad / pageSize);
    
    if (limitToLoad && limitToLoad < count) {
      console.log(`Loading first ${leadsToLoad} of ${count} leads for performance...`);
    } else {
      console.log(`Fetching all ${count} leads in ${totalPages} parallel requests...`);
    }
    
    // Create promises for all pages
    const pagePromises: Promise<DbLead[]>[] = [];
    
    for (let page = 0; page < totalPages; page++) {
      const from = page * pageSize;
      const to = Math.min(from + pageSize - 1, leadsToLoad - 1);
      
      const pagePromise = Promise.resolve(
        supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to)
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error fetching page ${page + 1}:`, error);
              throw error;
            }
            console.log(`Fetched page ${page + 1}: ${data?.length || 0} leads`);
            return (data || []) as DbLead[];
          })
      );
        
      pagePromises.push(pagePromise);
    }
    
    // Fetch all pages in parallel
    const allPages = await Promise.all(pagePromises);
    
    // Flatten all pages into a single array
    const allLeads = allPages.flat();
    
    console.log(`Successfully fetched ${allLeads.length} leads`);
    
    // Store the total count for reference
    if (limitToLoad && limitToLoad < count) {
      (window as any).__totalLeadCount = count;
    }
    
    return allLeads.map(dbToAppLead);
  } catch (error) {
    console.error('fetchLeads error:', error);
    throw error;
  }
}

// Save a new lead
export async function saveLead(lead: Partial<Lead>, supabase?: any, userId?: string): Promise<Lead> {
  console.log('saveLead called with:', { hasSupabase: !!supabase, userId });
  
  // If supabase client is not provided, create one (for client-side usage)
  if (!supabase) {
    console.log('Creating new supabase client in saveLead');
    supabase = createClient();
  }
  
  // If userId is not provided, get it from auth (for client-side usage)
  let user_id = userId;
  if (!user_id) {
    console.log('Getting user from auth in saveLead');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    user_id = user.id;
  }
  
  console.log('Using userId in saveLead:', user_id);
  
  // Validate critical fields
  if (!lead.city || !lead.state) {
    console.warn('WARNING: Saving lead without city/state!', {
      company_name: lead.company_name,
      city: lead.city,
      state: lead.state,
      cityType: typeof lead.city,
      stateType: typeof lead.state
    });
  }

  const dbLead = appToDbLead(lead, user_id);
  
  // Debug log the final database values
  if (!dbLead.city || !dbLead.state) {
    console.error('CRITICAL: dbLead missing location after conversion!', {
      company_name: dbLead.company_name,
      city: dbLead.city,
      state: dbLead.state,
      originalCity: lead.city,
      originalState: lead.state
    });
  }

  const { data, error } = await supabase
    .from('leads')
    .insert(dbLead)
    .select()
    .single();

  if (error) throw error;
  
  return dbToAppLead(data);
}

// Save multiple leads at once (batch insert)
export async function saveLeadsBatch(leads: Partial<Lead>[], supabase?: any, userId?: string): Promise<Lead[]> {
  // If supabase client is not provided, create one (for client-side usage)
  if (!supabase) {
    supabase = createClient();
  }
  
  // If userId is not provided, get it from auth (for client-side usage)
  let user_id = userId;
  if (!user_id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    user_id = user.id;
  }

  const dbLeads = leads.map(lead => appToDbLead(lead, user_id));

  // Use upsert with onConflict to handle duplicates gracefully
  // This will update existing leads with the same google_maps_url
  const { data, error } = await supabase
    .from('leads')
    .upsert(dbLeads, { 
      onConflict: 'user_id,google_maps_url',
      ignoreDuplicates: false  // Update existing records
    })
    .select();

  if (error) {
    console.error('Batch save error:', error);
    // Try to save leads one by one to identify which ones are failing
    const savedLeads = [];
    for (const dbLead of dbLeads) {
      try {
        const { data: singleData } = await supabase
          .from('leads')
          .upsert(dbLead, { 
            onConflict: 'user_id,google_maps_url',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (singleData) {
          savedLeads.push(dbToAppLead(singleData));
        }
      } catch (singleError) {
        console.error('Failed to save lead:', dbLead.company_name, singleError);
      }
    }
    return savedLeads;
  }
  
  return (data || []).map(dbToAppLead);
}

// Update an existing lead
export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbUpdate: DbLeadUpdate = {};
  
  // Only include fields that are being updated
  if (updates.handle !== undefined) dbUpdate.handle = updates.handle;
  if (updates.company_name !== undefined) dbUpdate.company_name = updates.company_name;
  if (updates.service_type !== undefined) {
    dbUpdate.service_type = updates.service_type;
    // normalized_service_type is calculated on the fly, not stored
  }
  if (updates.city !== undefined) dbUpdate.city = updates.city;
  if (updates.state !== undefined) dbUpdate.state = updates.state;
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone;
  if (updates.email !== undefined) dbUpdate.email = updates.email;
  if (updates.instagram_url !== undefined) dbUpdate.instagram_url = updates.instagram_url;
  if (updates.website !== undefined) dbUpdate.website = updates.website;
  if (updates.google_maps_url !== undefined) dbUpdate.google_maps_url = updates.google_maps_url;
  if (updates.address !== undefined) dbUpdate.address = updates.address;
  if (updates.rating !== undefined) dbUpdate.rating = updates.rating;
  if (updates.review_count !== undefined) dbUpdate.review_count = updates.review_count;
  if (updates.lead_source !== undefined) dbUpdate.lead_source = updates.lead_source;
  if (updates.running_ads !== undefined) dbUpdate.running_ads = updates.running_ads;
  if (updates.ad_start_date !== undefined) dbUpdate.ad_start_date = updates.ad_start_date;
  if (updates.ad_copy !== undefined) dbUpdate.ad_copy = updates.ad_copy;
  if (updates.ad_platform !== undefined) dbUpdate.ad_platform = updates.ad_platform;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.score !== undefined) dbUpdate.score = updates.score;
  if (updates.close_crm_id !== undefined) dbUpdate.close_crm_id = updates.close_crm_id;

  const { data, error } = await supabase
    .from('leads')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  return dbToAppLead(data);
}

// Delete a lead
export async function deleteLead(id: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Delete multiple leads at once
export async function deleteLeads(ids: string[]): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('leads')
    .delete()
    .in('id', ids);

  if (error) throw error;
}

// Update multiple leads at once with the same updates
export async function updateLeads(ids: string[], updates: Partial<Lead>): Promise<Lead[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbUpdate: DbLeadUpdate = {};
  
  // Only include fields that are being updated
  if (updates.handle !== undefined) dbUpdate.handle = updates.handle;
  if (updates.company_name !== undefined) dbUpdate.company_name = updates.company_name;
  if (updates.service_type !== undefined) {
    dbUpdate.service_type = updates.service_type;
    // normalized_service_type is calculated on the fly, not stored
  }
  if (updates.city !== undefined) dbUpdate.city = updates.city;
  if (updates.state !== undefined) dbUpdate.state = updates.state;
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone;
  if (updates.email !== undefined) dbUpdate.email = updates.email;
  if (updates.instagram_url !== undefined) dbUpdate.instagram_url = updates.instagram_url;
  if (updates.website !== undefined) dbUpdate.website = updates.website;
  if (updates.google_maps_url !== undefined) dbUpdate.google_maps_url = updates.google_maps_url;
  if (updates.address !== undefined) dbUpdate.address = updates.address;
  if (updates.rating !== undefined) dbUpdate.rating = updates.rating;
  if (updates.review_count !== undefined) dbUpdate.review_count = updates.review_count;
  if (updates.lead_source !== undefined) dbUpdate.lead_source = updates.lead_source;
  if (updates.running_ads !== undefined) dbUpdate.running_ads = updates.running_ads;
  if (updates.ad_start_date !== undefined) dbUpdate.ad_start_date = updates.ad_start_date;
  if (updates.ad_copy !== undefined) dbUpdate.ad_copy = updates.ad_copy;
  if (updates.ad_platform !== undefined) dbUpdate.ad_platform = updates.ad_platform;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.score !== undefined) dbUpdate.score = updates.score;
  if (updates.close_crm_id !== undefined) dbUpdate.close_crm_id = updates.close_crm_id;

  const { data, error } = await supabase
    .from('leads')
    .update(dbUpdate)
    .in('id', ids)
    .select();

  if (error) throw error;
  
  return (data || []).map(dbToAppLead);
}

// Update multiple leads with different values for each
export async function updateLeadsBatch(updates: Array<{ id: string, updates: Partial<Lead> }>): Promise<Lead[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Process updates in parallel using Promise.all
  const updatePromises = updates.map(async ({ id, updates: leadUpdates }) => {
    const dbUpdate: DbLeadUpdate = {};
    
    // Only include fields that are being updated
    if (leadUpdates.handle !== undefined) dbUpdate.handle = leadUpdates.handle;
    if (leadUpdates.company_name !== undefined) dbUpdate.company_name = leadUpdates.company_name;
    if (leadUpdates.service_type !== undefined) dbUpdate.service_type = leadUpdates.service_type;
    if (leadUpdates.city !== undefined) dbUpdate.city = leadUpdates.city;
    if (leadUpdates.state !== undefined) dbUpdate.state = leadUpdates.state;
    if (leadUpdates.phone !== undefined) dbUpdate.phone = leadUpdates.phone;
    if (leadUpdates.email !== undefined) dbUpdate.email = leadUpdates.email;
    if (leadUpdates.email2 !== undefined) dbUpdate.email2 = leadUpdates.email2;
    if (leadUpdates.email3 !== undefined) dbUpdate.email3 = leadUpdates.email3;
    if (leadUpdates.instagram_url !== undefined) dbUpdate.instagram_url = leadUpdates.instagram_url;
    if (leadUpdates.facebook_url !== undefined) dbUpdate.facebook_url = leadUpdates.facebook_url;
    if (leadUpdates.linkedin_url !== undefined) dbUpdate.linkedin_url = leadUpdates.linkedin_url;
    if (leadUpdates.twitter_url !== undefined) dbUpdate.twitter_url = leadUpdates.twitter_url;
    if (leadUpdates.website !== undefined) dbUpdate.website = leadUpdates.website;
    if (leadUpdates.google_maps_url !== undefined) dbUpdate.google_maps_url = leadUpdates.google_maps_url;
    if (leadUpdates.address !== undefined) dbUpdate.address = leadUpdates.address;
    if (leadUpdates.full_address !== undefined) dbUpdate.full_address = leadUpdates.full_address;
    if (leadUpdates.search_query !== undefined) dbUpdate.search_query = leadUpdates.search_query;
    if (leadUpdates.rating !== undefined) dbUpdate.rating = leadUpdates.rating;
    if (leadUpdates.review_count !== undefined) dbUpdate.review_count = leadUpdates.review_count;
    if (leadUpdates.lead_source !== undefined) dbUpdate.lead_source = leadUpdates.lead_source;
    if (leadUpdates.running_ads !== undefined) dbUpdate.running_ads = leadUpdates.running_ads;
    if (leadUpdates.ad_start_date !== undefined) dbUpdate.ad_start_date = leadUpdates.ad_start_date;
    if (leadUpdates.ad_copy !== undefined) dbUpdate.ad_copy = leadUpdates.ad_copy;
    if (leadUpdates.ad_platform !== undefined) dbUpdate.ad_platform = leadUpdates.ad_platform;
    if (leadUpdates.notes !== undefined) dbUpdate.notes = leadUpdates.notes;
    if (leadUpdates.score !== undefined) dbUpdate.score = leadUpdates.score;
    if (leadUpdates.close_crm_id !== undefined) dbUpdate.close_crm_id = leadUpdates.close_crm_id;

    const { data, error } = await supabase
      .from('leads')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return dbToAppLead(data);
  });

  const updateResults = await Promise.all(updatePromises);
  return updateResults;
}

// Extract leads with AI (this will stay the same, just save to Supabase instead)
export async function extractWithAI(
  text: string, 
  defaultCity: string, 
  serviceType: string | null,
  apiKey: string
): Promise<Lead[]> {
  const response = await fetch('/api/ai-extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      defaultCity,
      serviceType,
      apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error('AI extraction failed');
  }

  const data = await response.json();
  
  if (data.success) {
    return data.leads;
  } else {
    throw new Error(data.error || 'AI extraction failed');
  }
}

// Extract leads with AI using streaming for real-time updates
export async function extractWithAIStream(
  text: string, 
  defaultCity: string, 
  serviceType: string | null,
  apiKey: string,
  onLeadReceived: (lead: Lead) => void,
  onError?: (error: string) => void
): Promise<void> {
  console.log('extractWithAIStream called, making API request...');
  
  const response = await fetch('/api/ai-extract-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      defaultCity,
      serviceType,
      apiKey,
    }),
  });
  
  console.log('API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI extraction failed:', response.status, errorText);
    
    // Try to parse JSON error response
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || `AI extraction failed: ${errorText}`);
    } catch {
      throw new Error(`AI extraction failed: ${errorText}`);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.lead) {
              onLeadReceived(parsed.lead);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error.message : 'Stream processing failed');
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}