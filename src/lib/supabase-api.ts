import { createClient } from './supabase/client';
import { Lead } from '@/types';
import { Database } from './supabase/database.types';

type DbLead = Database['public']['Tables']['leads']['Row'];
type DbLeadInsert = Database['public']['Tables']['leads']['Insert'];
type DbLeadUpdate = Database['public']['Tables']['leads']['Update'];

// Convert database lead to app lead format
function dbToAppLead(dbLead: DbLead): Lead {
  return {
    id: dbLead.id,
    user_id: dbLead.user_id,
    handle: dbLead.handle,
    company_name: dbLead.company_name,
    service_type: dbLead.service_type,
    city: dbLead.city,
    phone: dbLead.phone,
    instagram_url: dbLead.instagram_url,
    website: dbLead.website,
    lead_source: dbLead.lead_source,
    running_ads: dbLead.running_ads,
    ad_start_date: dbLead.ad_start_date,
    ad_copy: dbLead.ad_copy,
    ad_call_to_action: dbLead.ad_call_to_action,
    service_areas: dbLead.service_areas,
    price_info: dbLead.price_info,
    ad_platform: dbLead.ad_platform,
    dm_sent: dbLead.dm_sent,
    dm_response: dbLead.dm_response,
    called: dbLead.called,
    call_result: dbLead.call_result,
    follow_up_date: dbLead.follow_up_date,
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
    city: lead.city || null,
    phone: lead.phone || null,
    instagram_url: lead.instagram_url || null,
    website: lead.website || null,
    lead_source: lead.lead_source || null,
    running_ads: lead.running_ads ?? false,
    ad_start_date: lead.ad_start_date || null,
    ad_copy: lead.ad_copy || null,
    ad_call_to_action: lead.ad_call_to_action || null,
    service_areas: lead.service_areas || null,
    price_info: lead.price_info || null,
    ad_platform: lead.ad_platform || null,
    dm_sent: lead.dm_sent ?? false,
    dm_response: lead.dm_response || null,
    called: lead.called ?? false,
    call_result: lead.call_result || null,
    follow_up_date: lead.follow_up_date || null,
    notes: lead.notes || null,
    score: lead.score || null,
    close_crm_id: lead.close_crm_id || null,
  };
}

// Fetch all leads for the current user
export async function fetchLeads(): Promise<Lead[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(dbToAppLead);
}

// Save a new lead
export async function saveLead(lead: Partial<Lead>): Promise<Lead> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbLead = appToDbLead(lead, user.id);

  const { data, error } = await supabase
    .from('leads')
    .insert(dbLead)
    .select()
    .single();

  if (error) throw error;
  
  return dbToAppLead(data);
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
  if (updates.service_type !== undefined) dbUpdate.service_type = updates.service_type;
  if (updates.city !== undefined) dbUpdate.city = updates.city;
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone;
  if (updates.instagram_url !== undefined) dbUpdate.instagram_url = updates.instagram_url;
  if (updates.website !== undefined) dbUpdate.website = updates.website;
  if (updates.lead_source !== undefined) dbUpdate.lead_source = updates.lead_source;
  if (updates.running_ads !== undefined) dbUpdate.running_ads = updates.running_ads;
  if (updates.ad_start_date !== undefined) dbUpdate.ad_start_date = updates.ad_start_date;
  if (updates.ad_copy !== undefined) dbUpdate.ad_copy = updates.ad_copy;
  if (updates.ad_call_to_action !== undefined) dbUpdate.ad_call_to_action = updates.ad_call_to_action;
  if (updates.service_areas !== undefined) dbUpdate.service_areas = updates.service_areas;
  if (updates.price_info !== undefined) dbUpdate.price_info = updates.price_info;
  if (updates.ad_platform !== undefined) dbUpdate.ad_platform = updates.ad_platform;
  if (updates.dm_sent !== undefined) dbUpdate.dm_sent = updates.dm_sent;
  if (updates.dm_response !== undefined) dbUpdate.dm_response = updates.dm_response;
  if (updates.called !== undefined) dbUpdate.called = updates.called;
  if (updates.call_result !== undefined) dbUpdate.call_result = updates.call_result;
  if (updates.follow_up_date !== undefined) dbUpdate.follow_up_date = updates.follow_up_date;
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

// Update multiple leads at once
export async function updateLeads(ids: string[], updates: Partial<Lead>): Promise<Lead[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbUpdate: DbLeadUpdate = {};
  
  // Only include fields that are being updated
  if (updates.handle !== undefined) dbUpdate.handle = updates.handle;
  if (updates.company_name !== undefined) dbUpdate.company_name = updates.company_name;
  if (updates.service_type !== undefined) dbUpdate.service_type = updates.service_type;
  if (updates.city !== undefined) dbUpdate.city = updates.city;
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone;
  if (updates.instagram_url !== undefined) dbUpdate.instagram_url = updates.instagram_url;
  if (updates.website !== undefined) dbUpdate.website = updates.website;
  if (updates.lead_source !== undefined) dbUpdate.lead_source = updates.lead_source;
  if (updates.running_ads !== undefined) dbUpdate.running_ads = updates.running_ads;
  if (updates.ad_start_date !== undefined) dbUpdate.ad_start_date = updates.ad_start_date;
  if (updates.ad_copy !== undefined) dbUpdate.ad_copy = updates.ad_copy;
  if (updates.ad_call_to_action !== undefined) dbUpdate.ad_call_to_action = updates.ad_call_to_action;
  if (updates.service_areas !== undefined) dbUpdate.service_areas = updates.service_areas;
  if (updates.price_info !== undefined) dbUpdate.price_info = updates.price_info;
  if (updates.ad_platform !== undefined) dbUpdate.ad_platform = updates.ad_platform;
  if (updates.dm_sent !== undefined) dbUpdate.dm_sent = updates.dm_sent;
  if (updates.dm_response !== undefined) dbUpdate.dm_response = updates.dm_response;
  if (updates.called !== undefined) dbUpdate.called = updates.called;
  if (updates.call_result !== undefined) dbUpdate.call_result = updates.call_result;
  if (updates.follow_up_date !== undefined) dbUpdate.follow_up_date = updates.follow_up_date;
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

  if (!response.ok) {
    throw new Error('AI extraction failed');
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