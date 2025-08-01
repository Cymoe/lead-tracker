import { create } from 'zustand';
import { Lead, KeywordSession } from '@/types';

interface LeadStore {
  // Leads
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  selectedLeads: string[];
  
  // Actions
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  setSelectedLeads: (ids: string[]) => void;
  
  // Filters
  sourceFilter: {
    instagram: boolean;
    adLibrary: boolean;
    googleMaps: boolean;
  };
  cityFilter: string;
  serviceTypeFilter: string;
  toggleSourceFilter: (source: 'instagram' | 'adLibrary' | 'googleMaps') => void;
  setSourceFilter: (filter: { instagram: boolean; adLibrary: boolean; googleMaps: boolean }) => void;
  setCityFilter: (city: string) => void;
  setServiceTypeFilter: (serviceType: string) => void;
  
  // Keyword Session
  keywordSession: KeywordSession;
  startKeywordSession: (keywords: string[], city: string) => void;
  completeKeyword: (keyword: string) => void;
  addSessionResults: (leads: Lead[]) => void;
  endKeywordSession: () => void;
  
  // Settings
  googleScriptUrl: string;
  openaiApiKey: string;
  viewMode: 'table' | 'grid';
  viewDensity: 'compact' | 'expanded';
  setGoogleScriptUrl: (url: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setViewMode: (mode: 'table' | 'grid') => void;
  setViewDensity: (density: 'compact' | 'expanded') => void;
  
  // Sorting
  sortBy: keyof Lead | null;
  sortDirection: 'asc' | 'desc';
  setSortBy: (field: keyof Lead | null) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

export const useLeadStore = create<LeadStore>((set) => ({
  // Initial state
  leads: [],
  isLoading: false,
  error: null,
  selectedLeads: [],
  
  // Lead actions
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (updatedLead) => set((state) => ({
    leads: state.leads.map((lead) => lead.id === updatedLead.id ? updatedLead : lead)
  })),
  deleteLead: (id) => set((state) => ({
    leads: state.leads.filter((lead) => lead.id !== id)
  })),
  setSelectedLeads: (ids) => set({ selectedLeads: ids }),
  
  // Filter state
  sourceFilter: {
    instagram: true,
    adLibrary: true,
    googleMaps: true,
  },
  cityFilter: 'all',
  serviceTypeFilter: 'all',
  toggleSourceFilter: (source) => set((state) => ({
    sourceFilter: {
      ...state.sourceFilter,
      [source]: !state.sourceFilter[source]
    }
  })),
  setSourceFilter: (filter) => set({ sourceFilter: filter }),
  setCityFilter: (city) => set({ cityFilter: city }),
  setServiceTypeFilter: (serviceType) => set({ serviceTypeFilter: serviceType }),
  
  // Keyword session
  keywordSession: {
    active: false,
    keywords: [],
    completed: [],
    currentIndex: 0,
    results: [],
    totalFound: 0,
    city: '',
  },
  
  startKeywordSession: (keywords, city) => set({
    keywordSession: {
      active: true,
      keywords,
      completed: [],
      currentIndex: 0,
      results: [],
      totalFound: 0,
      city,
    }
  }),
  
  completeKeyword: (keyword) => set((state) => ({
    keywordSession: {
      ...state.keywordSession,
      completed: [...state.keywordSession.completed, keyword],
      currentIndex: state.keywordSession.currentIndex + 1,
    }
  })),
  
  addSessionResults: (newLeads) => set((state) => ({
    keywordSession: {
      ...state.keywordSession,
      results: [...state.keywordSession.results, ...newLeads],
      totalFound: state.keywordSession.totalFound + newLeads.length,
    }
  })),
  
  endKeywordSession: () => set((state) => ({
    keywordSession: {
      ...state.keywordSession,
      active: false,
    }
  })),
  
  // Settings
  googleScriptUrl: typeof window !== 'undefined' ? localStorage.getItem('googleScriptUrl') || '' : '',
  openaiApiKey: typeof window !== 'undefined' ? localStorage.getItem('openaiApiKey') || '' : '',
  viewMode: (typeof window !== 'undefined' ? localStorage.getItem('viewMode') || 'table' : 'table') as 'table' | 'grid',
  viewDensity: (typeof window !== 'undefined' ? localStorage.getItem('viewDensity') || 'expanded' : 'expanded') as 'compact' | 'expanded',
  
  setGoogleScriptUrl: (url) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('googleScriptUrl', url);
    }
    set({ googleScriptUrl: url });
  },
  
  setOpenAIApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openaiApiKey', key);
    }
    set({ openaiApiKey: key });
  },
  
  setViewMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewMode', mode);
    }
    set({ viewMode: mode });
  },
  
  setViewDensity: (density) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewDensity', density);
    }
    set({ viewDensity: density });
  },
  
  // Sorting
  sortBy: null,
  sortDirection: 'asc',
  setSortBy: (field) => set({ sortBy: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
}))