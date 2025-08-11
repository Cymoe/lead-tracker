import { create } from 'zustand';
import { Lead, KeywordSession, DynamicMarket, MarketHierarchy } from '@/types';
import { detectMetroArea, groupCitiesByMetro } from '@/utils/metro-areas';
import { normalizeState } from '@/utils/state-utils';
import { getStateFromPhone } from '@/utils/area-codes';
import { getCityFromPhone } from '@/utils/area-code-cities';

interface ImportStatus {
  id: string;
  type: 'apify' | 'csv' | 'google-maps';
  status: 'connecting' | 'processing' | 'finalizing' | 'completed' | 'error';
  message: string;
  details?: string;
  metadata?: {
    runId?: string;
    searchQuery?: string;
    city?: string;
    filename?: string;
  };
  progress?: {
    current: number;
    total: number;
  };
  startedAt: Date;
  completedAt?: Date;
  result?: {
    imported: number;
    skipped: number;
    failed: number;
  };
}

interface LeadStore {
  // Leads
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  selectedLeads: string[];
  newlyImportedLeads: string[]; // Track newly imported lead IDs
  
  // Import Status
  activeImports: ImportStatus[];
  addImportStatus: (status: Omit<ImportStatus, 'id' | 'startedAt'>) => string;
  updateImportStatus: (id: string, updates: Partial<ImportStatus>) => void;
  removeImportStatus: (id: string) => void;
  clearCompletedImports: () => void;
  
  // Actions
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  addLeads: (leads: Lead[]) => void; // Bulk add leads
  updateLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  setSelectedLeads: (ids: string[]) => void;
  clearNewlyImported: () => void; // Clear newly imported highlights
  resetAllLeads: () => void; // Reset all leads data
  
  // Filters
  sourceFilter: {
    instagram: boolean;
    adLibrary: boolean;
    googleMaps: boolean;
    csvImport: boolean;
  };
  cityFilter: string;
  serviceTypeFilter: string;
  showOnlyNewImports: boolean;
  toggleSourceFilter: (source: 'instagram' | 'adLibrary' | 'googleMaps' | 'csvImport') => void;
  setSourceFilter: (filter: { instagram: boolean; adLibrary: boolean; googleMaps: boolean; csvImport: boolean }) => void;
  setCityFilter: (city: string) => void;
  setServiceTypeFilter: (serviceType: string) => void;
  setShowOnlyNewImports: (show: boolean) => void;
  
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
  initializeSettings: () => void;
  
  // Sorting
  sortBy: keyof Lead | null;
  sortDirection: 'asc' | 'desc';
  setSortBy: (field: keyof Lead | null) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  
  // Dynamic Markets
  currentMarket: DynamicMarket | null;
  marketHierarchy: MarketHierarchy[];
  expandedMarkets: Set<string>;
  setCurrentMarket: (market: DynamicMarket | null) => void;
  toggleMarketExpanded: (marketId: string) => void;
  getDynamicMarkets: () => MarketHierarchy[];
  getMarketStats: (market: DynamicMarket) => { totalLeads: number; withAds: number; adPercentage: number };
}

// Helper to save imports to localStorage
const saveImportsToStorage = (imports: ImportStatus[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('activeImports', JSON.stringify(imports));
  }
};

// Helper to load imports from localStorage
const loadImportsFromStorage = (): ImportStatus[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeImports');
    if (stored) {
      try {
        const imports = JSON.parse(stored);
        // Convert date strings back to Date objects
        return imports.map((imp: any) => ({
          ...imp,
          startedAt: new Date(imp.startedAt),
          completedAt: imp.completedAt ? new Date(imp.completedAt) : undefined
        }));
      } catch (e) {
        console.error('Failed to parse stored imports:', e);
        return [];
      }
    }
  }
  return [];
};

