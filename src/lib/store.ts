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
  toggleSourceFilter: (source: 'instagram' | 'adLibrary' | 'googleMaps') => void;
  
  // Keyword Session
  keywordSession: KeywordSession;
  startKeywordSession: (keywords: string[], city: string) => void;
  completeKeyword: (keyword: string) => void;
  addSessionResults: (leads: Lead[]) => void;
  endKeywordSession: () => void;
  
  // Settings
  googleScriptUrl: string;
  openaiApiKey: string;
  setGoogleScriptUrl: (url: string) => void;
  setOpenAIApiKey: (key: string) => void;
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
  toggleSourceFilter: (source) => set((state) => ({
    sourceFilter: {
      ...state.sourceFilter,
      [source]: !state.sourceFilter[source]
    }
  })),
  
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
}))