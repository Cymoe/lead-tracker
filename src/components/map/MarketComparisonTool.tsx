import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { CountyMarketMetrics } from '@/services/county-data-aggregator';
import { MarketMetrics } from '@/types/market-data';

interface Props {
  viewMode: 'metro' | 'county';
  selectedItems: (CountyMarketMetrics | MarketMetrics)[];
  onRemoveItem: (item: CountyMarketMetrics | MarketMetrics) => void;
  onClose: () => void;
}

export default function MarketComparisonTool({ viewMode, selectedItems, onRemoveItem, onClose }: Props) {
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    if (viewMode === 'county') {
      const countyItems = selectedItems as CountyMarketMetrics[];
      setComparisonData(countyItems.map(county => ({
        name: `${county.countyName}, ${county.stateAbbr}`,
        opportunityScore: county.opportunityScore,
        population: county.demographics.population,
        businesses: county.businessMetrics.totalBusinesses,
        boomerOwned: county.businessMetrics.boomerOwnedEstimate,
        avgBusinessSize: county.businessMetrics.avgBusinessSize,
        medianIncome: county.demographics.medianIncome,
        marketType: county.marketClassification,
        businessDensity: ((county.businessMetrics.totalBusinesses / county.demographics.population) * 1000).toFixed(2)
      })));
    } else {
      const metroItems = selectedItems as MarketMetrics[];
      setComparisonData(metroItems.map(metro => ({
        name: `${metro.city}, ${metro.stateCode}`,
        opportunityScore: metro.opportunityScore,
        boomerOwners: metro.demographics.boomerBusinessOwners,
        avgAge: metro.demographics.avgOwnerAge,
        avgMultiple: metro.market.avgMultiple,
        medianRevenue: metro.market.medianRevenue,
        yearlyDeals: metro.market.yearlyTransactions,
        competition: metro.market.competitionLevel,
        populationGrowth: metro.growth.populationGrowth,
        businessGrowth: metro.growth.businessGrowth
      })));
    }
  }, [selectedItems, viewMode]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 70) return 'text-amber-600 font-semibold';
    if (score >= 60) return 'text-blue-600';
    return 'text-gray-600';
  };

  const renderCountyComparison = () => {
    if (comparisonData.length === 0) return null;

    const metrics = [
      { key: 'opportunityScore', label: 'Opportunity Score', format: (v: number) => v },
      { key: 'marketType', label: 'Market Type', format: (v: string) => v },
      { key: 'population', label: 'Population', format: formatNumber },
      { key: 'businesses', label: 'Total Businesses', format: formatNumber },
      { key: 'boomerOwned', label: 'Est. Boomer Owned', format: formatNumber },
      { key: 'businessDensity', label: 'Business Density (per 1K)', format: (v: string) => v },
      { key: 'avgBusinessSize', label: 'Avg Business Size', format: (v: number) => `${v} emp` },
      { key: 'medianIncome', label: 'Median Income', format: (v: number) => `$${formatNumber(v)}` }
    ];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              {comparisonData.map((item, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <button
                      onClick={() => onRemoveItem(selectedItems[idx])}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric) => (
              <tr key={metric.key}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {metric.label}
                </td>
                {comparisonData.map((item, idx) => (
                  <td key={idx} className={`px-4 py-3 whitespace-nowrap text-sm ${
                    metric.key === 'opportunityScore' ? getScoreColor(item[metric.key]) : 'text-gray-900'
                  }`}>
                    {metric.format(item[metric.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMetroComparison = () => {
    if (comparisonData.length === 0) return null;

    const metrics = [
      { key: 'opportunityScore', label: 'Opportunity Score', format: (v: number) => v },
      { key: 'boomerOwners', label: 'Boomer Owners', format: formatNumber },
      { key: 'avgAge', label: 'Avg Owner Age', format: (v: number) => v },
      { key: 'avgMultiple', label: 'Avg Multiple', format: (v: string) => v },
      { key: 'medianRevenue', label: 'Median Revenue', format: (v: string) => v },
      { key: 'yearlyDeals', label: 'Yearly Deals', format: (v: number) => v },
      { key: 'competition', label: 'Competition', format: (v: string) => v },
      { key: 'populationGrowth', label: 'Pop Growth', format: (v: string) => v },
      { key: 'businessGrowth', label: 'Biz Growth', format: (v: string) => v }
    ];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              {comparisonData.map((item, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <button
                      onClick={() => onRemoveItem(selectedItems[idx])}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric) => (
              <tr key={metric.key}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {metric.label}
                </td>
                {comparisonData.map((item, idx) => (
                  <td key={idx} className={`px-4 py-3 whitespace-nowrap text-sm ${
                    metric.key === 'opportunityScore' ? getScoreColor(item[metric.key]) : 'text-gray-900'
                  }`}>
                    {metric.format(item[metric.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getWinner = () => {
    if (comparisonData.length < 2) return null;
    
    const highestScore = Math.max(...comparisonData.map(d => d.opportunityScore));
    const winner = comparisonData.find(d => d.opportunityScore === highestScore);
    
    return winner;
  };

  const winner = getWinner();

  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ScaleIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  {viewMode === 'county' ? 'County' : 'Metro'} Market Comparison
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-12">
                <ScaleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Select {viewMode === 'county' ? 'counties' : 'metros'} on the map to compare
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'county' ? renderCountyComparison() : renderMetroComparison()}
                
                {winner && selectedItems.length > 1 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Analysis</h4>
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">{winner.name}</span> has the highest opportunity score
                      ({winner.opportunityScore}/100) among the compared markets.
                      {viewMode === 'county' && winner.marketType === 'tertiary' && 
                        ' As a tertiary market, it likely has less competition from PE firms.'}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  <p>Data sources: US Census Bureau, FRED, BLS</p>
                  <p>Tip: Add more {viewMode === 'county' ? 'counties' : 'metros'} by clicking them on the map while holding Ctrl/Cmd</p>
                </div>
              </>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}