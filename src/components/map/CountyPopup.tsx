import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CountyMarketMetrics } from '@/services/county-data-aggregator';
import { useRouter } from 'next/navigation';
import { calculateSellerMotivation } from '@/utils/outreach-scripts';

interface Props {
  county: CountyMarketMetrics;
  onClose: () => void;
}

export default function CountyPopup({ county, onClose }: Props) {
  const router = useRouter();
  const sellerMotivation = calculateSellerMotivation(county);
  
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#DC2626';
    if (score >= 70) return '#F59E0B';
    if (score >= 60) return '#3B82F6';
    if (score >= 50) return '#10B981';
    return '#6B7280';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  const handleSearchLeads = () => {
    // Store the county data in localStorage for the main page to use
    localStorage.setItem('marketAnalysisSelection', JSON.stringify({
      county: county.countyName,
      state: county.stateAbbr,
      fipsCode: county.fipsCode,
      businessTypes: county.industryFocus.topGreyTsunamiIndustries,
      sellerMotivation: sellerMotivation.level,
      boomerLikelihood: county.boomerLikelihood
    }));
    
    // Navigate to the main page
    router.push('/');
    onClose();
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
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
                        {county.countyName} County, {county.stateAbbr}
                      </h2>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getScoreColor(county.opportunityScore) }}
                        />
                        <span 
                          className="font-bold text-lg"
                          style={{ color: getScoreColor(county.opportunityScore) }}
                        >
                          Score: {county.opportunityScore}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 capitalize">
                      {county.marketClassification} Market
                    </p>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Businesses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(county.businessMetrics.totalBusinesses)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Est. Boomer Owned</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(county.businessMetrics.boomerOwnedEstimate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ~{(county.businessMetrics.boomerOwnershipPercentage * 100).toFixed(0)}% 
                        {county.boomerLikelihood && county.boomerLikelihood.confidence === 'high' && ' (adjusted)'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Population</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(county.demographics.population)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Median Age</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {county.demographics.medianAge.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Median Income</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${formatNumber(county.demographics.medianIncome)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Business Size</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {county.businessMetrics.avgBusinessSize}
                      </p>
                      <p className="text-xs text-gray-500">employees</p>
                    </div>
                  </div>
                  
                  {/* Boomer Likelihood Badge */}
                  {county.boomerLikelihood && (
                    <div className="mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              🎯 Boomer Likelihood Score
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                county.boomerLikelihood.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                county.boomerLikelihood.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {county.boomerLikelihood.confidence} confidence
                              </span>
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Estimated {(county.boomerLikelihood.percentage * 100).toFixed(0)}% of businesses 
                              are boomer-owned (vs {(county.businessMetrics.boomerOwnershipPercentage * 100).toFixed(0)}% state average)
                            </p>
                          </div>
                          <div className="text-3xl font-bold text-blue-600">
                            {county.boomerLikelihood.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Seller Motivation Indicator */}
                  <div className="mb-6">
                    <div className={`p-4 rounded-lg border ${
                      sellerMotivation.level === 'high' ? 'bg-red-50 border-red-200' :
                      sellerMotivation.level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          🔥 Seller Motivation
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                            sellerMotivation.level === 'high' ? 'bg-red-100 text-red-800' :
                            sellerMotivation.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sellerMotivation.level.toUpperCase()}
                          </span>
                        </h4>
                      </div>
                      {sellerMotivation.factors.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {sellerMotivation.factors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  {/* Business Metrics */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Environment</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Business Density</span>
                        <span className="font-medium">
                          {((county.businessMetrics.totalBusinesses / county.demographics.population) * 1000).toFixed(1)} per 1K pop
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Payroll</span>
                        <span className="font-medium">
                          ${formatNumber(county.businessMetrics.annualPayroll)}
                        </span>
                      </div>
                      {county.businessMetrics.payrollPerEmployee && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Avg Salary</span>
                          <span className="font-medium">
                            ${formatNumber(county.businessMetrics.payrollPerEmployee)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Top Industries */}
                  {county.industryFocus.topGreyTsunamiIndustries.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Recommended Target Industries
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {county.industryFocus.topGreyTsunamiIndustries.map((industry, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Why This Market */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Why This Market?</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {county.marketClassification === 'tertiary' && (
                        <li>• Lower competition from PE firms in tertiary markets</li>
                      )}
                      {county.businessMetrics.avgBusinessSize < 20 && (
                        <li>• Small average business size indicates many SMB targets</li>
                      )}
                      {county.opportunityScore >= 70 && (
                        <li>• High opportunity score indicates favorable conditions</li>
                      )}
                      {county.businessMetrics.boomerOwnedEstimate > 1000 && (
                        <li>• Large pool of potential retirement-ready sellers</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Data Attribution */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <p>
                      Data Sources: US Census Bureau (CBP 2022, ACS 2022)
                      {county.dataSource.economic && ', FRED, BLS'}
                    </p>
                    <p>Last Updated: {new Date(county.dataSource.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={handleSearchLeads}
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    Search Leads in {county.countyName}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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