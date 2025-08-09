import { createClient } from './supabase/client';

export interface ImportOperation {
  id: string;
  operation_type: string;
  lead_count: number;
  metadata: {
    source?: string;
    fileName?: string;
    importDefaults?: any;
    [key: string]: any;
  };
  created_at: string;
  operation_status: string;
  expires_at: string;
}

export interface RevertResult {
  success: boolean;
  deleted_count: number;
  message: string;
}

// Create a new import operation record
export async function createImportOperation(
  operation_type: string,
  lead_count: number,
  metadata: Record<string, any> = {}
): Promise<ImportOperation | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await supabase
    .from('import_operations')
    .insert({
      user_id: userData.user.id,
      operation_type,
      lead_count,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating import operation:', error);
    return null;
  }

  return data;
}

// Get recent revertable operations
export async function getRevertableOperations(): Promise<ImportOperation[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .rpc('get_revertable_operations', { user_uuid: userData.user.id });

  if (error) {
    console.error('Error fetching revertable operations:', error);
    return [];
  }

  return data || [];
}

// Revert an import operation
export async function revertImportOperation(operationId: string): Promise<RevertResult> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, deleted_count: 0, message: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .rpc('revert_import_operation', { 
      operation_uuid: operationId,
      user_uuid: userData.user.id 
    });

  if (error) {
    console.error('Error reverting operation:', error);
    return { success: false, deleted_count: 0, message: error.message };
  }

  return data?.[0] || { success: false, deleted_count: 0, message: 'Unknown error' };
}

// Update leads with operation ID (for batch operations)
export async function tagLeadsWithOperation(
  leadIds: string[],
  operationId: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({ import_operation_id: operationId })
    .in('id', leadIds);

  if (error) {
    console.error('Error tagging leads with operation:', error);
    return false;
  }

  return true;
}

// Save leads with operation tracking
export async function saveLeadsWithOperation(
  leads: any[],
  operationType: string,
  metadata: Record<string, any> = {}
): Promise<{ leads: any[], operation: ImportOperation | null }> {
  // Create operation record first
  const operation = await createImportOperation(operationType, leads.length, metadata);
  
  if (!operation) {
    // Fallback to regular save without operation tracking
    console.warn('Failed to create operation, saving without tracking');
    return { leads: [], operation: null };
  }

  // Add operation ID to all leads
  const leadsWithOperation = leads.map(lead => ({
    ...lead,
    import_operation_id: operation.id
  }));

  // Save leads
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .insert(leadsWithOperation)
    .select();

  if (error) {
    console.error('Error saving leads with operation:', error);
    // TODO: Clean up the operation record
    return { leads: [], operation: null };
  }

  return { leads: data || [], operation };
}