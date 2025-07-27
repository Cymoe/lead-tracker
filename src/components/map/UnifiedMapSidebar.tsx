import { useState, useMemo } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FunnelIcon,
  MapIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import CountyFilters from './CountyFilters';
import ExportMarketData from './ExportMarketData';
import { CountyFilter } from '@/services/county-data-aggregator';
import { CountyMarketMetrics } from '@/services/county-data-aggregator';
import { MARKET_CONSTANTS } from '@/config/market-constants';

interface Props {
  filter: CountyFilter;
  onFilterChange: (filter: CountyFilter) => void;
  viewMode: 'metro' | 'county';
  countyMetrics: Map<string, CountyMarketMetrics>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLocationClick?: (fipsCode: string) => void;
}

export default function UnifiedMapSidebar({ 
  filter, 
  onFilterChange, 
  viewMode, 
  countyMetrics,
  isCollapsed = false,
  onToggleCollapse,
  onLocationClick
}: Props) {
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    results: true,
    stats: false
  });

  // Get sorted counties for results list
  const sortedCounties = useMemo(() => {
    return Array.from(countyMetrics.values())
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 100); // Top 100 for performance
  }, [countyMetrics]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isCollapsed) {
    return (
      <>
        {/* Floating expand button - no container div */}
        <div className="absolute left-4 top-4 z-[1200]">
          <button
            onClick={onToggleCollapse}
            className="bg-[#1F2937] p-2 rounded-lg shadow-lg hover:bg-[#374151] transition-all border border-[#374151]"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="h-5 w-5 text-white" />
          </button>
        </div>
        {/* Empty div to maintain consistent return structure */}
        <div className="hidden" />
      </>
    );
  }

  return (
    <div className="absolute left-0 top-0 h-full w-96 bg-[#1F2937] shadow-xl z-[1100] flex flex-col border-r border-[#374151]">
      {/* Header */}
      <div className="p-4 border-b border-[#374151] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Map Controls</h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-[#374151] rounded transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Filters Section */}
        <div className="border-b border-[#374151]">
          <button
            onClick={() => toggleSection('filters')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#374151] transition-colors"
          >
            <h3 className="font-medium text-white">Filters</h3>
            {expandedSections.filters ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.filters && (
            <div className="px-4 pb-4 -mt-4">
              <CountyFilters
                filter={filter}
                onFilterChange={onFilterChange}
                viewMode={viewMode}
              />
            </div>
          )}
        </div>

        {/* Results List Section */}
        <div className="border-b border-[#374151]">
          <button
            onClick={() => toggleSection('results')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#374151] transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-white">Top Counties</h3>
              <span className="text-xs bg-[#374151] text-gray-300 px-2 py-0.5 rounded-full">
                {sortedCounties.length}
              </span>
            </div>
            {expandedSections.results ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.results && (
            <div className="max-h-96 overflow-y-auto">
              {sortedCounties.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <MapIcon className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">No counties loaded</p>
                  <p className="text-xs mt-1">Apply filters to see results</p>
                </div>
              ) : (
                <div className="divide-y divide-[#374151]">
                  {sortedCounties.map((county, idx) => (
                    <div
                      key={county.fipsCode}
                      className="px-4 py-3 hover:bg-[#374151] cursor-pointer transition-colors group"
                      onClick={() => onLocationClick?.(county.fipsCode)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">#{idx + 1}</span>
                            <h4 className="text-sm font-medium text-white truncate">
                              {county.countyName}, {county.stateAbbr}
                            </h4>
                          </div>
                          
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <BuildingOfficeIcon className="h-3 w-3" />
                              {county.businessMetrics.boomerOwnedEstimate.toLocaleString()}
                            </span>
                            <span className={`font-medium ${
                              county.marketClassification === 'tertiary' ? 'text-emerald-400' :
                              county.marketClassification === 'secondary' ? 'text-blue-400' :
                              'text-gray-400'
                            }`}>
                              {county.marketClassification}
                            </span>
                          </div>
                          
                          {county.industryFocus.topGreyTsunamiIndustries.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500 truncate">
                                {county.industryFocus.topGreyTsunamiIndustries[0]}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-3 flex flex-col items-end">
                          <div className={`text-lg font-bold ${
                            county.opportunityScore >= 80 ? 'text-red-600' :
                            county.opportunityScore >= 70 ? 'text-amber-600' :
                            county.opportunityScore >= 60 ? 'text-blue-600' :
                            'text-emerald-600'
                          }`}>
                            {county.opportunityScore}
                          </div>
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Overview Section */}
        <div className="border-b border-[#374151]">
          <button
            onClick={() => toggleSection('stats')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#374151] transition-colors"
          >
            <h3 className="font-medium text-white">Market Overview</h3>
            {expandedSections.stats ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.stats && (
            <div className="px-4 pb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Counties Analyzed:</span>
                  <span className="font-medium text-white">{countyMetrics.size.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hot Markets (80+):</span>
                  <span className="font-medium text-red-400">
                    {Array.from(countyMetrics.values()).filter(c => c.opportunityScore >= 80).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tertiary Markets:</span>
                  <span className="font-medium text-emerald-400">
                    {Array.from(countyMetrics.values()).filter(c => c.marketClassification === 'tertiary').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Boomer Businesses:</span>
                  <span className="font-medium text-white">
                    {Array.from(countyMetrics.values())
                      .reduce((sum, c) => sum + c.businessMetrics.boomerOwnedEstimate, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-[#374151] bg-[#111827]">
        <ExportMarketData 
          countyData={countyMetrics}
          viewMode="county"
        />
        
        {/* Pro Tip */}
        <div className="mt-3 p-3 bg-[#3B82F6]/10 rounded-lg border border-[#3B82F6]/20">
          <p className="text-xs text-[#60A5FA] font-medium">💡 Pro Tip:</p>
          <p className="text-xs text-[#93BBFC] mt-1">
            Tertiary markets (&lt;250K pop) often have less PE competition and motivated sellers.
          </p>
        </div>
      </div>
    </div>
  );
} 