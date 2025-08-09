import { useState, useEffect } from 'react';
import { MarketCoverage, DynamicMarket } from '@/types';
import { 
  getPrioritizedServiceTypes, 
  getSearchStrategy,
  getServiceTypeCombos,
  ServiceTypePriority 
} from '@/utils/service-type-prioritization';
import { getMarketSizeConfig } from '@/utils/market-size';
import { getServiceTypeSaturation } from '@/utils/saturation-detection';
import { 
  SparklesIcon, 
  LightBulbIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { FaInstagram } from 'react-icons/fa';
import HighTicketLegend from './HighTicketLegend';

interface ServiceTypePrioritizerProps {
  market: DynamicMarket;
  coverage: MarketCoverage | null;
  onServiceTypeSelect?: (serviceType: string) => void;
}

export default function ServiceTypePrioritizer({
  market,
  coverage,
  onServiceTypeSelect
}: ServiceTypePrioritizerProps) {
  const [priorities, setPriorities] = useState<ServiceTypePriority[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'priority' | 'strategy' | 'combos'>('priority');
  
  useEffect(() => {
    if (market) {
      calculatePriorities();
    }
  }, [market, coverage]);
  
  const calculatePriorities = () => {
    if (!market) return;
    
    const cityName = market.name.includes(',') 
      ? market.name.split(',')[0].trim()
      : market.name;
    const marketConfig = getMarketSizeConfig(cityName);
    
    // Get searched types and saturation data
    const searchedTypes = coverage?.phase_1_service_types || [];
    const saturationData = coverage?.phase_1_import_metrics 
      ? getServiceTypeSaturation(
          coverage.phase_1_import_metrics.map(m => ({
            totalFound: m.total_found,
            duplicates: m.duplicates,
            imported: m.imported,
            timestamp: new Date(m.timestamp),
            serviceType: m.service_type,
            searchQuery: m.search_query
          }))
        )
      : undefined;
    
    const prioritized = getPrioritizedServiceTypes(
      marketConfig.tier,
      searchedTypes,
      saturationData
    );
    
    setPriorities(prioritized);
  };
  
  const getPhaseFromCoverage = (): 1 | 2 | 3 => {
    if (!coverage) return 1;
    if (coverage.phase_3_lead_count > 0) return 3;
    if (coverage.phase_2_lead_count > 0) return 2;
    return 1;
  };
  
  const displayPriorities = showAll ? priorities : priorities.slice(0, 5);
  
  const cityName = market.name.includes(',') 
    ? market.name.split(',')[0].trim()
    : market.name;
  const marketConfig = getMarketSizeConfig(cityName);
  const strategy = getSearchStrategy(marketConfig.tier, getPhaseFromCoverage());
  const combos = getServiceTypeCombos(marketConfig.tier);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with Tabs */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-500" />
            Service Type Intelligence
          </h3>
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
            {marketConfig.tier.toUpperCase()} MARKET
          </span>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('priority')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'priority'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Priority List
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'strategy'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Strategy
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'combos'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Combos
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'priority' && (
          <>
            {/* Legend */}
            <div className="mb-4">
              <HighTicketLegend />
            </div>
            <div className="space-y-3">
              {displayPriorities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No service type recommendations available
              </p>
            ) : (
              <>
                {displayPriorities.map((priority, index) => (
                  <div
                    key={priority.serviceType}
                    className={`p-3 rounded-lg border transition-all ${
                      priority.priority > 70
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : priority.priority > 50
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : priority.priority > 30
                        ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                    } ${onServiceTypeSelect ? 'cursor-pointer hover:shadow-md' : ''}`}
                    onClick={() => onServiceTypeSelect?.(priority.serviceType)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {index + 1}. {priority.serviceType}
                          </span>
                          {priority.visualImpactScore && priority.visualImpactScore >= 4 && (
                            <CameraIcon className="h-4 w-4 text-purple-500" title="High visual impact" />
                          )}
                          {priority.instagramPotential === 'very-high' && (
                            <FaInstagram className="h-3 w-3 text-pink-500" title="Instagram worthy" />
                          )}
                          {priority.saturationLevel && priority.saturationLevel !== 'low' && (
                            <ExclamationTriangleIcon 
                              className={`h-4 w-4 ${
                                priority.saturationLevel === 'saturated' 
                                  ? 'text-red-500' 
                                  : priority.saturationLevel === 'high'
                                  ? 'text-orange-500'
                                  : 'text-yellow-500'
                              }`}
                            />
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {priority.reasons.map((reason, idx) => (
                            <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                              • {reason}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1">
                          <ChartBarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {priority.priority}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          ~{priority.estimatedLeads} leads
                        </p>
                        {priority.avgProjectValue && (
                          <div className="flex items-center gap-1 mt-1">
                            <CurrencyDollarIcon className="h-3 w-3 text-green-500" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              ${(priority.avgProjectValue.min / 1000).toFixed(0)}K-${(priority.avgProjectValue.max / 1000).toFixed(0)}K
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {priorities.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {showAll ? 'Show Less' : `Show ${priorities.length - 5} More`}
                  </button>
                )}
              </>
            )}
            </div>
          </>
        )}
        
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <LightBulbIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {strategy.strategy}
                  </h4>
                  <ul className="space-y-1">
                    {strategy.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Phase {getPhaseFromCoverage()} strategy for {marketConfig.tier} markets
            </div>
          </div>
        )}
        
        {activeTab === 'combos' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Search these service types together for better coverage:
            </p>
            {combos.map((combo, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-wrap gap-1 mb-2">
                  {combo.combo.map((type, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {combo.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}