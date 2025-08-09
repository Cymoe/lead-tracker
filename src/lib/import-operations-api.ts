import { createClient } from './supabase/client';
import { ImportOperation, Lead } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a new import operation
export async function createImportOperation(
  operationType: ImportOperation['operation_type'],
  source: ImportOperation['source'],
  leadCount: number,
  metadata: ImportOperation['metadata'],
  supabase?: SupabaseClient,
  userId?: string
): Promise<ImportOperation | null> {
  console.log('=== createImportOperation called ===');
  console.log('Parameters:', {
    operationType,
    source,
    leadCount,
    metadata,
    hasSupabase: !!supabase,
    userId
  });
  
  try {
    // If supabase client is not provided, create one (for client-side usage)
    if (!supabase) {
      supabase = createClient();
    }
    
    // If userId is not provided, get it from auth (for client-side usage)
    let user_id = userId;
    if (!user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      user_id = user.id;
    }

    console.log('Creating import operation with:', {
      user_id: user_id,
      operation_type: operationType,
      source,
      lead_count: leadCount,
      metadata,
      hasSupabase: !!supabase,
      authMethod: userId ? 'provided' : 'fetched'
    });

    // Log the exact data being inserted
    const insertData = {
      user_id: user_id,
      operation_type: operationType,
      source,
      lead_count: leadCount,
      metadata: metadata || {} // Ensure metadata is never null/undefined
    };
    
    // Validate the data before inserting
    if (!user_id) {
      throw new Error('User ID is required');
    }
    if (!operationType) {
      throw new Error('Operation type is required');
    }
    if (!source) {
      throw new Error('Source is required');
    }
    if (typeof leadCount !== 'number' || leadCount < 0) {
      throw new Error('Lead count must be a non-negative number');
    }
    
    console.log('Inserting import operation data:', JSON.stringify(insertData, null, 2));
    
    // Try to insert with retry logic
    let retries = 3;
    let data = null;
    let error = null;
    
    while (retries > 0 && !data) {
      const result = await supabase
        .from('import_operations')
        .insert(insertData)
        .select()
        .single();
        
      data = result.data;
      error = result.error;
      
      if (error && retries > 1) {
        console.log(`Import operation insert failed, retrying... (${retries - 1} retries left)`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
      } else {
        break;
      }
    }

    if (error) {
      console.error('Supabase error creating import operation:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        data: {
          user_id,
          operation_type: operationType,
          source,
          lead_count: leadCount
        }
      });
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error creating import operation:', error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
}

// Get recent import operations for the current user
export async function getRecentImportOperations(limit = 10): Promise<ImportOperation[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('import_operations')
      .select('*')
      .eq('user_id', user.id)
      .is('reverted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching import operations:', error);
    return [];
  }
}

// Get the most recent import operation
export async function getLastImportOperation(): Promise<ImportOperation | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('import_operations')
      .select('*')
      .eq('user_id', user.id)
      .is('reverted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data || null;
  } catch (error) {
    console.error('Error fetching last import operation:', error);
    return null;
  }
}

// Check if an operation can be undone (e.g., within time limit)
export function canUndoOperation(operation: ImportOperation): boolean {
  const MAX_UNDO_MINUTES = 5;
  const createdAt = new Date(operation.created_at);
  const now = new Date();
  const minutesPassed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  
  return !operation.reverted_at && minutesPassed <= MAX_UNDO_MINUTES;
}

// Revert an import operation
export async function revertImportOperation(operationId: string): Promise<{ success: boolean; deletedCount: number }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Start a transaction
    // First, get ALL leads associated with this operation (no limit)
    console.log('Fetching leads for operation:', operationId);
    
    // Get count first
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('import_operation_id', operationId)
      .eq('user_id', user.id);
      
    if (countError) throw countError;
    console.log(`Found ${count} leads to potentially delete`);
    
    // Fetch all leads in batches to avoid limits
    const allLeads: any[] = [];
    const FETCH_BATCH_SIZE = 1000;
    
    for (let offset = 0; offset < (count || 0); offset += FETCH_BATCH_SIZE) {
      const { data: batch, error: batchError } = await supabase
        .from('leads')
        .select('id, updated_at')
        .eq('import_operation_id', operationId)
        .eq('user_id', user.id)
        .range(offset, offset + FETCH_BATCH_SIZE - 1);
        
      if (batchError) throw batchError;
      if (batch) allLeads.push(...batch);
    }
    
    const leads = allLeads;

    if (!leads || leads.length === 0) {
      console.log('No leads found for this operation');
      return { success: false, deletedCount: 0 };
    }
    
    console.log(`Successfully fetched ${leads.length} leads`);

    // Check if any leads have been modified since import
    const modifiedLeads = leads.filter(lead => {
      const updatedAt = new Date(lead.updated_at);
      const operation = new Date();
      return updatedAt > operation;
    });

    if (modifiedLeads.length > 0) {
      console.warn(`${modifiedLeads.length} leads have been modified since import`);
    }

    // Delete all unmodified leads
    const leadsToDelete = leads.filter(lead => !modifiedLeads.find(m => m.id === lead.id));
    const leadIds = leadsToDelete.map(l => l.id);

    if (leadIds.length > 0) {
      console.log(`Deleting ${leadIds.length} leads in batches...`);
      
      // Delete in batches to avoid URL length limits
      const BATCH_SIZE = 50;
      let deletedCount = 0;
      
      for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
        const batch = leadIds.slice(i, i + BATCH_SIZE);
        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`Error deleting batch ${i / BATCH_SIZE + 1}:`, deleteError);
          throw deleteError;
        }
        
        deletedCount += batch.length;
        console.log(`Deleted ${deletedCount}/${leadIds.length} leads...`);
      }
      
      console.log(`Successfully deleted all ${deletedCount} leads`);
    }

    // Mark the operation as reverted
    const { error: updateError } = await supabase
      .from('import_operations')
      .update({
        reverted_at: new Date().toISOString(),
        reverted_by: user.id
      })
      .eq('id', operationId);

    if (updateError) throw updateError;

    return { success: true, deletedCount: leadIds.length };
  } catch (error) {
    console.error('Error reverting import operation:', error);
    return { success: false, deletedCount: 0 };
  }
}

// Get leads for a specific import operation
export async function getLeadsForOperation(operationId: string): Promise<Lead[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('import_operation_id', operationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leads for operation:', error);
    return [];
  }
}

// Get import history with stats
export async function getImportHistory(limit = 50): Promise<ImportOperation[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('import_operations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching import history:', error);
    return [];
  }
}