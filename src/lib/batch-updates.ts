import { Lead } from '@/types';
import { updateLeads as updateLeadsAPI } from './supabase-api';

interface BatchUpdate {
  id: string;
  updates: Partial<Lead>;
}

// Helper function to handle batch updates with individual field updates
export async function batchUpdateLeads(updates: BatchUpdate[]): Promise<Lead[]> {
  // Group updates by the fields being updated to minimize API calls
  const updateGroups = new Map<string, { ids: string[]; updates: Partial<Lead> }>();
  
  updates.forEach(({ id, updates }) => {
    const key = JSON.stringify(Object.keys(updates).sort());
    const group = updateGroups.get(key) || { ids: [], updates };
    group.ids.push(id);
    updateGroups.set(key, group);
  });
  
  // Execute grouped updates
  const results: Lead[] = [];
  
  for (const group of updateGroups.values()) {
    const updatedLeads = await updateLeadsAPI(group.ids, group.updates);
    results.push(...updatedLeads);
  }
  
  return results;
}