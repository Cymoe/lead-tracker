import { useState, useEffect } from 'react';
import { MarketCoverage, DynamicMarket } from '@/types';
import { getAllMarketCoverage } from '@/lib/market-coverage-api';
import { getMarketSizeConfig } from '@/utils/market-size';
import { calculateSaturation } from '@/utils/saturation-detection';
import { 
  TrophyIcon,
  FireIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  LightBulbIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface MarketInsightsPanelProps {
  markets: DynamicMarket[];
}

interface MarketInsight {
  type: 'achievement' | 'warning' | 'opportunity' | 'milestone';
  title: string;
  description: string;
  icon: any;
  color: string;
  marketId?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export default function MarketInsightsPanel({ markets }: MarketInsightsPanelProps) {
  const [coverageData, setCoverageData] = useState<MarketCoverage[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadInsights();
  }, [markets]);
  
  const loadInsights = async () => {
    try {
      const coverage = await getAllMarketCoverage();
      setCoverageData(coverage);
      
      const generatedInsights = generateInsights(markets, coverage);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateInsights = (
    allMarkets: DynamicMarket[],
    allCoverage: MarketCoverage[]
  ): MarketInsight[] => {
    const insights: MarketInsight[] = [];
    
    // 1. Achievement: Markets with high coverage
    const highCoverageMarkets = allCoverage.filter(c => c.coverage_percentage >= 80);
    if (highCoverageMarkets.length > 0) {
      insights.push({
        type: 'achievement',
        title: `${highCoverageMarkets.length} Markets Near Completion`,
        description: `Great job! ${highCoverageMarkets.map(m => m.market_name).join(', ')} ${highCoverageMarkets.length === 1 ? 'has' : 'have'} over 80% coverage.`,
        icon: TrophyIcon,
        color: 'green'
      });
    }
    
    // 2. Warning: Saturated markets
    const saturatedMarkets = allCoverage.filter(c => {
      if (!c.phase_1_import_metrics || c.phase_1_import_metrics.length < 3) return false;
      const saturation = calculateSaturation(c.phase_1_import_metrics.map(m => ({
        totalFound: m.total_found,
        duplicates: m.duplicates,
        imported: m.imported,
        timestamp: new Date(m.timestamp),
        serviceType: m.service_type,
        searchQuery: m.search_query
      })));
      return saturation.saturationLevel === 'saturated';
    });
    
    if (saturatedMarkets.length > 0) {
      insights.push({
        type: 'warning',
        title: `${saturatedMarkets.length} Saturated ${saturatedMarkets.length === 1 ? 'Market' : 'Markets'}`,
        description: `${saturatedMarkets.map(m => m.market_name).join(', ')} ${saturatedMarkets.length === 1 ? 'is' : 'are'} showing high duplicate rates. Consider moving to Phase 2.`,
        icon: ExclamationTriangleIcon,
        color: 'orange'
      });
    }
    
    // 3. Opportunity: Large markets with low coverage
    const largeUntappedMarkets = allMarkets.filter(market => {
      if (market.type !== 'city') return false;
      const cityName = market.name.includes(',') ? market.name.split(',')[0].trim() : market.name;
      const config = getMarketSizeConfig(cityName);
      const coverage = allCoverage.find(c => c.market_id === market.id);
      return (config.tier === 'large' || config.tier === 'mega') && (!coverage || coverage.coverage_percentage < 20);
    });
    
    if (largeUntappedMarkets.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'High-Value Markets Available',
        description: `${largeUntappedMarkets.slice(0, 3).map(m => m.name).join(', ')} are large markets with low coverage. These could yield many leads.`,
        icon: FireIcon,
        color: 'purple',
        marketId: largeUntappedMarkets[0].id,
        actionLabel: 'Start Coverage',
        actionUrl: `/market-workflow?market=${largeUntappedMarkets[0].id}`
      });
    }
    
    // 4. Milestone: Total leads collected
    const totalLeads = allCoverage.reduce((sum, c) => sum + c.total_lead_count, 0);
    const milestones = [100, 500, 1000, 5000, 10000];
    const nextMilestone = milestones.find(m => m > totalLeads);
    const lastMilestone = milestones.filter(m => m <= totalLeads).pop();
    
    if (lastMilestone && lastMilestone >= 100) {
      insights.push({
        type: 'milestone',
        title: `${totalLeads.toLocaleString()} Total Leads Collected!`,
        description: nextMilestone 
          ? `You've passed ${lastMilestone.toLocaleString()} leads! Only ${(nextMilestone - totalLeads).toLocaleString()} more to reach ${nextMilestone.toLocaleString()}.`
          : `Amazing achievement! You've built a massive database.`,
        icon: ChartBarIcon,
        color: 'blue'
      });
    }
    
    // 5. Opportunity: Phase progression
    const phase1OnlyMarkets = allCoverage.filter(c => 
      c.phase_1_lead_count > 50 && 
      c.phase_2_lead_count === 0 &&
      c.phase_1_service_types.length >= 3
    );
    
    if (phase1OnlyMarkets.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Ready for Facebook Ads',
        description: `${phase1OnlyMarkets.length} ${phase1OnlyMarkets.length === 1 ? 'market is' : 'markets are'} ready for Phase 2 (Facebook Ads) to find active advertisers.`,
        icon: LightBulbIcon,
        color: 'indigo',
        marketId: phase1OnlyMarkets[0].market_id,
        actionLabel: 'Start Phase 2',
        actionUrl: `/leads?openBulkImport=true&market_id=${phase1OnlyMarkets[0].market_id}`
      });
    }
    
    // 6. Time-based insights
    const staleMarkets = allCoverage.filter(c => {
      const lastUpdate = new Date(c.updated_at);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 14 && c.coverage_percentage < 80;
    });
    
    if (staleMarkets.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Markets Need Attention',
        description: `${staleMarkets.length} ${staleMarkets.length === 1 ? 'market hasn\'t' : 'markets haven\'t'} been updated in over 2 weeks.`,
        icon: ClockIcon,
        color: 'yellow'
      });
    }
    
    // 7. Service type diversity
    const lowDiversityMarkets = allCoverage.filter(c => {
      if (c.phase_1_lead_count < 20) return false;
      const cityName = c.market_name.includes(',') ? c.market_name.split(',')[0].trim() : c.market_name;
      const config = getMarketSizeConfig(cityName);
      return c.phase_1_service_types.length < config.minServiceTypes;
    });
    
    if (lowDiversityMarkets.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Expand Service Types',
        description: `${lowDiversityMarkets.length} ${lowDiversityMarkets.length === 1 ? 'market needs' : 'markets need'} more service type diversity for better coverage.`,
        icon: LightBulbIcon,
        color: 'blue'
      });
    }
    
    return insights.sort((a, b) => {
      // Priority order: warning > opportunity > achievement > milestone
      const priority = { warning: 0, opportunity: 1, achievement: 2, milestone: 3 };
      return priority[a.type] - priority[b.type];
    });
  };
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const colorClasses = {
    green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    orange: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    indigo: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
  };
  
  const iconColorClasses = {
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    indigo: 'text-indigo-600 dark:text-indigo-400'
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Market Insights & Progress
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI-powered recommendations based on your coverage data
        </p>
      </div>
      
      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Start collecting leads to see insights and recommendations
            </p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${colorClasses[insight.color]}`}
            >
              <div className="flex items-start gap-3">
                <insight.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColorClasses[insight.color]}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {insight.description}
                  </p>
                  {insight.actionLabel && insight.actionUrl && (
                    <a
                      href={insight.actionUrl}
                      className={`inline-flex items-center gap-1 mt-2 text-sm font-medium ${iconColorClasses[insight.color]} hover:underline`}
                    >
                      {insight.actionLabel} →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {coverageData.filter(c => c.market_type === 'city').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Active Markets
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(
                coverageData.reduce((sum, c) => sum + c.coverage_percentage, 0) / 
                (coverageData.length || 1)
              )}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Avg Coverage
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {coverageData
                .filter(c => c.market_type === 'city')
                .reduce((sum, c) => sum + c.total_lead_count, 0)
                .toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Leads
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}