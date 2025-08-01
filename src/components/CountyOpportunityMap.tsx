'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { countyDataAggregator, CountyMarketMetrics, CountyFilter } from '@/services/county-data-aggregator';
import { GREY_TSUNAMI_CATEGORIES } from '@/utils/grey-tsunami-business-types';
import CountyPopup from './map/CountyPopup';
import UnifiedMapSidebar from './map/UnifiedMapSidebar';
import CountyLegend from './map/CountyLegend';
import DataSourceBadge from './map/DataSourceBadge';
import MarketComparisonTool from './map/MarketComparisonTool';
import L from 'leaflet';

// Fix for Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  selectedIndustry?: string;
  onCountySelect?: (fipsCode: string, countyName: string, state: string) => void;
}

export default function CountyOpportunityMap({ selectedIndustry, onCountySelect }: Props) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [countyMetrics, setCountyMetrics] = useState<Map<string, CountyMarketMetrics>>(new Map());
  const [allCountyData, setAllCountyData] = useState<CountyMarketMetrics[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState<CountyMarketMetrics | null>(null);
  const [filter, setFilter] = useState<CountyFilter>({
    marketClassification: ['main', 'secondary', 'tertiary'], // Show all markets by default
    minOpportunityScore: 0
  });
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode] = useState<'metro' | 'county'>('county');
  const [compareMode, setCompareMode] = useState(false);
  const [compareCounties, setCompareCounties] = useState<CountyMarketMetrics[]>([]);
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
  
  // Load GeoJSON data
  useEffect(() => {
    fetch('/data/geo/us-counties.json')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error('Error loading GeoJSON:', err));
  }, []);

  // Apply filters to existing data (instant, no loading)
  const applyFilters = useCallback((data: CountyMarketMetrics[], currentFilter: CountyFilter) => {
    console.log('Applying filters to', data.length, 'counties');
    
    let filtered = data;
    
    // Market classification filter
    if (currentFilter.marketClassification && currentFilter.marketClassification.length > 0) {
      filtered = filtered.filter(c => currentFilter.marketClassification!.includes(c.marketClassification));
    }
    
    // Minimum opportunity score filter
    if (currentFilter.minOpportunityScore && currentFilter.minOpportunityScore > 0) {
      const minScore = currentFilter.minOpportunityScore;
      filtered = filtered.filter(c => c.opportunityScore >= minScore);
    }
    
    // Grey Tsunami tiers filter (for scoring influence)
    if (currentFilter.greyTsunamiTiers && currentFilter.greyTsunamiTiers.length > 0) {
      console.log('Applying Grey Tsunami filter with tiers:', currentFilter.greyTsunamiTiers);
      
      // Check how many counties have matching industries
      const beforeCount = filtered.length;
      const matchingCounties = filtered.filter(county => {
        const hasMatch = county.industryFocus.topGreyTsunamiIndustries.some(ind => 
          currentFilter.greyTsunamiTiers?.some(tier => 
            GREY_TSUNAMI_CATEGORIES.find(cat => cat.tier === tier)?.businesses.includes(ind)
          )
        );
        return hasMatch;
      });
      
      console.log(`Grey Tsunami filter: ${matchingCounties.length} of ${beforeCount} counties have matching industries`);
      
      // If we have matches, show only those. Otherwise show all but sorted.
      if (matchingCounties.length > 0) {
        filtered = matchingCounties;
      } else {
        console.warn('No counties match the selected tiers, showing all counties');
      }
    }
    
    // Take top 200 for performance
    filtered = filtered.slice(0, 200);
    
    const metricsMap = new Map<string, CountyMarketMetrics>();
    filtered.forEach(county => {
      metricsMap.set(county.fipsCode, county);
    });
    
    setCountyMetrics(metricsMap);
    console.log('Filtered to', filtered.length, 'counties');
  }, []);

  // Load all county data (only on initial load or when states change)
  const loadAllCountyData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading all county data...');
      
      // Only fetch for selected states to avoid overwhelming the API
      const stateFilter = filter.states && filter.states.length > 0 
        ? { states: filter.states }
        : { states: ['Florida', 'Texas', 'California', 'Arizona', 'North Carolina', 'Georgia'] }; // Default states
      
      // Pass the full filter to get industry data if Grey Tsunami tiers are selected
      const fullFilter = {
        ...stateFilter,
        greyTsunamiTiers: filter.greyTsunamiTiers
      };
      
      const allCounties = await countyDataAggregator.getTopOpportunityCounties(
        1000, 
        fullFilter,
        // Don't fetch industry data during initial load - too slow
        false
      );
      
      console.log(`Loaded ${allCounties.length} counties total`);
      setAllCountyData(allCounties);
      setIsInitialLoad(false);
      
      // Apply filters to the loaded data
      applyFilters(allCounties, filter);
    } catch (error) {
      console.error('Error loading county data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter.states, filter.greyTsunamiTiers, filter, applyFilters]); // Reload when states or tiers change

  // Initial load
  useEffect(() => {
    if (isInitialLoad) {
      loadAllCountyData();
    }
  }, [loadAllCountyData, isInitialLoad]);

  // Apply filters when they change (instant)
  useEffect(() => {
    if (!isInitialLoad && allCountyData.length > 0) {
      applyFilters(allCountyData, filter);
    }
  }, [filter, allCountyData, applyFilters, isInitialLoad]);

  // Reload data when states or tiers change
  useEffect(() => {
    if (!isInitialLoad && (filter.states || filter.greyTsunamiTiers)) {
      loadAllCountyData();
    }
  }, [filter.states, filter.greyTsunamiTiers, loadAllCountyData, isInitialLoad]);

  // Get color based on opportunity score
  const getColor = (score: number): string => {
    if (score >= 80) return '#DC2626'; // red-600 - Hot
    if (score >= 70) return '#F59E0B'; // amber-500 - Warm
    if (score >= 60) return '#3B82F6'; // blue-500 - Good
    if (score >= 50) return '#10B981'; // emerald-500 - Moderate
    if (score >= 40) return '#6B7280'; // gray-500 - Cool
    return '#E5E7EB'; // gray-200 - No data/Low
  };

  // Style function for GeoJSON
  const style = useCallback((feature: any) => {
    const fipsCode = feature.id || feature.properties.GEOID;
    const metrics = countyMetrics.get(fipsCode);
    
    // Show all county borders, but only fill counties with data
    if (!metrics) {
      return {
        fillColor: 'transparent',
        weight: 1,
        opacity: 1,
        color: '#4B5563',
        dashArray: '',
        fillOpacity: 0
      };
    }
    
    return {
      fillColor: getColor(metrics.opportunityScore),
      weight: hoveredCounty === fipsCode ? 4 : 2,
      opacity: 1,
      color: hoveredCounty === fipsCode ? '#FFFFFF' : '#E5E7EB',
      dashArray: '',
      fillOpacity: hoveredCounty === fipsCode ? 0.9 : 0.7
    };
  }, [countyMetrics, hoveredCounty]);

  // Handle feature interactions
  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    const fipsCode = feature.id || feature.properties.GEOID;
    const metrics = countyMetrics.get(fipsCode);
    
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        setHoveredCounty(fipsCode);
        
        if (metrics) {
          const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`
              <div class="p-2">
                <h3 class="font-bold">${metrics.countyName}, ${metrics.stateAbbr}</h3>
                <p class="text-sm">Score: ${metrics.opportunityScore}/100</p>
                <p class="text-xs text-gray-600">Click for details</p>
              </div>
            `)
            .openOn((layer as any)._map);
        }
      },
      mouseout: () => {
        setHoveredCounty(null);
        (layer as any)._map.closePopup();
      },
      click: (e: L.LeafletMouseEvent) => {
        if (metrics) {
          if (compareMode && (e.originalEvent.ctrlKey || e.originalEvent.metaKey)) {
            // Add to comparison
            if (!compareCounties.find(c => c.fipsCode === metrics.fipsCode)) {
              setCompareCounties([...compareCounties, metrics]);
            }
          } else {
            setSelectedCounty(metrics);
            if (onCountySelect) {
              onCountySelect(metrics.fipsCode, metrics.countyName, metrics.state);
            }
          }
        }
      }
    });
  }, [countyMetrics, onCountySelect, compareMode, compareCounties]);

  const center: LatLngExpression = [39.8283, -98.5795]; // Center of USA
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Unified Sidebar - Fixed position */}
      <UnifiedMapSidebar
        filter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        countyMetrics={countyMetrics}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLocationClick={(fipsCode) => {
          // Find county bounds and fly to it
          const county = countyMetrics.get(fipsCode);
          if (county && geoJsonData) {
            const feature = geoJsonData.features.find((f: any) => 
              (f.id || f.properties.GEOID) === fipsCode
            );
            if (feature) {
              // Simple center calculation (you could use turf.js for better accuracy)
              const bounds = feature.geometry.coordinates[0];
              let sumLat = 0, sumLng = 0, count = 0;
              
              const processCoords = (coords: any) => {
                if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
                  // We have coordinates
                  coords.forEach((coord: number[]) => {
                    sumLng += coord[0];
                    sumLat += coord[1];
                    count++;
                  });
                } else {
                  // Nested array, recurse
                  coords.forEach((c: any) => processCoords(c));
                }
              };
              
              processCoords(feature.geometry.coordinates);
              
              if (count > 0) {
                const center = [sumLat / count, sumLng / count];
                // Access map instance and fly to location
                const mapElement = document.querySelector('.leaflet-container') as any;
                if (mapElement?._leaflet_map) {
                  mapElement._leaflet_map.flyTo(center, 10, { duration: 1.5 });
                }
              }
            }
          }
        }}
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
          
          {/* County boundaries with data */}
          {geoJsonData && (
            <GeoJSON
              key={`${viewMode}-${countyMetrics.size}`} // Force re-render on data change
              data={geoJsonData}
              style={style}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
            <p className="mt-2 text-white">Loading county data...</p>
          </div>
        </div>
      )}
      
      
      {/* Data source attribution - position based on sidebar state */}
      <div className={`absolute bottom-14 z-[999] transition-all duration-300 ${
        isSidebarCollapsed ? 'left-4' : 'left-[25rem]'
      }`}>
        <DataSourceBadge sources={{
          census: 'County Business Patterns',
          economic: 'ACS 5-Year',
          business: 'Census Bureau',
          lastUpdated: new Date().toISOString()
        }} />
      </div>
      
      {/* Floating Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-[1100] flex items-center gap-2">
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`px-3 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 ${
            compareMode 
              ? 'bg-[#3B82F6] text-white' 
              : 'bg-[#1F2937] text-white hover:bg-[#374151] border border-[#374151]'
          }`}
          title={compareMode ? 'Exit comparison mode' : 'Compare counties (Ctrl+Click to select)'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm">
            Compare {compareCounties.length > 0 && `(${compareCounties.length})`}
          </span>
        </button>
        
        <button
          onClick={loadAllCountyData}
          className="p-2 bg-[#1F2937] text-white rounded-lg shadow-lg hover:bg-[#374151] transition-colors border border-[#374151]"
          title="Refresh data"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            const mapElement = document.querySelector('.leaflet-container') as any;
            if (mapElement?._leaflet_map) {
              mapElement._leaflet_map.setView([39.8283, -98.5795], 4);
            }
          }}
          className="p-2 bg-[#1F2937] text-white rounded-lg shadow-lg hover:bg-[#374151] transition-colors border border-[#374151]"
          title="Reset view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
      
      {/* County Detail Modal */}
      {selectedCounty && (
        <CountyPopup
          county={selectedCounty}
          onClose={() => setSelectedCounty(null)}
        />
      )}
      
      {/* Market Comparison Tool */}
      {compareMode && compareCounties.length > 0 && (
        <MarketComparisonTool
          viewMode="county"
          selectedItems={compareCounties}
          onRemoveItem={(item) => {
            setCompareCounties(compareCounties.filter(c => c.fipsCode !== (item as CountyMarketMetrics).fipsCode));
          }}
          onClose={() => {
            setCompareMode(false);
            setCompareCounties([]);
          }}
        />
      )}
      
      {/* Legend - Bottom Right */}
      <CountyLegend />
      
      {/* Bottom Status Bar - position based on sidebar state */}
      <div className={`absolute bottom-0 right-0 bg-[#1F2937] border-t border-[#374151] z-[900] transition-all duration-300 ${
        isSidebarCollapsed ? 'left-0' : 'left-96'
      }`}>
        <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              Counties Loaded: <strong className="text-white">{countyMetrics.size}</strong>
            </span>
            <span className="border-l border-[#374151] pl-4">
              Filters Active: <strong className="text-white">
                {Object.keys(filter).filter(k => {
                  const value = filter[k as keyof CountyFilter];
                  return value !== undefined && value !== null && 
                    (Array.isArray(value) ? value.length > 0 : value !== 0);
                }).length}
              </strong>
            </span>
            {compareMode && (
              <span className="border-l pl-4">
                Comparing: <strong className="text-blue-600">{compareCounties.length} counties</strong>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span>
              Total Businesses: <strong className="text-white">
                {Array.from(countyMetrics.values())
                  .reduce((sum, c) => sum + c.businessMetrics.boomerOwnedEstimate, 0)
                  .toLocaleString()}
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