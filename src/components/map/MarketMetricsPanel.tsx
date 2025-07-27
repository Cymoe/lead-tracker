import { MarketMetrics } from '@/types/market-data';
import { OpportunityScorer } from '@/utils/opportunity-scorer';
import ExportMarketData from './ExportMarketData';

interface Props {
  markets: MarketMetrics[];
  selectedMarket: MarketMetrics | null;
  onMarketSelect: (market: MarketMetrics) => void;
}

export default function MarketMetricsPanel({ markets, selectedMarket, onMarketSelect }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-[400px] min-h-[200px] flex flex-col overflow-hidden">
      <div className="p-4 pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Top Acquisition Markets</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-2">
          {markets.map((market, index) => {
          const health = OpportunityScorer.getMarketHealth(market);
          const isSelected = selectedMarket?.city === market.city;
          
          return (
            <div
              key={`${market.city}-${market.stateCode}`}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-50 border-2 border-blue-500' 
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
              onClick={() => onMarketSelect(market)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  <h4 className="font-medium text-gray-900">
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
                <span className="text-gray-600">Score: {market.opportunityScore}/100</span>
                <span className="text-gray-500">{market.market.yearlyTransactions} deals/yr</span>
              </div>
              
              <div className="mt-1 text-xs text-gray-500">
                {market.demographics.boomerBusinessOwners.toLocaleString()} boomer-owned businesses
              </div>
            </div>
          );
        })}
        </div>
      </div>
      
      {markets.length > 0 && (
        <div className="p-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {markets.length} markets
            </p>
            <ExportMarketData 
              metroData={markets}
              viewMode="metro"
            />
          </div>
        </div>
      )}
    </div>
  );
}