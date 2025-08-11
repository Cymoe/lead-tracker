'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLayout } from '@/contexts/LayoutContext';
import Sidebar from '@/components/Sidebar';
import MarketCoverageTracker from '@/components/MarketCoverageTracker';
import ServiceTypePrioritizer from '@/components/ServiceTypePrioritizer';
import MarketInsightsPanel from '@/components/MarketInsightsPanel';
import AddLeadModal from '@/components/modals/AddLeadModal';
import BulkImportModal from '@/components/modals/BulkImportModal';
import SettingsModal from '@/components/modals/SettingsModal';
import GoogleSheetsSyncModal from '@/components/modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from '@/components/modals/DuplicateDetectionModal';
import AnalyticsDashboardModal from '@/components/modals/AnalyticsDashboardModal';
import BulkEditModal from '@/components/modals/BulkEditModal';
import { DynamicMarket, MarketCoverage } from '@/types';
import { getAllMarketCoverage } from '@/lib/market-coverage-api';
import { fetchLeads } from '@/lib/api';
import { getFlatMarketList } from '@/utils/market-detection';
import { useLeadStore } from '@/lib/store';
import { useLeadsQuery } from '@/hooks/useLeadsQuery';
import { 
  MapPinIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function MarketWorkflowPage() {
  const router = useRouter();
  const { selectedLeads, leads } = useLeadStore();
  const [selectedMarket, setSelectedMarket] = useState<DynamicMarket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  
  // Get sidebar state from context
  const { isSidebarCollapsed, setIsSidebarCollapsed, isViewsPanelOpen } = useLayout();

  // Use React Query for efficient data loading with caching
  const { data: leadsData, isLoading: isLoadingLeads } = useLeadsQuery();
  
  // Query for market coverage data
  const { data: coverageData = [], isLoading: isLoadingCoverage, refetch: refetchCoverage } = useQuery({
    queryKey: ['marketCoverage'],
    queryFn: () => getAllMarketCoverage(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  // Derive markets from leads data
  const markets = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const allMarkets = getFlatMarketList(leads);
    // Show only city-level markets since that's what we actually search
    return allMarkets.filter(m => m.type === 'city');
  }, [leads]);
  
  // Background coverage update - non-blocking
  useEffect(() => {
    if (leads.length > 0) {
      // Update coverage in background without blocking UI
      fetch('/api/fix-market-coverage', { method: 'POST' })
        .then(response => {
          if (response.ok) {
            console.log('Coverage update triggered in background');
          }
        })
        .catch(error => {
          console.error('Background coverage update failed:', error);
        });
    }
  }, [leads.length]);
  
  const loading = isLoadingLeads || isLoadingCoverage;

  // Filter markets based on search
  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return markets;
    
    const query = searchQuery.toLowerCase();
    return markets.filter(market => 
      market.name.toLowerCase().includes(query)
    );
  }, [markets, searchQuery]);

  // Get coverage for a market
  const getMarketCoverage = (marketId: string) => {
    return coverageData.find(c => c.market_id === marketId) || null;
  };

  // Calculate coverage percentage for display
  const getCoveragePercentage = (marketId: string) => {
    const coverage = getMarketCoverage(marketId);
    if (!coverage) return 0;
    
    // Simple calculation based on phases
    let percentage = 0;
    if (coverage.phase_1_lead_count > 0) percentage += 40;
    if (coverage.phase_2_lead_count > 0) percentage += 30;
    if (coverage.phase_3_lead_count > 0) percentage += 30;
    
    return percentage;
  };

  const handlePhaseClick = (market: DynamicMarket, phase: 1 | 2 | 3) => {
    // Navigate to appropriate import modal based on phase
    const params = new URLSearchParams({
      market_id: market.id,
      market_name: market.name,
      phase: phase.toString()
    });

    if (phase === 1) {
      // Go to leads page with Google Maps import modal open
      router.push(`/leads?openGoogleMaps=true&${params}`);
    } else if (phase === 2) {
      // Go to leads page with Bulk Import modal open
      router.push(`/leads?openBulkImport=true&${params}`);
    } else if (phase === 3) {
      // Go to leads page with Instagram helper
      router.push(`/leads?openInstagramHelper=true&${params}`);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          onAddLead={() => {}}
          onGoogleSheetsSync={() => {}}
          onDuplicateDetection={() => {}}
          onAnalytics={() => {}}
          onSettings={() => {}}
          onBulkEdit={() => {}}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        <div className={`flex flex-col flex-1 overflow-hidden ${
          isSidebarCollapsed 
            ? isViewsPanelOpen ? 'lg:ml-[384px]' : 'lg:ml-16'
            : isViewsPanelOpen ? 'lg:ml-[544px]' : 'lg:ml-64'
        }`}>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        onAddLead={() => setShowAddLead(true)}
        onGoogleSheetsSync={() => setShowGoogleSheetsSync(true)}
        onDuplicateDetection={() => setShowDuplicateDetection(true)}
        onAnalytics={() => setShowAnalytics(true)}
        onSettings={() => setShowSettings(true)}
        onBulkEdit={() => setShowBulkEdit(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      {/* Main content */}
      <div className={`flex flex-col flex-1 overflow-hidden ${
        isSidebarCollapsed 
          ? isViewsPanelOpen ? 'lg:ml-[384px]' : 'lg:ml-16'
          : isViewsPanelOpen ? 'lg:ml-[544px]' : 'lg:ml-64'
      }`}>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Market Coverage Workflow
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Systematically collect leads across all markets with our 3-phase approach
              </p>
            </div>
            {markets.length > 0 && coverageData.length === 0 && (
              <button
                onClick={async () => {
                  const response = await fetch('/api/fix-market-coverage', { method: 'POST' });
                  if (response.ok) {
                    refetchCoverage(); // Reload the data
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fix Coverage Data
              </button>
            )}
          </div>
        </div>

        {/* Phase Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phase 1: Google Maps
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Foundation coverage from Google Maps. Gets 70% of available businesses in the market.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phase 2: Facebook Ads
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Find active advertisers using Facebook Ad Library. Adds 20% more high-intent leads.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">IG</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phase 3: Instagram
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manual Instagram targeting for algorithm benefits. Final 10% of premium leads.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Markets
                </h2>
                
                {/* Search */}
                <div className="mt-3 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {filteredMarkets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No markets found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMarkets.map(market => {
                      const coveragePercent = getCoveragePercentage(market.id);
                      const isSelected = selectedMarket?.id === market.id;
                      
                      return (
                        <button
                          key={market.id}
                          onClick={() => setSelectedMarket(market)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {market.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {market.leadCount} leads • {market.type}
                              </div>
                              {(() => {
                                const coverage = getMarketCoverage(market.id);
                                if (coverage && coverage.phase_1_service_types.length > 0) {
                                  return (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {coverage.phase_1_service_types.slice(0, 3).join(', ')}
                                      {coverage.phase_1_service_types.length > 3 && ` +${coverage.phase_1_service_types.length - 3} more`}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {coveragePercent}%
                                </div>
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${coveragePercent}%` }}
                                  />
                                </div>
                              </div>
                              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Details */}
          <div className="lg:col-span-2">
            {selectedMarket ? (
              <div className="space-y-6">
                <MarketCoverageTracker 
                  market={selectedMarket}
                  onPhaseClick={(phase) => handlePhaseClick(selectedMarket, phase)}
                />
                <ServiceTypePrioritizer
                  market={selectedMarket}
                  coverage={getMarketCoverage(selectedMarket.id)}
                  onServiceTypeSelect={(serviceType) => {
                    // Navigate to Google Maps import with pre-filled service type
                    const params = new URLSearchParams({
                      market_id: selectedMarket.id,
                      market_name: selectedMarket.name,
                      phase: '1',
                      service_type: serviceType
                    });
                    router.push(`/leads?openGoogleMaps=true&${params}`);
                  }}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Market
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a market from the list to view coverage details and start collecting leads
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Insights Panel */}
        <div className="mt-8">
          <MarketInsightsPanel markets={markets} />
        </div>
          </div>
        </div>
      </div>
    
    {/* Modals */}
    <AddLeadModal 
      open={showAddLead} 
      onClose={() => setShowAddLead(false)} 
    />
    <BulkImportModal 
      open={showBulkImport} 
      onClose={() => setShowBulkImport(false)} 
    />
    <SettingsModal 
      open={showSettings} 
      onClose={() => setShowSettings(false)} 
    />
    <GoogleSheetsSyncModal 
      open={showGoogleSheetsSync} 
      onClose={() => setShowGoogleSheetsSync(false)} 
    />
    <DuplicateDetectionModal 
      open={showDuplicateDetection} 
      onClose={() => setShowDuplicateDetection(false)} 
    />
    <AnalyticsDashboardModal 
      open={showAnalytics} 
      onClose={() => setShowAnalytics(false)} 
    />
    <BulkEditModal 
      open={showBulkEdit} 
      onClose={() => setShowBulkEdit(false)}
      selectedLeadIds={selectedLeads}
    />
  </div>
  );
}