'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Lead, AdPlatformStatus } from '@/types';
import AdCard from '../AdCard';

interface AdViewerModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function AdViewerModal({ open, onClose, lead }: AdViewerModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  if (!lead) return null;

  // Get all ads from all platforms
  const allAds = (lead.ad_platforms || []).flatMap(platform => 
    (platform.ads || []).map(ad => ({ ...ad, platform: platform.platform }))
  );

  // Filter ads based on selections
  const filteredAds = allAds.filter(ad => {
    if (selectedPlatform !== 'all' && ad.platform !== selectedPlatform) return false;
    if (selectedStatus !== 'all' && ad.status !== selectedStatus) return false;
    return true;
  });

  // Get unique platforms that have ads
  const platformsWithAds = (lead.ad_platforms || [])
    .filter(p => p.hasAds && p.ads && p.ads.length > 0)
    .map(p => p.platform);

  // Group ads by platform for tab display
  const adsByPlatform = (lead.ad_platforms || []).reduce((acc, platform) => {
    if (platform.ads && platform.ads.length > 0) {
      acc[platform.platform] = platform;
    }
    return acc;
  }, {} as Record<string, AdPlatformStatus>);

  const handleExportAds = () => {
    // Create CSV data
    const csvData = [
      ['Platform', 'Type', 'Headline', 'Primary Text', 'CTA', 'Status', 'Spend', 'Last Seen'],
      ...filteredAds.map(ad => [
        ad.platform,
        ad.type,
        ad.headline || '',
        ad.primaryText || '',
        ad.callToAction || '',
        ad.status || '',
        ad.spend || '',
        ad.lastSeen || ''
      ])
    ];

    // Convert to CSV string
    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lead.company_name.replace(/\s+/g, '-')}-ads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
                <div className="bg-white">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        {lead.company_name} - Advertising Gallery
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        {allAds.length} ads found across {platformsWithAds.length} platforms
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExportAds}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="text-sm border-gray-300 rounded-md"
                    >
                      <option value="all">All Platforms</option>
                      {platformsWithAds.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="text-sm border-gray-300 rounded-md"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="paused">Paused</option>
                    </select>

                    <span className="ml-auto text-sm text-gray-500">
                      Showing {filteredAds.length} ads
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {filteredAds.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No ads found matching your filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAds.map((ad, index) => (
                          <AdCard key={`${ad.platform}-${ad.id || index}`} ad={ad} platform={ad.platform} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Platform Breakdown */}
                  {Object.keys(adsByPlatform).length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Platform Breakdown</h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(adsByPlatform).map(([platform, data]) => (
                          <div key={platform} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-900">{platform}:</span>
                            <span className="text-sm text-gray-600">{data.ads?.length || 0} ads</span>
                            {data.adSpend && (
                              <span className="text-sm text-green-600">({data.adSpend})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 