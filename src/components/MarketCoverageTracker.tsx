import { useState, useEffect } from 'react';
import { MarketCoverage, DynamicMarket } from '@/types';
import { getMarketCoverage, calculateCoveragePercentage, getRecommendedActions } from '@/lib/market-coverage-api';
import { CheckCircleIcon, ClockIcon, MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { getMarketSizeConfig } from '@/utils/market-size';
import { calculateSaturation, getServiceTypeSaturation } from '@/utils/saturation-detection';

interface MarketCoverageTrackerProps {
  market: DynamicMarket | null;
  onPhaseClick?: (phase: 1 | 2 | 3) => void;
  compact?: boolean;
}

export default function MarketCoverageTracker({ 
  market, 
  onPhaseClick,
  compact = false 
}: MarketCoverageTrackerProps) {
  const [coverage, setCoverage] = useState<MarketCoverage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (market) {
      loadCoverage();
    }
  }, [market?.id]);

  const loadCoverage = async () => {
    if (!market) return;
    
    setLoading(true);
    try {
      const data = await getMarketCoverage(market.id);
      setCoverage(data);
    } catch (error) {
      console.error('Error loading coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!market) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500">
        Select a market to view coverage
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="animate-pulse">Loading coverage data...</div>
      </div>
    );
  }

  const coveragePercentage = coverage ? calculateCoveragePercentage(coverage) : 0;
  const recommendations = coverage ? getRecommendedActions(coverage) : [];

  const phases = [
    {
      number: 1,
      name: 'Google Maps',
      icon: MapPinIcon,
      color: 'blue',
      count: coverage?.phase_1_lead_count || 0,
      searches: coverage?.phase_1_searches.length || 0,
      serviceTypes: coverage?.phase_1_service_types.length || 0,
      completed: coverage?.phase_1_completed_at,
      description: 'Foundation coverage from Google Maps'
    },
    {
      number: 2,
      name: 'Facebook Ads',
      icon: FaFacebook,
      color: 'indigo',
      count: coverage?.phase_2_lead_count || 0,
      searches: coverage?.phase_2_searches.length || 0,
      completed: coverage?.phase_2_completed_at,
      description: 'Active advertisers from FB Ad Library'
    },
    {
      number: 3,
      name: 'Instagram',
      icon: FaInstagram,
      color: 'purple',
      count: coverage?.phase_3_lead_count || 0,
      handles: coverage?.phase_3_handles.length || 0,
      completed: coverage?.phase_3_completed_at,
      description: 'Manual Instagram targeting'
    }
  ];

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {market.name} Coverage
          </h4>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {coveragePercentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${coveragePercentage}%` }}
          />
        </div>
        
        <div className="flex gap-2 mt-2">
          {phases.map((phase) => (
            <button
              key={phase.number}
              onClick={() => onPhaseClick?.(phase.number as 1 | 2 | 3)}
              className={`flex-1 text-center py-1 px-2 rounded text-xs font-medium transition-colors ${
                phase.count > 0 
                  ? `bg-${phase.color}-100 text-${phase.color}-700 hover:bg-${phase.color}-200` 
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <phase.icon className="h-3 w-3" />
                <span>{phase.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {market.name} Market Coverage
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Systematic coverage tracking across all phases
              </p>
              {market.type === 'city' && (() => {
                const cityName = market.name.includes(',') 
                  ? market.name.split(',')[0].trim()
                  : market.name;
                const marketConfig = getMarketSizeConfig(cityName);
                const tierColors = {
                  small: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                  large: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                  mega: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                };
                return (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[marketConfig.tier]}`}>
                    {marketConfig.tier.toUpperCase()} MARKET
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {coveragePercentage}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {coverage?.total_lead_count || 0} total leads
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${coveragePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {phases.map((phase) => {
          const isActive = phase.count > 0;
          const isCompleted = phase.completed !== null;
          
          return (
            <div
              key={phase.number}
              className={`px-6 py-4 ${
                onPhaseClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
              }`}
              onClick={() => onPhaseClick?.(phase.number as 1 | 2 | 3)}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${isActive 
                    ? `bg-${phase.color}-100 text-${phase.color}-600` 
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  <phase.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Phase {phase.number}: {phase.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {phase.description}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {phase.count} leads
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {phase.number === 1 && (() => {
                          if (market.type === 'city' && coverage) {
                            const cityName = market.name.includes(',') 
                              ? market.name.split(',')[0].trim()
                              : market.name;
                            const config = getMarketSizeConfig(cityName);
                            return `${phase.serviceTypes}/${config.targetServiceTypes} types, ${phase.searches} searches`;
                          }
                          return `${phase.serviceTypes} types, ${phase.searches} searches`;
                        })()}
                        {phase.number === 2 && `${phase.searches} searches`}
                        {phase.number === 3 && `${phase.handles} handles`}
                      </div>
                      
                      {/* Show actual searches for Phase 1 */}
                      {phase.number === 1 && coverage?.phase_1_searches && coverage.phase_1_searches.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {coverage.phase_1_searches.map((search, idx) => (
                            <p key={idx} className="text-xs text-gray-400 dark:text-gray-500 italic">
                              "{search}"
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {/* Saturation indicator */}
                      {(() => {
                        const phaseMetrics = phase.number === 1 ? coverage?.phase_1_import_metrics :
                                           phase.number === 2 ? coverage?.phase_2_import_metrics :
                                           coverage?.phase_3_import_metrics;
                        
                        if (!phaseMetrics || phaseMetrics.length === 0) return null;
                        
                        const saturation = calculateSaturation(phaseMetrics.map(m => ({
                          totalFound: m.total_found,
                          duplicates: m.duplicates,
                          imported: m.imported,
                          timestamp: new Date(m.timestamp),
                          serviceType: m.service_type,
                          searchQuery: m.search_query
                        })));
                        
                        if (saturation.saturationLevel === 'low') return null;
                        
                        const colors = {
                          medium: 'text-yellow-600 dark:text-yellow-400',
                          high: 'text-orange-600 dark:text-orange-400',
                          saturated: 'text-red-600 dark:text-red-400'
                        };
                        
                        return (
                          <div className={`flex items-center gap-1 mt-1 text-xs ${colors[saturation.saturationLevel]}`}>
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            <span>{saturation.duplicateRate}% duplicates</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {isCompleted && phase.count > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Expanded Service Type View for Phase 1 */}
      {coverage && coverage.phase_1_service_types.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Service Types Searched in {market.name}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {coverage.phase_1_service_types.map((serviceType, idx) => {
              // Find the corresponding search query
              const searchQuery = coverage.phase_1_searches.find(search => 
                search.toLowerCase().includes(serviceType.toLowerCase())
              );
              
              return (
                <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {serviceType}
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        "{searchQuery}"
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Saturation Analysis */}
      {coverage && (() => {
        const phase1Metrics = coverage.phase_1_import_metrics || [];
        if (phase1Metrics.length === 0) return null;
        
        const serviceTypeSaturation = getServiceTypeSaturation(
          phase1Metrics.map(m => ({
            totalFound: m.total_found,
            duplicates: m.duplicates,
            imported: m.imported,
            timestamp: new Date(m.timestamp),
            serviceType: m.service_type,
            searchQuery: m.search_query
          }))
        );
        
        const saturatedTypes = Object.entries(serviceTypeSaturation)
          .filter(([_, metrics]) => metrics.saturationLevel === 'high' || metrics.saturationLevel === 'saturated')
          .sort((a, b) => b[1].duplicateRate - a[1].duplicateRate);
        
        if (saturatedTypes.length === 0) return null;
        
        return (
          <div className="px-6 py-4 bg-orange-50 dark:bg-orange-900/20 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Saturation Analysis
            </h4>
            <div className="space-y-2">
              {saturatedTypes.slice(0, 3).map(([type, metrics]) => (
                <div key={type} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{type}</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {metrics.duplicateRate}% duplicates
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {metrics.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Recommended Next Actions
          </h4>
          <ul className="space-y-1">
            {recommendations.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <ClockIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}