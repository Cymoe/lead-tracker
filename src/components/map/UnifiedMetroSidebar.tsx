import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import MarketFilters from './MarketFilters';
import ExportMarketData from './ExportMarketData';
import { MarketFilter, MarketMetrics } from '@/types/market-data';
import { OpportunityScorer } from '@/utils/opportunity-scorer';

interface Props {
  filter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
  markets: MarketMetrics[];
  selectedMarket: MarketMetrics | null;
  onMarketSelect: (market: MarketMetrics) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function UnifiedMetroSidebar({ 
  filter, 
  onFilterChange, 
  markets,
  selectedMarket,
  onMarketSelect,
  isCollapsed = false,
  onToggleCollapse
}: Props) {
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    topMarkets: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isCollapsed) {
    return (
      <div className="absolute left-4 top-4 z-[1200]">
        <button
          onClick={onToggleCollapse}
          className="bg-[#1F2937] p-2 rounded-lg shadow-lg hover:bg-[#374151] transition-all border border-[#374151]"
          title="Expand sidebar"
        >
          <ChevronRightIcon className="h-5 w-5 text-white" />
        </button>
      </div>
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
            <h3 className="font-medium text-white">Market Filters</h3>
            {expandedSections.filters ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.filters && (
            <div className="px-4 pb-4 -mt-4">
              <MarketFilters
                filter={filter}
                onFilterChange={onFilterChange}
              />
            </div>
          )}
        </div>



        {/* Top Markets Section */}
        <div className="border-b border-[#374151]">
          <button
            onClick={() => toggleSection('topMarkets')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#374151] transition-colors"
          >
            <h3 className="font-medium text-white">Top Acquisition Markets</h3>
            {expandedSections.topMarkets ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.topMarkets && (
            <div className="px-4 pb-4 max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {markets.slice(0, 10).map((market, index) => {
                  const health = OpportunityScorer.getMarketHealth(market);
                  const isSelected = selectedMarket?.city === market.city;
                  
                  return (
                    <div
                      key={`${market.city}-${market.stateCode}`}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6]' 
                          : 'bg-[#374151] border-2 border-transparent hover:bg-[#374151]/80'
                      }`}
                      onClick={() => onMarketSelect(market)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                          <h4 className="font-medium text-white">
                            {market.city}, {market.stateCode}
                          </h4>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: health.color }}
                          title={health.status}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Score: {market.opportunityScore}/100</span>
                        <span className="text-gray-500">{market.market.yearlyTransactions} deals/yr</span>
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-500">
                        {market.demographics.boomerBusinessOwners.toLocaleString()} boomer-owned businesses
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {markets.length > 10 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Showing top 10 of {markets.length} markets
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-[#374151] bg-[#111827]">
        <ExportMarketData 
          metroData={markets}
          viewMode="metro"
        />
        
        {/* Pro Tip */}
        <div className="mt-3 p-3 bg-[#3B82F6]/10 rounded-lg border border-[#3B82F6]/20">
          <p className="text-xs text-[#60A5FA] font-medium">💡 Pro Tip:</p>
          <p className="text-xs text-[#93BBFC] mt-1">
            Focus on markets with high scores but moderate competition levels for the best opportunities.
          </p>
        </div>
      </div>
    </div>
  );
} 