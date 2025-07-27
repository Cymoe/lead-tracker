'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MarketMetrics, MarketFilter } from '@/types/market-data';
import { getTopMarkets, getMarketDataByCity } from '@/utils/market-data';
import { OpportunityScorer } from '@/utils/opportunity-scorer';
import MarketDetailPopup from './map/MarketDetailPopup';
import UnifiedMetroSidebar from './map/UnifiedMetroSidebar';
import DataSourceBadge from './map/DataSourceBadge';

// Fix for Leaflet icon issue in Next.js - using data URLs
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  selectedIndustry?: string;
  onCitySelect?: (city: string, state: string) => void;
}



export default function AcquisitionOpportunityMap({ selectedIndustry, onCitySelect }: Props) {
  const [markets, setMarkets] = useState<MarketMetrics[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketMetrics | null>(null);
  const [filter, setFilter] = useState<MarketFilter>({});
  const [hoveredMarket, setHoveredMarket] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Trigger map resize when sidebar state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const mapElement = document.querySelector('.leaflet-container') as any;
      if (mapElement?._leaflet_map) {
        mapElement._leaflet_map.invalidateSize();
      }
    }, 350); // Wait for transition to complete
    
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);
  
  // Load market data
  const loadMarkets = useCallback(async () => {
    setIsLoading(true);
    try {
      const topMarkets = await getTopMarkets(20, filter);
      setMarkets(topMarkets);
      
      // Update data source info if available
      if (topMarkets.length > 0 && topMarkets[0].dataSource) {
        setDataSource(topMarkets[0].dataSource);
      }
    } catch (error) {
      console.error('Error loading markets:', error);
      // Will use fallback sample data
    } finally {
      setIsLoading(false);
    }
  }, [filter]);
  
  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);
  
  // Update filter when industry changes
  useEffect(() => {
    if (selectedIndustry) {
      setFilter(prev => ({ ...prev, businessTypes: [selectedIndustry] }));
    }
  }, [selectedIndustry]);
  
  const getMarkerColor = (score: number): string => {
    if (score >= 85) return '#DC2626'; // red-600
    if (score >= 75) return '#F59E0B'; // amber-500
    if (score >= 65) return '#3B82F6'; // blue-500
    return '#6B7280'; // gray-500
  };
  
  const getMarkerSize = (score: number): number => {
    return 10 + (score / 100) * 20; // 10-30px based on score
  };
  
  const handleMarkerClick = (market: MarketMetrics) => {
    setSelectedMarket(market);
    if (onCitySelect) {
      onCitySelect(market.city, market.state);
    }
  };
  
  const center: LatLngExpression = [39.8283, -98.5795]; // Center of USA
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Unified Sidebar - Fixed position */}
      <UnifiedMetroSidebar
        filter={filter}
        onFilterChange={setFilter}
        markets={markets}
        selectedMarket={selectedMarket}
        onMarketSelect={handleMarkerClick}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Map Container - Always full screen */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={center}
          zoom={4}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Market Markers */}
          {markets.map((market) => (
            <CircleMarker
              key={`${market.city}-${market.stateCode}`}
              center={[market.coordinates.lat, market.coordinates.lng]}
              radius={getMarkerSize(market.opportunityScore)}
              fillColor={getMarkerColor(market.opportunityScore)}
              color="#fff"
              weight={2}
              opacity={hoveredMarket === market.city ? 1 : 0.8}
              fillOpacity={hoveredMarket === market.city ? 0.9 : 0.6}
              eventHandlers={{
                click: () => handleMarkerClick(market),
                mouseover: () => setHoveredMarket(market.city),
                mouseout: () => setHoveredMarket(null),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{market.city}, {market.stateCode}</h3>
                  <p className="text-sm text-gray-600">Score: {market.opportunityScore}/100</p>
                  <p className="text-xs text-gray-500">Click for details</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
            <p className="mt-2 text-white">Loading market data...</p>
          </div>
        </div>
      )}
      
      {/* Data source attribution - position based on sidebar state */}
      {dataSource && (
        <div className={`absolute bottom-14 z-[999] transition-all duration-300 ${
          isSidebarCollapsed ? 'left-4' : 'left-[25rem]'
        }`}>
          <DataSourceBadge sources={dataSource} />
        </div>
      )}
      
      {/* Top Action Bar */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-3">
          <button
            onClick={loadMarkets}
            className="p-2 bg-[#1F2937] text-white rounded-lg shadow-lg hover:bg-[#374151] transition-colors border border-[#374151]"
            title="Refresh data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              // Reset view to center of US
              const mapElement = document.querySelector('.leaflet-container') as any;
              if (mapElement?._leaflet_map) {
                mapElement._leaflet_map.setView([39.8283, -98.5795], 4);
              }
            }}
            className="p-2 bg-[#1F2937] text-white rounded-lg shadow-lg hover:bg-[#374151] transition-colors border border-[#374151]"
            title="Reset map view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
      </div>
      
      {/* Legend - Bottom Right */}
      <div className="absolute bottom-14 right-4 z-[1000] bg-[#1F2937] p-3 rounded-lg shadow-lg border border-[#374151]">
        <h4 className="text-sm font-semibold mb-2 text-white">Opportunity Score</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-xs font-medium text-gray-300">Hot Market (85+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-xs font-medium text-gray-300">Warm Market (75-84)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs font-medium text-gray-300">Cool Market (65-74)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-xs font-medium text-gray-300">Emerging (50-64)</span>
          </div>
        </div>
      </div>
      
      {/* Market Detail Modal */}
      {selectedMarket && (
        <MarketDetailPopup
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}
      
      {/* Bottom Status Bar - position based on sidebar state */}
      <div className={`absolute bottom-0 right-0 bg-[#1F2937] border-t border-[#374151] z-[900] transition-all duration-300 ${
        isSidebarCollapsed ? 'left-0' : 'left-96'
      }`}>
        <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              Markets Loaded: <strong className="text-white">{markets.length}</strong>
            </span>
            <span className="border-l border-[#374151] pl-4">
              Filters Active: <strong className="text-white">
                {Object.keys(filter).filter(k => {
                  const value = filter[k as keyof typeof filter];
                  return value !== undefined && value !== null && 
                    (Array.isArray(value) ? value.length > 0 : value !== 0);
                }).length}
              </strong>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>
              Total Opportunities: <strong className="text-white">
                {markets.reduce((sum, m) => sum + m.businessCount, 0).toLocaleString()}
              </strong>
            </span>
            <span className="border-l pl-4 text-gray-500">
              Last Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}