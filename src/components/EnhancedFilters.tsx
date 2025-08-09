import { useState, useMemo, useEffect, useRef } from 'react';
import { useLeadStore } from '@/lib/store';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface EnhancedFiltersProps {
  compact?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function EnhancedFilters({ compact = false, searchQuery = '', onSearchChange }: EnhancedFiltersProps = {}) {
  const { 
    leads, 
    sourceFilter, 
    setSourceFilter,
    cityFilter,
    serviceTypeFilter,
    setCityFilter,
    setServiceTypeFilter,
    currentMarket
  } = useLeadStore();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  

  // Get unique cities and service types (filtered by current market if selected)
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    let filteredLeads = leads;
    
    if (currentMarket && currentMarket.id !== 'all') {
      if (currentMarket.type === 'state') {
        filteredLeads = leads.filter(lead => lead.state === currentMarket.state);
      } else if (currentMarket.type === 'metro' || currentMarket.type === 'city') {
        filteredLeads = leads.filter(lead => 
          currentMarket.cities.includes(lead.city || '') && lead.state === currentMarket.state
        );
      }
    }
      
    filteredLeads.forEach(lead => {
      if (lead.city) citySet.add(lead.city);
    });
    return Array.from(citySet).sort();
  }, [leads, currentMarket]);


  // Filter leads based on all criteria
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Source filter
      if (lead.lead_source === 'Instagram Manual' && !sourceFilter.instagram) return false;
      if (lead.lead_source === 'FB Ad Library' && !sourceFilter.adLibrary) return false;
      if (lead.lead_source === 'Google Maps' && !sourceFilter.googleMaps) return false;
      if (lead.lead_source === 'CSV Import' && !sourceFilter.csvImport) return false;
      
      // City filter
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
      
      // Service type filter
      if (serviceTypeFilter !== 'all' && lead.service_type !== serviceTypeFilter) return false;
      
      return true;
    });
  }, [leads, sourceFilter, cityFilter, serviceTypeFilter]);

  // Count leads by source
  const sourceCounts = useMemo(() => {
    const nullCount = leads.filter(lead => lead.lead_source === null || lead.lead_source === undefined).length;
    
    return {
      instagram: leads.filter(lead => lead.lead_source === 'Instagram Manual').length,
      adLibrary: leads.filter(lead => lead.lead_source === 'FB Ad Library').length,
      googleMaps: leads.filter(lead => lead.lead_source === 'Google Maps').length,
      csvImport: leads.filter(lead => lead.lead_source === 'CSV Import').length,
      null: nullCount,
      total: leads.length
    };
  }, [leads]);

  // Check if all source filters are active
  const allSourcesActive = sourceFilter.instagram && sourceFilter.adLibrary && sourceFilter.googleMaps && sourceFilter.csvImport;

  const handleSourceClick = (source: 'instagram' | 'adLibrary' | 'googleMaps' | 'csvImport') => {
    if (sourceFilter[source] && !allSourcesActive) {
      setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true });
    } else {
      setSourceFilter({ 
        instagram: source === 'instagram',
        adLibrary: source === 'adLibrary',
        googleMaps: source === 'googleMaps',
        csvImport: source === 'csvImport'
      });
    }
  };

  // Mobile filter button
  if (compact && typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="px-3 py-1.5 text-xs rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-2 transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          {!allSourcesActive && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
              1
            </span>
          )}
        </button>
        
        {/* Mobile filter panel */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)}>
            <div 
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Source filters */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lead Sources</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      allSourcesActive
                        ? 'bg-yellow-500 border-yellow-600 text-black font-medium'
                        : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    All Sources ({sourceCounts.total})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('instagram')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.instagram && !allSourcesActive
                        ? 'bg-blue-600 border-blue-700 text-white font-medium'
                        : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Instagram ({sourceCounts.instagram})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('adLibrary')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.adLibrary && !allSourcesActive
                        ? 'bg-blue-600 border-blue-700 text-white font-medium'
                        : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    FB Ads ({sourceCounts.adLibrary})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('googleMaps')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.googleMaps && !allSourcesActive
                        ? 'bg-blue-600 border-blue-700 text-white font-medium'
                        : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Google Maps ({sourceCounts.googleMaps})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('csvImport')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.csvImport && !allSourcesActive
                        ? 'bg-blue-600 border-blue-700 text-white font-medium'
                        : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    CSV Import ({sourceCounts.csvImport})
                  </button>
                </div>
              </div>
              
              {/* Clear filters button */}
              <button
                onClick={() => {
                  setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true });
                  setShowMobileFilters(false);
                }}
                className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-800 text-gray-300 dark:text-gray-400 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 hover:text-white transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Search bar */}
      {onSearchChange && (
        <div className="flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
      
      {/* Source Filter Pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true })}
          className={`${
            compact 
              ? 'px-2 py-0.5 text-[11px]' 
              : 'px-2.5 py-1 text-xs'
          } rounded-full border transition-all duration-300 whitespace-nowrap ${
            allSourcesActive
              ? 'bg-yellow-500 border-yellow-600 text-black font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          All <span className="font-normal">({sourceCounts.total})</span>
        </button>
      
        <button
          onClick={() => handleSourceClick('instagram')}
          className={`${
            compact 
              ? 'px-2 py-0.5 text-[11px]' 
              : 'px-2.5 py-1 text-xs'
          } rounded-full border transition-all duration-300 whitespace-nowrap ${
            sourceFilter.instagram && !allSourcesActive
              ? 'bg-blue-600 border-blue-700 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          IG <span className="font-normal">({sourceCounts.instagram})</span>
        </button>
      
        <button
          onClick={() => handleSourceClick('adLibrary')}
          className={`${
            compact 
              ? 'px-2 py-0.5 text-[11px]' 
              : 'px-2.5 py-1 text-xs'
          } rounded-full border transition-all duration-300 whitespace-nowrap ${
            sourceFilter.adLibrary && !allSourcesActive
              ? 'bg-blue-600 border-blue-700 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          FB <span className="font-normal">({sourceCounts.adLibrary})</span>
        </button>
      
        <button
          onClick={() => handleSourceClick('googleMaps')}
          className={`${
            compact 
              ? 'px-2 py-0.5 text-[11px]' 
              : 'px-2.5 py-1 text-xs'
          } rounded-full border transition-all duration-300 whitespace-nowrap ${
            sourceFilter.googleMaps && !allSourcesActive
              ? 'bg-blue-600 border-blue-700 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          Maps <span className="font-normal">({sourceCounts.googleMaps})</span>
        </button>
      
        <button
          onClick={() => handleSourceClick('csvImport')}
          className={`${
            compact 
              ? 'px-2 py-0.5 text-[11px]' 
              : 'px-2.5 py-1 text-xs'
          } rounded-full border transition-all duration-300 whitespace-nowrap ${
            sourceFilter.csvImport && !allSourcesActive
              ? 'bg-blue-600 border-blue-700 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          CSV <span className="font-normal">({sourceCounts.csvImport})</span>
        </button>
      </div>
      
    </div>
  );
}