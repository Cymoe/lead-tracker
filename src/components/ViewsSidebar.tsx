import { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '@/lib/store';
import { useLayout } from '@/contexts/LayoutContext';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { MarketHierarchy, DynamicMarket } from '@/types';
import { detectMetroArea } from '@/utils/metro-areas';
import { normalizeState } from '@/utils/state-utils';
import { getStateFromPhone } from '@/utils/area-codes';
import { getCityFromPhone } from '@/utils/area-code-cities';
import UnassignedLeadsModal from '@/components/modals/UnassignedLeadsModal';

interface ViewsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewsSidebar({ isOpen, onClose }: ViewsSidebarProps) {
  const { 
    currentMarket, 
    setCurrentMarket, 
    getDynamicMarkets, 
    leads 
  } = useLeadStore();
  
  // Get sidebar state from context
  const { isSidebarCollapsed } = useLayout();
  
  const [marketHierarchy, setMarketHierarchy] = useState<MarketHierarchy[]>([]);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'markets' | 'queries'>('markets');
  
  
  // Load dynamic markets
  useEffect(() => {
    const markets = getDynamicMarkets();
    setMarketHierarchy(markets);
  }, [leads, getDynamicMarkets]);
  

  
  // Group leads by search query AND market
  const searchQueriesByMarket = useMemo(() => {
    const marketQueries = new Map<string, Map<string, number>>();
    
    leads.forEach(lead => {
      if (lead.search_query && lead.city && lead.state) {
        const marketKey = `${lead.city}, ${lead.state}`;
        
        if (!marketQueries.has(marketKey)) {
          marketQueries.set(marketKey, new Map());
        }
        
        const queries = marketQueries.get(marketKey)!;
        queries.set(lead.search_query, (queries.get(lead.search_query) || 0) + 1);
      }
    });
    
    // Convert to sorted structure
    const result: Array<{
      market: string;
      queries: Array<{ query: string; count: number }>;
      totalCount: number;
    }> = [];
    
    marketQueries.forEach((queries, market) => {
      const sortedQueries = Array.from(queries.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([query, count]) => ({ query, count }));
      
      const totalCount = sortedQueries.reduce((sum, q) => sum + q.count, 0);
      
      result.push({
        market,
        queries: sortedQueries,
        totalCount
      });
    });
    
    // Sort markets by total lead count
    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [leads]);
  
  // All search queries (ungrouped) for backward compatibility
  const searchQueries = useMemo(() => {
    const queries = new Map<string, number>();
    
    leads.forEach(lead => {
      if (lead.search_query) {
        queries.set(lead.search_query, (queries.get(lead.search_query) || 0) + 1);
      }
    });
    
    // Sort by count descending
    return Array.from(queries.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([query, count]) => ({ query, count }));
  }, [leads]);
  
  const toggleExpanded = (marketId: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(marketId)) {
      newExpanded.delete(marketId);
    } else {
      newExpanded.add(marketId);
    }
    setExpandedStates(newExpanded);
  };
  

  
  const renderMarketItem = (node: MarketHierarchy, level: number = 0) => {
    const { market, children } = node;
    const isExpanded = expandedStates.has(market.id);
    const isActive = currentMarket?.id === market.id;
    const hasChildren = children.length > 0;
    const isStateLevel = market.type === 'state';
    
    // Special handling for "All Markets" - render as top-level item
    if (market.type === 'all') {
      return (
        <div key={market.id}>
          <button
            onClick={() => setCurrentMarket(market)}
            className={`
              w-full flex items-center justify-between px-4 py-2 text-sm
              hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
              ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
            `}
          >
            <span className="truncate pr-2">All leads</span>
            <span className={`text-xs flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {market.leadCount}
            </span>
          </button>
          
          {/* Separator */}
          <div className="my-1 mx-3 border-t border-gray-200 dark:border-gray-700" />
          
          {/* Render states */}
          {children.map(child => renderMarketItem(child, 0))}
        </div>
      );
    }
    
    return (
      <div key={market.id} className={level > 0 ? 'ml-2' : ''}>
        <div className="flex items-center group">
          {/* Expand/Collapse for states */}
          {isStateLevel && hasChildren && (
            <button
              onClick={() => toggleExpanded(market.id)}
              className="p-0.5 ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500" />
              )}
            </button>
          )}
          
          {/* Main button */}
          <button
            onClick={() => setCurrentMarket(market)}
            className={`
              flex-1 flex items-center justify-between px-4 py-1.5 text-sm
              hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
              ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
              ${!isStateLevel && level > 0 ? 'ml-5' : ''}
            `}
          >
            <span className="truncate pr-2">
              {market.type === 'state' ? market.name.split(' (')[0] : market.name}
            </span>
            <span className={`text-xs flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {market.leadCount}
            </span>
          </button>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {children.map(child => renderMarketItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  

  
  // Calculate truly unassigned leads - those that can't be placed in any market
  const unassignedCount = leads.filter(lead => {
    // Check if we can detect state or city from any method
    let detectedState = normalizeState(lead.state);
    let detectedCity = lead.city || '';
    
    
    // Extract city from company name if not already set
    if (!detectedCity && lead.company_name) {
      // Common patterns: "Company - City" or "Company in City"
      const dashMatch = lead.company_name.match(/\s*-\s*([A-Za-z\s]+?)$/);
      const inMatch = lead.company_name.match(/\sin\s+([A-Za-z\s]+?)$/i);
      const potentialCity = dashMatch?.[1] || inMatch?.[1];
      
      if (potentialCity) {
        const trimmedCity = potentialCity.trim();
        // Check if this is a known city
        const detectedMetro = detectMetroArea(trimmedCity, '');
        if (detectedMetro) {
          detectedCity = trimmedCity;
          if (!detectedState) {
            detectedState = detectedMetro.state;
          }
        }
      }
    }
    
    if (!detectedState && detectedCity) {
      const detectedMetro = detectMetroArea(detectedCity, '');
      if (detectedMetro) detectedState = detectedMetro.state;
    }
    
    if (lead.phone) {
      if (!detectedState) {
        detectedState = getStateFromPhone(lead.phone) || '';
      }
      if (!detectedCity) {
        detectedCity = getCityFromPhone(lead.phone) || '';
      }
    }
    
    // Only count as unassigned if we can't detect any location by any method
    return !detectedCity && !detectedState;
  }).length;
  
  return (
    <>
      {/* Sliding Panel - Fixed position next to main sidebar */}
      <div 
        className={`fixed top-0 h-screen bg-white dark:bg-gray-900 flex flex-col border-r border-gray-200 dark:border-gray-700 z-30 ${
          isOpen ? 'w-80 shadow-xl' : 'w-0'
        } overflow-hidden`}
        style={{
          left: `${isSidebarCollapsed ? 64 : 224}px`
        }}
      >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Views</h3>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex relative">
          <button
            onClick={() => setActiveTab('markets')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'markets'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <MapPinIcon className="h-3.5 w-3.5" />
            <span className={isOpen ? 'opacity-100' : 'opacity-0'}>Markets</span>
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'queries'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            <span className={isOpen ? 'opacity-100' : 'opacity-0'}>Searches</span>
          </button>
          {/* Active tab indicator */}
          <div 
            className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            style={{
              width: '50%',
              left: activeTab === 'markets' ? '0' : '50%'
            }}
          />
        </div>
      </div>
      
      {/* Views list */}
      <div className={`flex-1 overflow-y-auto py-1 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
        {activeTab === 'markets' ? (
          <>
            {marketHierarchy.length > 0 ? (
              marketHierarchy.map(node => renderMarketItem(node))
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No markets detected
              </div>
            )}
            
            {/* Unassigned leads */}
            {unassignedCount > 0 && (
              <>
                <div className="my-1 mx-3 border-t border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    setCurrentMarket({
                      id: 'unassigned',
                      name: 'Unassigned',
                      type: 'city',
                      cities: [],
                      leadCount: unassignedCount
                    });
                    // Also show modal when clicking unassigned
                    setShowUnassignedModal(true);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2 text-sm
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group
                    ${currentMarket?.id === 'unassigned' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                  `}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 text-yellow-500" />
                    Unassigned
                  </span>
                  <span className={`text-xs ${currentMarket?.id === 'unassigned' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {unassignedCount}
                  </span>
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {/* Search queries grouped by market */}
            {searchQueriesByMarket.length > 0 ? (
              <>
                <div className="px-4 py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {searchQueries.length} unique search queries across {searchQueriesByMarket.length} markets
                  </div>
                </div>
                {searchQueriesByMarket.map(({ market, queries, totalCount }) => (
                  <div key={market} className="mb-3">
                    <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {market}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {totalCount} leads
                        </span>
                      </div>
                    </div>
                    {queries.map(({ query, count }) => (
                      <button
                        key={`${market}-${query}`}
                        onClick={() => setCurrentMarket({
                          id: `query-${query}`,
                          name: query,
                          type: 'query' as any,
                          cities: [],
                          leadCount: count
                        })}
                        className={`
                          w-full flex items-center justify-between px-4 py-2 text-sm
                          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${currentMarket?.id === `query-${query}` ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        <span className="truncate pr-2 text-left pl-4">{query}</span>
                        <span className={`text-xs flex-shrink-0 ${currentMarket?.id === `query-${query}` ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No search queries recorded
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Unassigned Leads Modal */}
      <UnassignedLeadsModal 
        open={showUnassignedModal} 
        onClose={() => setShowUnassignedModal(false)} 
      />
      </div>
    </>
  );
}