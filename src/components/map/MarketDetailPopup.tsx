import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MarketMetrics } from '@/types/market-data';
import { OpportunityScorer } from '@/utils/opportunity-scorer';

interface Props {
  market: MarketMetrics;
  onClose: () => void;
}

export default function MarketDetailPopup({ market, onClose }: Props) {
  const health = OpportunityScorer.getMarketHealth(market);
  const insights = OpportunityScorer.generateInsights(market);
  const industryScores = OpportunityScorer.scoreIndustries(market);
  
  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {market.city}, {market.state}
                      </h2>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: health.color }}
                        />
                        <span className="font-medium" style={{ color: health.color }}>
                          {health.status} Market
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600">{health.description}</p>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Opportunity Score</p>
                      <p className="text-2xl font-bold text-gray-900">{market.opportunityScore}/100</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Boomer Owners</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(market.demographics.boomerBusinessOwners / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Multiple</p>
                      <p className="text-2xl font-bold text-gray-900">{market.market.avgMultiple}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Annual Deals</p>
                      <p className="text-2xl font-bold text-gray-900">{market.market.yearlyTransactions}</p>
                    </div>
                  </div>
                  
                  {/* Market Insights */}
                  {insights.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Insights</h3>
                      <ul className="space-y-2">
                        {insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-sm text-gray-700">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Industry Analysis */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Industries</h3>
                    <div className="space-y-3">
                      {industryScores.map((industry, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{industry.industry}</h4>
                            <span className="text-sm font-medium text-blue-600">
                              Score: {industry.score}/100
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Businesses: </span>
                              <span className="font-medium">
                                {market.topIndustries[index]?.businessCount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Avg Revenue: </span>
                              <span className="font-medium">
                                {market.topIndustries[index]?.avgRevenue}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Growth: </span>
                              <span className="font-medium text-green-600">
                                {market.topIndustries[index]?.growthRate}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Retirement Risk: </span>
                              <span className="font-medium text-red-600">
                                {industry.factors.retirementRisk}/100
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Growth Indicators */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Population Growth</p>
                      <p className="text-lg font-semibold text-green-600">{market.growth.populationGrowth}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Business Growth</p>
                      <p className="text-lg font-semibold text-green-600">{market.growth.businessGrowth}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">GDP Growth</p>
                      <p className="text-lg font-semibold text-green-600">{market.growth.gdpGrowth}</p>
                    </div>
                  </div>
                  
                  {/* Competition Analysis */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Competition Analysis</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Active Buyers: </span>
                        <span className="font-medium">{market.competition.activeBuyers}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">PE Presence: </span>
                        <span className="font-medium">{market.competition.pePresence}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Bids/Deal: </span>
                        <span className="font-medium">{market.competition.avgBidsPerDeal}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days on Market: </span>
                        <span className="font-medium">{market.market.avgDaysOnMarket}</span>
                      </div>
                    </div>
                    {market.competition.topBuyers.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600">Top Buyers: {market.competition.topBuyers.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Data Source Attribution */}
                  {market.dataSource && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Data Sources: US Census Bureau, Federal Reserve (FRED), Bureau of Labor Statistics</span>
                        <span>Last Updated: {new Date(market.dataSource.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}