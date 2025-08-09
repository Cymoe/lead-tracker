import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { calculateLeadStats, calculateLeadTrends, getTopPerformers, calculateDataQuality } from '@/utils/analytics';
import { LeadStats, LeadTrends } from '@/utils/analytics';

interface AnalyticsDashboardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboardModal({ open, onClose }: AnalyticsDashboardModalProps) {
  const { leads } = useLeadStore();
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [trends, setTrends] = useState<LeadTrends | null>(null);
  const [topPerformers, setTopPerformers] = useState<ReturnType<typeof getTopPerformers> | null>(null);
  const [dataQuality, setDataQuality] = useState<ReturnType<typeof calculateDataQuality> | null>(null);

  useEffect(() => {
    if (open && leads.length > 0) {
      const calculatedStats = calculateLeadStats(leads);
      const calculatedTrends = calculateLeadTrends(leads);
      const calculatedTopPerformers = getTopPerformers(calculatedStats);
      const calculatedDataQuality = calculateDataQuality(calculatedStats);

      setStats(calculatedStats);
      setTrends(calculatedTrends);
      setTopPerformers(calculatedTopPerformers);
      setDataQuality(calculatedDataQuality);
    }
  }, [open, leads]);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (!stats || !trends || !topPerformers || !dataQuality) {
    return null;
  }

  const adsPercentage = stats.total > 0 
    ? (stats.runningAds / stats.total) * 100 
    : 0;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
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

                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ChartBarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Analytics Dashboard
                      </Dialog.Title>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Overview Cards */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500">Total Leads</h4>
                          <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(stats.total)}</p>
                          <div className="mt-2 flex items-center text-sm">
                            {trends.weeklyGrowth > 0 ? (
                              <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
                            )}
                            <span className={trends.weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPercentage(trends.weeklyGrowth)} this week
                            </span>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500">Running Ads</h4>
                          <p className="mt-2 text-3xl font-semibold text-gray-900">{formatPercentage(adsPercentage)}</p>
                          <p className="mt-2 text-sm text-gray-600">
                            {formatNumber(stats.runningAds)} companies
                          </p>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500">Data Quality</h4>
                          <p className="mt-2 text-3xl font-semibold text-gray-900">{formatPercentage(dataQuality.score)}</p>
                          <p className="mt-2 text-sm text-gray-600">
                            Average completeness
                          </p>
                        </div>

                        {/* Lead Sources */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Lead Sources</h4>
                          <div className="space-y-2">
                            {topPerformers.topSources.map(([source, count]) => (
                              <div key={source} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{source}</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(count)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Cities */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Cities</h4>
                          <div className="space-y-2">
                            {topPerformers.topCities.map(([city, count]) => (
                              <div key={city} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 truncate">{city}</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(count)}</span>
                              </div>
                            ))}
                            {topPerformers.topCities.length === 0 && (
                              <p className="text-sm text-gray-500">No city data available</p>
                            )}
                          </div>
                        </div>

                        {/* Service Types */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Services</h4>
                          <div className="space-y-2">
                            {topPerformers.topServices.map(([service, count]) => (
                              <div key={service} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 truncate">{service}</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(count)}</span>
                              </div>
                            ))}
                            {topPerformers.topServices.length === 0 && (
                              <p className="text-sm text-gray-500">No service type data available</p>
                            )}
                          </div>
                        </div>

                        {/* Monthly Trend */}
                        <div className="bg-white border rounded-lg p-4 md:col-span-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Monthly Trend</h4>
                          <div className="flex items-end space-x-2 h-32">
                            {stats.byMonth.map((month) => {
                              const maxCount = Math.max(...stats.byMonth.map(m => m.count));
                              const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                              
                              return (
                                <div key={month.month} className="flex-1 flex flex-col items-center">
                                  <div className="w-full bg-blue-100 rounded-t relative" style={{ height: `${height}%` }}>
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-900">
                                      {month.count > 0 && month.count}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500 mt-1">{month.month}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Data Completeness */}
                        <div className="bg-white border rounded-lg p-4 md:col-span-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Data Completeness</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Phone Numbers</span>
                                <span className="text-sm font-medium text-gray-900">{formatPercentage(dataQuality.phoneCompleteness)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${dataQuality.phoneCompleteness}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Instagram Handles</span>
                                <span className="text-sm font-medium text-gray-900">{formatPercentage(dataQuality.instagramCompleteness)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${dataQuality.instagramCompleteness}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Websites</span>
                                <span className="text-sm font-medium text-gray-900">{formatPercentage(dataQuality.websiteCompleteness)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${dataQuality.websiteCompleteness}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white border rounded-lg p-4 md:col-span-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Lead Actions</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.runningAds)}</p>
                              <p className="text-sm text-gray-600">Running Ads</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
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