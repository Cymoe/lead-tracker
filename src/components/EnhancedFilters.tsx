import { useState, useMemo } from 'react';
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

  return (
    <div className="flex items-center gap-3">
      {/* Location and Service Type Dropdowns */}
      <div className="flex gap-2">
        {/* City Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className={`${
              compact 
                ? "px-2 py-1 text-xs min-w-[80px]" 
                : "px-3 py-1.5 text-xs min-w-[120px]"
            } rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1 transition-all duration-300`}
          >
            <span className="font-medium truncate">
              {cityFilter === 'all' ? (compact ? 'Cities' : 'All Cities') : cityFilter}
            </span>
            <ChevronDownIcon className={`transition-all duration-300 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
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
        <div className="relative">
          <button
            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
            className={`${
              compact 
                ? "px-2 py-1 text-xs min-w-[120px]" 
                : "px-3 py-1.5 text-xs min-w-[160px]"
            } rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-between gap-1 transition-all duration-300`}
          >
            <span className="font-medium truncate">
              {serviceTypeFilter === 'all' ? (compact ? 'Services' : 'All Services') : serviceTypeFilter}
            </span>
            <ChevronDownIcon className={`transition-all duration-300 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
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
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true })}
          className={`${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'} rounded-md border transition-all duration-300 ${
            allSourcesActive
              ? 'bg-blue-600 border-blue-700 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Sources ({sourceCounts.total})
        </button>
      
        <button
          onClick={() => handleSourceClick('instagram')}
          className={`${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'} rounded-md border transition-all duration-300 ${
            sourceFilter.instagram && !allSourcesActive
              ? 'bg-purple-600 border-purple-700 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Instagram ({sourceCounts.instagram})
        </button>
      
        <button
          onClick={() => handleSourceClick('adLibrary')}
          className={`${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'} rounded-md border transition-all duration-300 ${
            sourceFilter.adLibrary && !allSourcesActive
              ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          FB Ads ({sourceCounts.adLibrary})
        </button>
      
        <button
          onClick={() => handleSourceClick('googleMaps')}
          className={`${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'} rounded-md border transition-all duration-300 ${
            sourceFilter.googleMaps && !allSourcesActive
              ? 'bg-green-600 border-green-700 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Google Maps ({sourceCounts.googleMaps})
        </button>
      </div>
      
    </div>
  );
}