export const useLeadStore = create<LeadStore>((set, get) => ({
  // Initial state
  leads: [],
  isLoading: false,
  error: null,
  selectedLeads: [],
  newlyImportedLeads: [],
  activeImports: loadImportsFromStorage(),
  
  // Import Status actions
  addImportStatus: (status) => {
    const id = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newImport: ImportStatus = {
      ...status,
      id,
      startedAt: new Date()
    };
    set((state) => {
      const newImports = [...state.activeImports, newImport];
      saveImportsToStorage(newImports);
      return { activeImports: newImports };
    });
    return id;
  },
  
  updateImportStatus: (id, updates) => set((state) => {
    const newImports = state.activeImports.map(imp => 
      imp.id === id ? { ...imp, ...updates } : imp
    );
    saveImportsToStorage(newImports);
    return { activeImports: newImports };
  }),
  
  removeImportStatus: (id) => set((state) => {
    const newImports = state.activeImports.filter(imp => imp.id !== id);
    saveImportsToStorage(newImports);
    return { activeImports: newImports };
  }),
  
  clearCompletedImports: () => set((state) => {
    const newImports = state.activeImports.filter(imp => 
      imp.status !== 'completed' && imp.status !== 'error'
    );
    saveImportsToStorage(newImports);
    return { activeImports: newImports };
  }),
  
  // Lead actions
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ 
    leads: [lead, ...state.leads],
    newlyImportedLeads: [...state.newlyImportedLeads, lead.id]
  })),
  addLeads: (leads) => set((state) => ({ 
    leads: [...leads, ...state.leads],
    newlyImportedLeads: [...state.newlyImportedLeads, ...leads.map(l => l.id)]
  })),
  updateLead: (updatedLead) => set((state) => ({
    leads: state.leads.map((lead) => lead.id === updatedLead.id ? updatedLead : lead)
  })),
  deleteLead: (id) => set((state) => ({
    leads: state.leads.filter((lead) => lead.id !== id),
    newlyImportedLeads: state.newlyImportedLeads.filter(leadId => leadId !== id)
  })),
  setSelectedLeads: (ids) => set({ selectedLeads: ids }),
  clearNewlyImported: () => set({ newlyImportedLeads: [] }),
  resetAllLeads: () => set({ 
    leads: [], 
    selectedLeads: [], 
    newlyImportedLeads: [],
    error: null
  }),
  
  // Filter state
  sourceFilter: {
    instagram: true,
    adLibrary: true,
    googleMaps: true,
    csvImport: true,
  },
  cityFilter: 'all',
  serviceTypeFilter: 'all',
  showOnlyNewImports: false,
  toggleSourceFilter: (source) => set((state) => ({
    sourceFilter: {
      ...state.sourceFilter,
      [source]: !state.sourceFilter[source]
    }
  })),
  setSourceFilter: (filter) => set({ sourceFilter: filter }),
  setCityFilter: (city) => set({ cityFilter: city }),
  setServiceTypeFilter: (serviceType) => set({ serviceTypeFilter: serviceType }),
  setShowOnlyNewImports: (show) => set({ showOnlyNewImports: show }),
  
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
  
  // Settings - Initialize with defaults, load from localStorage later
  googleScriptUrl: '',
  openaiApiKey: '',
  viewMode: 'table' as 'table' | 'grid',
  viewDensity: 'expanded' as 'compact' | 'expanded',
  
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
  
  // Initialize settings from localStorage
  initializeSettings: () => {
    if (typeof window !== 'undefined') {
      const googleScriptUrl = localStorage.getItem('googleScriptUrl') || '';
      const openaiApiKey = localStorage.getItem('openaiApiKey') || '';
      const viewMode = (localStorage.getItem('viewMode') || 'table') as 'table' | 'grid';
      const viewDensity = (localStorage.getItem('viewDensity') || 'expanded') as 'compact' | 'expanded';
      
      set({
        googleScriptUrl,
        openaiApiKey,
        viewMode,
        viewDensity
      });
    }
  },
  
  // Sorting
  sortBy: null,
  sortDirection: 'asc',
  setSortBy: (field) => set({ sortBy: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  
  // Dynamic Markets
  currentMarket: null,
  marketHierarchy: [],
  expandedMarkets: new Set<string>(),
  
  setCurrentMarket: (market) => set({ currentMarket: market }),
  
  toggleMarketExpanded: (marketId) => set((state) => {
    const newExpanded = new Set(state.expandedMarkets);
    if (newExpanded.has(marketId)) {
      newExpanded.delete(marketId);
    } else {
      newExpanded.add(marketId);
    }
    return { expandedMarkets: newExpanded };
  }),
  
  getDynamicMarkets: () => {
    const state = useLeadStore.getState();
    const { leads } = state;
    
    // Group leads by location
    const locationMap = new Map<string, { city: string; state: string; count: number; withAds: number }>();
    const stateMap = new Map<string, { count: number; withAds: number; cities: Set<string> }>();
    
    leads.forEach(lead => {
      // ALWAYS use the city and state from the lead data first
      // This ensures leads stay in the market they were imported for
      let city = lead.city?.trim() || '';
      let state = normalizeState(lead.state);
      
      // Only use fallback detection if BOTH city and state are missing
      // This prevents leads from being reassigned to different markets
      if (!state && !city) {
        // For unassigned leads, we'll keep them unassigned rather than
        // creating phantom markets from phone numbers or company names
        // This ensures clean market segregation based on actual import locations
        
        // You can uncomment the code below if you want fallback detection
        // but it may create unwanted market entries like "Vancouver"
        /*
        // Method 1: Extract city from company name if not already set
        if (lead.company_name) {
          // Common patterns: "Company - City" or "Company in City"
          const dashMatch = lead.company_name.match(/\s*-\s*([A-Za-z\s]+?)$/);
          const inMatch = lead.company_name.match(/\sin\s+([A-Za-z\s]+?)$/i);
          const potentialCity = dashMatch?.[1] || inMatch?.[1];
          
          if (potentialCity) {
            const trimmedCity = potentialCity.trim();
            // Check if this is a known city
            const detectedMetro = detectMetroArea(trimmedCity, '');
            if (detectedMetro) {
              city = trimmedCity;
              state = detectedMetro.state;
            }
          }
        }
        
        // Method 2: Use phone as last resort only if nothing else worked
        if (!city && !state && lead.phone) {
          const phoneState = getStateFromPhone(lead.phone);
          const phoneCity = getCityFromPhone(lead.phone);
          if (phoneState) state = phoneState;
          if (phoneCity) city = phoneCity;
        }
        */
      }
      
      if (city || state) {
        // Handle city+state combinations
        if (city && state) {
          const key = `${city}|${state}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, { city, state, count: 0, withAds: 0 });
          }
          const loc = locationMap.get(key)!;
          loc.count++;
          if (lead.running_ads) loc.withAds++;
        } else if (city && !state) {
          // City without state - still track it
          const key = `${city}|Unknown`;
          if (!locationMap.has(key)) {
            locationMap.set(key, { city, state: 'Unknown', count: 0, withAds: 0 });
          }
          const loc = locationMap.get(key)!;
          loc.count++;
          if (lead.running_ads) loc.withAds++;
        }
        
        // Track state data
        if (state && state !== 'Unknown') {
          if (!stateMap.has(state)) {
            stateMap.set(state, { count: 0, withAds: 0, cities: new Set() });
          }
          const stateData = stateMap.get(state)!;
          stateData.count++;
          if (lead.running_ads) stateData.withAds++;
          if (city) stateData.cities.add(city);
        }
      }
    });
    
    // Build hierarchy
    const hierarchy: MarketHierarchy[] = [];
    
    // Add "All Markets" root
    hierarchy.push({
      market: {
        id: 'all',
        name: 'All Markets',
        type: 'all',
        cities: [],
        leadCount: leads.length,
        adPercentage: leads.filter(l => l.running_ads).length / leads.length * 100
      },
      children: []
    });
    
    // Process states and their cities
    Array.from(stateMap.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .forEach(([state, stateData]) => {
        const stateCities = Array.from(locationMap.entries())
          .filter(([, loc]) => loc.state === state)
          .map(([key, loc]) => ({ key, ...loc }))
          .sort((a, b) => b.count - a.count);
        
        // Check for metro areas
        const metroGroups = groupCitiesByMetro(stateCities.map(c => ({ city: c.city, state: c.state, count: c.count })));
        const stateChildren: MarketHierarchy[] = [];
        
        // Add metro areas
        metroGroups.forEach((cities, metroKey) => {
          const [name, metroState] = metroKey.split('|');
          if (cities.length > 1) {
            // It's a metro area
            const metroCount = cities.reduce((sum, c) => sum + c.count, 0);
            const metroWithAds = cities.reduce((sum, c) => {
              const loc = locationMap.get(`${c.city}|${state}`);
              return sum + (loc?.withAds || 0);
            }, 0);
            
            stateChildren.push({
              market: {
                id: `metro-${name.toLowerCase().replace(/\s+/g, '-')}-${metroState}`,
                name: name,
                type: 'metro',
                state: metroState,
                cities: cities.map(c => c.city),
                leadCount: metroCount,
                adPercentage: metroCount > 0 ? (metroWithAds / metroCount) * 100 : 0
              },
              children: cities.map(c => ({
                market: {
                  id: `city-${c.city.toLowerCase().replace(/\s+/g, '-')}-${metroState}`,
                  name: c.city,
                  type: 'city',
                  state: metroState,
                  cities: [c.city],
                  leadCount: c.count,
                  parentId: `metro-${name.toLowerCase().replace(/\s+/g, '-')}-${metroState}`,
                  adPercentage: locationMap.get(`${c.city}|${metroState}`)?.withAds ? 
                    (locationMap.get(`${c.city}|${metroState}`)!.withAds / c.count) * 100 : 0
                },
                children: []
              }))
            });
          } else {
            // Individual city (show all cities, not just 10+)
            const loc = locationMap.get(`${cities[0].city}|${state}`)!;
            stateChildren.push({
              market: {
                id: `city-${cities[0].city.toLowerCase().replace(/\s+/g, '-')}-${state}`,
                name: cities[0].city,
                type: 'city',
                state: state,
                cities: [cities[0].city],
                leadCount: cities[0].count,
                adPercentage: loc.count > 0 ? (loc.withAds / loc.count) * 100 : 0
              },
              children: []
            });
          }
        });
        
        // Add state node
        hierarchy[0].children.push({
          market: {
            id: `state-${state}`,
            name: `${state} (${stateData.count} leads)`,
            type: 'state',
            state: state,
            cities: Array.from(stateData.cities),
            leadCount: stateData.count,
            adPercentage: stateData.count > 0 ? (stateData.withAds / stateData.count) * 100 : 0
          },
          children: stateChildren.sort((a, b) => b.market.leadCount - a.market.leadCount)
        });
      });
    
    return hierarchy;
  },
  
  getMarketStats: (market) => {
    const state = useLeadStore.getState();
    const { leads } = state;
    
    let filteredLeads: Lead[] = [];
    
    if (market.type === 'all') {
      filteredLeads = leads;
    } else if (market.type === 'state') {
      filteredLeads = leads.filter(lead => lead.state === market.state);
    } else if (market.type === 'metro' || market.type === 'city') {
      filteredLeads = leads.filter(lead => 
        market.cities.includes(lead.city || '') && lead.state === market.state
      );
    }
    
    const totalLeads = filteredLeads.length;
    const withAds = filteredLeads.filter(l => l.running_ads).length;
    const adPercentage = totalLeads > 0 ? (withAds / totalLeads) * 100 : 0;
    
    return { totalLeads, withAds, adPercentage };
  },
}))