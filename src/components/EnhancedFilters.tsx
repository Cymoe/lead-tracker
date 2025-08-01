import { useState, useMemo, useEffect, useRef } from 'react';
import { useLeadStore } from '@/lib/store';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface EnhancedFiltersProps {
  compact?: boolean;
}

export default function EnhancedFilters({ compact = false }: EnhancedFiltersProps = {}) {
  const { 
    leads, 
    sourceFilter, 
    setSourceFilter,
    cityFilter,
    serviceTypeFilter,
    setCityFilter,
    setServiceTypeFilter
  } = useLeadStore();
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique cities and service types
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    leads.forEach(lead => {
      if (lead.city) citySet.add(lead.city);
    });
    return Array.from(citySet).sort();
  }, [leads]);

  const serviceTypes = useMemo(() => {
    const typeSet = new Set<string>();
    leads.forEach(lead => {
      if (lead.service_type) typeSet.add(lead.service_type);
    });
    return Array.from(typeSet).sort();
  }, [leads]);

  // Filter leads based on all criteria
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Source filter
      if (lead.lead_source === 'Instagram Manual' && !sourceFilter.instagram) return false;
      if (lead.lead_source === 'FB Ad Library' && !sourceFilter.adLibrary) return false;
      if (lead.lead_source === 'Google Maps' && !sourceFilter.googleMaps) return false;
      
      // City filter
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
      
      // Service type filter
      if (serviceTypeFilter !== 'all' && lead.service_type !== serviceTypeFilter) return false;
      
      return true;
    });
  }, [leads, sourceFilter, cityFilter, serviceTypeFilter]);

  // Count leads by source (respecting other filters)
  const sourceCounts = useMemo(() => {
    const baseFiltered = leads.filter(lead => {
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
      if (serviceTypeFilter !== 'all' && lead.service_type !== serviceTypeFilter) return false;
      return true;
    });

    return {
      instagram: baseFiltered.filter(lead => lead.lead_source === 'Instagram Manual').length,
      adLibrary: baseFiltered.filter(lead => lead.lead_source === 'FB Ad Library').length,
      googleMaps: baseFiltered.filter(lead => lead.lead_source === 'Google Maps').length,
      total: baseFiltered.length
    };
  }, [leads, cityFilter, serviceTypeFilter]);

  // Check if all source filters are active
  const allSourcesActive = sourceFilter.instagram && sourceFilter.adLibrary && sourceFilter.googleMaps;

  const handleSourceClick = (source: 'instagram' | 'adLibrary' | 'googleMaps') => {
    if (sourceFilter[source] && !allSourcesActive) {
      setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true });
    } else {
      setSourceFilter({ 
        instagram: source === 'instagram',
        adLibrary: source === 'adLibrary',
        googleMaps: source === 'googleMaps'
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
          {(cityFilter !== 'all' || serviceTypeFilter !== 'all' || !allSourcesActive) && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
              {[cityFilter !== 'all', serviceTypeFilter !== 'all', !allSourcesActive].filter(Boolean).length}
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
              
              {/* City filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Cities ({cities.length})</option>
                  {cities.map(city => {
                    const count = leads.filter(l => l.city === city && 
                      (serviceTypeFilter === 'all' || l.service_type === serviceTypeFilter)).length;
                    return (
                      <option key={city} value={city}>
                        {city} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {/* Service type filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Services ({serviceTypes.length})</option>
                  {serviceTypes.map(type => {
                    const count = leads.filter(l => l.service_type === type && 
                      (cityFilter === 'all' || l.city === cityFilter)).length;
                    return (
                      <option key={type} value={type}>
                        {type} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {/* Source filters */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lead Sources</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      allSourcesActive
                        ? 'bg-blue-600 border-blue-700 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All Sources ({sourceCounts.total})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('instagram')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.instagram && !allSourcesActive
                        ? 'bg-purple-600 border-purple-700 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Instagram ({sourceCounts.instagram})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('adLibrary')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.adLibrary && !allSourcesActive
                        ? 'bg-indigo-600 border-indigo-700 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    FB Ads ({sourceCounts.adLibrary})
                  </button>
                  
                  <button
                    onClick={() => handleSourceClick('googleMaps')}
                    className={`w-full px-3 py-2 rounded-lg border transition-all ${
                      sourceFilter.googleMaps && !allSourcesActive
                        ? 'bg-green-600 border-green-700 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Google Maps ({sourceCounts.googleMaps})
                  </button>
                </div>
              </div>
              
              {/* Clear filters button */}
              <button
                onClick={() => {
                  setCityFilter('all');
                  setServiceTypeFilter('all');
                  setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true });
                  setShowMobileFilters(false);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {/* Location and Service Type Dropdowns */}
      <div className="flex gap-1.5">
        {/* City Dropdown */}
        <div className="relative" ref={cityDropdownRef}>
          <button
            onClick={() => {
              setShowCityDropdown(!showCityDropdown);
              setShowServiceDropdown(false);
            }}
            className={`${
              compact 
                ? "px-2.5 py-1 text-xs" 
                : "px-3 py-1.5 text-xs"
            } rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1 transition-all duration-300`}
          >
            <span className="font-medium truncate">
              {cityFilter === 'all' ? 'All Cities' : cityFilter}
            </span>
            <ChevronDownIcon className={`transition-all duration-300 flex-shrink-0 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
          </button>
          
          {showCityDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              <button
                onClick={() => {
                  setCityFilter('all');
                  setShowCityDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                All Cities ({cities.length})
              </button>
              {cities.map(city => {
                const count = leads.filter(l => l.city === city && 
                  (serviceTypeFilter === 'all' || l.service_type === serviceTypeFilter)).length;
                return (
                  <button
                    key={city}
                    onClick={() => {
                      setCityFilter(city);
                      setShowCityDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex justify-between"
                  >
                    <span>{city}</span>
                    <span className="text-gray-500">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Service Type Dropdown */}
        <div className="relative" ref={serviceDropdownRef}>
          <button
            onClick={() => {
              setShowServiceDropdown(!showServiceDropdown);
              setShowCityDropdown(false);
            }}
            className={`${
              compact 
                ? "px-2.5 py-1 text-xs" 
                : "px-3 py-1.5 text-xs"
            } rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-between gap-1 transition-all duration-300`}
          >
            <span className="font-medium truncate">
              {serviceTypeFilter === 'all' ? 'All Services' : serviceTypeFilter}
            </span>
            <ChevronDownIcon className={`transition-all duration-300 flex-shrink-0 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
          </button>
          
          {showServiceDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              <button
                onClick={() => {
                  setServiceTypeFilter('all');
                  setShowServiceDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                All Service Types ({serviceTypes.length})
              </button>
              {serviceTypes.map(type => {
                const count = leads.filter(l => l.service_type === type && 
                  (cityFilter === 'all' || l.city === cityFilter)).length;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setServiceTypeFilter(type);
                      setShowServiceDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex justify-between"
                  >
                    <span>{type}</span>
                    <span className="text-gray-500">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
      
      {/* Source Filter Pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true })}
          className={`${
            compact 
              ? 'px-2 py-0.5 text-[11px]' 
              : 'px-2.5 py-1 text-xs'
          } rounded-full border transition-all duration-300 whitespace-nowrap ${
            allSourcesActive
              ? 'bg-blue-500 border-blue-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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
              ? 'bg-purple-500 border-purple-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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
              ? 'bg-indigo-500 border-indigo-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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
              ? 'bg-green-500 border-green-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Maps <span className="font-normal">({sourceCounts.googleMaps})</span>
        </button>
      </div>
      
    </div>
  );
}