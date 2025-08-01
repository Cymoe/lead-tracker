'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import { Lead, AdPlatformStatus } from '@/types';
import AdPlatformChecker from '../AdPlatformChecker';
import AdViewerModal from './AdViewerModal';
import { useLeadStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { checkAdPlatform } from '@/lib/ad-platform-api';

interface AdPlatformModalProps {
  open: boolean;
  onClose: () => void;
  selectedLeadIds?: string[];
}

export default function AdPlatformModal({ open, onClose, selectedLeadIds = [] }: AdPlatformModalProps) {
  const { leads, updateLead } = useLeadStore();
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, AdPlatformStatus[]>>({});
  const [modalSelectedLeads, setModalSelectedLeads] = useState<string[]>(selectedLeadIds);
  const [showAdViewer, setShowAdViewer] = useState(false);
  const [adViewerLead, setAdViewerLead] = useState<Lead | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState<string>('');
  
  // Reset modal selected leads when selectedLeadIds changes
  useEffect(() => {
    setModalSelectedLeads(selectedLeadIds);
  }, [selectedLeadIds]);
  
  // If no leads are pre-selected, show lead selection in modal
  const selectedLeads = modalSelectedLeads.length > 0 
    ? leads.filter(lead => modalSelectedLeads.includes(lead.id))
    : [];
  
  const platforms = [
    'Google Ads',
    'Facebook Ads', 
    'Instagram Ads',
    'Nextdoor',
    'LinkedIn Ads',
    'Twitter Ads',
    'Yelp Ads',
    'Angi Ads',
    'HomeAdvisor',
    'Thumbtack'
  ];
  
  const checkPlatformAds = async (lead: Lead, platform: string): Promise<AdPlatformStatus> => {
    try {
      // Use real API to check ad platforms
      const result = await checkAdPlatform(
        lead.id,
        platform,
        lead.company_name,
        lead.city || undefined
      );
      return result;
    } catch (error) {
      console.error(`Error checking ${platform} for ${lead.company_name}:`, error);
      // Return empty result on error
      return {
        platform: platform as AdPlatformStatus['platform'],
        hasAds: false,
        lastChecked: new Date().toISOString(),
        notes: 'Error checking platform',
      };
    }
  };
  
  const handleBulkCheck = async () => {
    setChecking(true);
    setProgress(0);
    setResults({});
    
    const totalChecks = selectedLeads.length * platforms.length;
    let completedChecks = 0;
    
    toast(`🔍 Intelligently scanning ${platforms.length} ad platforms...`);
    
    for (const lead of selectedLeads) {
      const leadResults: AdPlatformStatus[] = [];
      
      for (const platform of platforms) {
        try {
          setCurrentPlatform(platform);
          const result = await checkPlatformAds(lead, platform);
          leadResults.push(result);
          
          completedChecks++;
          setProgress((completedChecks / totalChecks) * 100);
        } catch (error) {
          console.error(`Error checking ${platform} for ${lead.company_name}:`, error);
        }
      }
      
      setResults(prev => ({ ...prev, [lead.id]: leadResults }));
      
      // Update the lead with new ad platform data
      const existingPlatforms = lead.ad_platforms || [];
      const updatedPlatforms = [...existingPlatforms];
      
      leadResults.forEach(newResult => {
        const existingIndex = updatedPlatforms.findIndex(p => p.platform === newResult.platform);
        if (existingIndex >= 0) {
          updatedPlatforms[existingIndex] = newResult;
        } else {
          updatedPlatforms.push(newResult);
        }
      });
      
      updateLead({
        ...lead,
        ad_platforms: updatedPlatforms,
        total_ad_platforms: updatedPlatforms.filter(p => p.hasAds).length,
        running_ads: updatedPlatforms.some(p => p.hasAds)
      });
    }
    
    setChecking(false);
    setCurrentPlatform('');
    
    // Count total active ads found
    const totalAdsFound = Object.values(results).reduce((sum, leadResults) => 
      sum + leadResults.filter(p => p.hasAds).reduce((adSum, p) => adSum + (p.ads?.length || 0), 0), 0
    );
    
    const activePlatforms = Object.values(results).reduce((sum, leadResults) => 
      sum + leadResults.filter(p => p.hasAds).length, 0
    );
    
    toast.success(`✨ Found ${totalAdsFound} ads across ${activePlatforms} active platforms!`);
  };
  
  const getLeadActiveCount = (leadId: string) => {
    const leadResults = results[leadId] || [];
    return leadResults.filter(p => p.hasAds).length;
  };
  
  return (
    <>
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

        <div className="fixed inset-0 z-[51] overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <MagnifyingGlassCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Intelligent Ad Platform Scanner
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Our AI-powered scanner will automatically check all major advertising platforms 
                        to discover where your leads are actively running campaigns.
                      </p>
                    </div>

                    {/* Lead Selection or Summary */}
                    {modalSelectedLeads.length === 0 ? (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Select Leads to Check</h4>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                          {leads.map((lead) => (
                            <label key={lead.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={modalSelectedLeads.includes(lead.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setModalSelectedLeads([...modalSelectedLeads, lead.id]);
                                  } else {
                                    setModalSelectedLeads(modalSelectedLeads.filter(id => id !== lead.id));
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-sm">
                                <span className="font-medium text-gray-900">{lead.company_name}</span>
                                <span className="text-gray-500 ml-2">({lead.city})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => setModalSelectedLeads(leads.map(l => l.id))}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Select All
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          {selectedLeads.length} leads selected
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {selectedLeads.slice(0, 3).map(l => l.company_name).join(', ')}
                          {selectedLeads.length > 3 && ` +${selectedLeads.length - 3} more`}
                        </p>
                        {selectedLeadIds.length === 0 && (
                          <button
                            onClick={() => setModalSelectedLeads([])}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                          >
                            Change Selection
                          </button>
                        )}
                      </div>
                    )}

                    {/* Intelligent Platform Detection Notice */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Intelligent Ad Detection
                          </h3>
                          <p className="mt-1 text-sm text-blue-700">
                            We'll automatically scan all major advertising platforms including Google, Facebook, Instagram, Nextdoor, LinkedIn, and more to find active campaigns.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {checking && (
                      <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>
                            {currentPlatform ? `Checking ${currentPlatform}...` : 'Initializing...'}
                          </span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          Intelligently scanning {platforms.length} platforms for active advertising campaigns
                        </p>
                      </div>
                    )}

                    {/* Results */}
                    {Object.keys(results).length > 0 && (
                      <div className="mt-6 max-h-60 overflow-y-auto">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Results</h4>
                        <div className="space-y-2">
                          {selectedLeads.map(lead => {
                            const activeCount = getLeadActiveCount(lead.id);
                            return (
                              <div key={lead.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-900">
                                    {lead.company_name}
                                  </span>
                                  <span className={`text-sm font-medium ${
                                    activeCount > 0 ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {activeCount} / {platforms.length} active
                                  </span>
                                </div>
                                {results[lead.id] && (
                                  <div className="mt-2">
                                    <AdPlatformChecker 
                                      platforms={results[lead.id]} 
                                      compact={true}
                                      onViewAds={() => {
                                        setAdViewerLead(lead);
                                        setShowAdViewer(true);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleBulkCheck}
                    disabled={checking || selectedLeads.length === 0}
                  >
                    {checking ? 'Scanning Ad Platforms...' : 'Scan All Ad Platforms'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
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
    
          <AdViewerModal
        open={showAdViewer}
        onClose={() => {
          setShowAdViewer(false);
          setAdViewerLead(null);
        }}
        lead={adViewerLead}
      />
    </>
  );
} 