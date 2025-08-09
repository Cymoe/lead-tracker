import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLeads, saveLead, updateLead as updateLeadAPI, deleteLead as deleteLeadAPI } from '@/lib/api';
import { Lead } from '@/types';
import { useLeadStore } from '@/lib/store';
import toast from 'react-hot-toast';

// Query key for leads
export const LEADS_QUERY_KEY = ['leads'] as const;

// Hook to fetch all leads with caching
export function useLeadsQuery() {
  const setLeads = useLeadStore(state => state.setLeads);
  
  return useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: async () => {
      console.log('Fetching leads with React Query...');
      const leads = await fetchLeads();
      // Update Zustand store when data is fetched
      setLeads(leads);
      return leads;
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Only refetch on window focus if data is stale
    refetchOnWindowFocus: 'always',
    // Don't refetch on reconnect
    refetchOnReconnect: false,
    // Don't retry on mount if we have data
    refetchOnMount: false,
  });
}

// Hook to create a new lead
export function useCreateLead() {
  const queryClient = useQueryClient();
  const addLead = useLeadStore(state => state.addLead);
  
  return useMutation({
    mutationFn: saveLead,
    onSuccess: (newLead) => {
      // Update cache
      queryClient.setQueryData<Lead[]>(LEADS_QUERY_KEY, (old = []) => [newLead, ...old]);
      // Update store
      addLead(newLead);
      toast.success('Lead created successfully');
    },
    onError: () => {
      toast.error('Failed to create lead');
    },
  });
}

// Hook to update a lead
export function useUpdateLead() {
  const queryClient = useQueryClient();
  const updateLead = useLeadStore(state => state.updateLead);
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) => updateLeadAPI(id, updates),
    onSuccess: (updatedLead) => {
      // Update cache
      queryClient.setQueryData<Lead[]>(LEADS_QUERY_KEY, (old = []) => 
        old.map(lead => lead.id === updatedLead.id ? updatedLead : lead)
      );
      // Update store
      updateLead(updatedLead);
      toast.success('Lead updated successfully');
    },
    onError: () => {
      toast.error('Failed to update lead');
    },
  });
}

// Hook to delete a lead
export function useDeleteLead() {
  const queryClient = useQueryClient();
  const deleteLead = useLeadStore(state => state.deleteLead);
  
  return useMutation({
    mutationFn: deleteLeadAPI,
    onSuccess: (_, leadId) => {
      // Update cache
      queryClient.setQueryData<Lead[]>(LEADS_QUERY_KEY, (old = []) => 
        old.filter(lead => lead.id !== leadId)
      );
      // Delete from store
      deleteLead(leadId);
      toast.success('Lead deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });
}

// Hook to invalidate and refetch leads
export function useRefreshLeads() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
  };
}