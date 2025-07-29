import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FaFacebook } from 'react-icons/fa';
import { useLeadStore } from '@/lib/store';
import { saveLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import USCityAutocomplete from '../USCityAutocomplete';

interface FacebookAdsSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface FacebookAdResult {
  id: string;
  page_name: string;
  ad_creative_body?: string;
  call_to_action?: string;
  started_running?: string;
  import_ready: {
    company_name: string;
    service_type: string;
    lead_source: string;
    running_ads: boolean;
    ad_start_date?: string;
    ad_copy?: string;
    ad_call_to_action?: string;
    notes: string;
    city: string;
    state: string;
  };
  quality_score: number;
  signals: string[];
}

export default function FacebookAdsSearchModal({ open, onClose }: FacebookAdsSearchModalProps) {
  const { addLead, leads } = useLeadStore();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FacebookAdResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [limit, setLimit] = useState(50);

  const handleSearch = async () => {
    if (!keyword || !location) {
      toast.error('Please enter a keyword and location');
      return;
    }

    setIsSearching(true);
    setApiKeyError(false);
    setHasSearched(true);

    try {
      const response = await fetch('/api/facebook-ads-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          location,
          limit
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.setupInstructions) {
          setApiKeyError(true);
        }
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results);
      
      // Auto-select high quality ads
      const highQualityIds = new Set(
        data.results
          .filter((r: FacebookAdResult) => r.quality_score >= 80)
          .map((r: FacebookAdResult) => r.id)
      );
      setSelectedIds(highQualityIds);

      toast.success(`Found ${data.results.length} active advertisers!`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (adId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(results.map(r => r.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id));
    
    if (selectedResults.length === 0) {
      toast.error('Please select at least one advertiser to import');
      return;
    }

    let successCount = 0;
    const toastId = toast.loading(`Importing ${selectedResults.length} leads...`);

    for (const result of selectedResults) {
      // Check for duplicates
      const isDuplicate = leads.some(
        existing => 
          existing.company_name.toLowerCase() === result.import_ready.company_name.toLowerCase() &&
          existing.city?.toLowerCase() === result.import_ready.city.toLowerCase()
      );

      if (!isDuplicate) {
        const newLead: Lead = {
          id: crypto.randomUUID(),
          user_id: '', // Will be set by the API
          company_name: result.import_ready.company_name,
          service_type: result.import_ready.service_type,
          city: result.import_ready.city,
          lead_source: 'FB Ad Library',
          running_ads: true,
          ad_start_date: result.import_ready.ad_start_date,
          ad_copy: result.import_ready.ad_copy,
          ad_call_to_action: result.import_ready.ad_call_to_action,
          notes: result.import_ready.notes,
          score: result.quality_score >= 90 ? 'A++' : 
                 result.quality_score >= 80 ? 'A+' : 
                 result.quality_score >= 70 ? 'A' : 
                 result.quality_score >= 60 ? 'B' : 'C',
          dm_sent: false,
          called: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const savedLead = await saveLead(newLead);
          if (savedLead) {
            addLead(savedLead);
            successCount++;
          }
        } catch (error) {
          console.error('Error saving lead:', error);
        }
      }
    }

    toast.dismiss(toastId);
    toast.success(`Successfully imported ${successCount} new leads!`);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setKeyword('');
    setLocation('');
    setResults([]);
    setSelectedIds(new Set());
    setHasSearched(false);
    setApiKeyError(false);
  };

  const suggestedKeywords = [
    'HVAC repair', 'plumbing services', 'landscaping', 'roofing contractor',
    'electrical services', 'painting contractor', 'pest control', 'pool service',
    'home remodeling', 'concrete contractor', 'fence installation', 'tree service'
  ];

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#1F2937] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
                <div className="bg-[#1F2937] px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-[#1F2937] text-gray-400 hover:text-gray-300"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-white flex items-center">
                        <FaFacebook className="h-6 w-6 mr-2 text-[#1877F2]" />
                        Facebook Ad Library Search
                      </Dialog.Title>

                      {/* Search Form */}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-300">
                            Search Keyword
                          </label>
                          <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="e.g., landscaping, HVAC repair, plumbing..."
                            className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                          />
                          <div className="mt-2 flex flex-wrap gap-1">
                            {suggestedKeywords.slice(0, 4).map(kw => (
                              <button
                                key={kw}
                                onClick={() => setKeyword(kw)}
                                className="text-xs px-2 py-1 rounded bg-[#374151] text-gray-300 hover:bg-[#4B5563]"
                              >
                                {kw}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            Location
                          </label>
                          <USCityAutocomplete
                            value={location}
                            onChange={setLocation}
                            placeholder="e.g., Phoenix, AZ"
                            className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            Results Limit
                          </label>
                          <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                          >
                            <option value={25}>25 results</option>
                            <option value={50}>50 results</option>
                            <option value={100}>100 results</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={handleSearch}
                          disabled={isSearching || !keyword || !location}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#EAB308] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                          {isSearching ? 'Searching...' : 'Search Facebook Ads'}
                        </button>
                      </div>

                      {/* API Key Error */}
                      {apiKeyError && (
                        <div className="mt-4 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg">
                          <h4 className="text-sm font-medium text-[#EF4444]">ScrapingBee API Key Required</h4>
                          <p className="mt-1 text-sm text-gray-300">
                            This feature requires ScrapingBee. You already have the setup guide!
                          </p>
                        </div>
                      )}

                      {/* Results */}
                      {results.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-300">
                              Found {results.length} active advertisers ({selectedIds.size} selected)
                            </h4>
                            <div className="flex gap-2">
                              <button
                                onClick={selectAll}
                                className="text-sm text-[#60A5FA] hover:text-[#93BBFC]"
                              >
                                Select All
                              </button>
                              <span className="text-gray-500">|</span>
                              <button
                                onClick={deselectAll}
                                className="text-sm text-[#60A5FA] hover:text-[#93BBFC]"
                              >
                                Deselect All
                              </button>
                            </div>
                          </div>

                          <div className="max-h-96 overflow-y-auto border border-[#374151] rounded-lg">
                            {results.map((result) => (
                              <div
                                key={result.id}
                                className={`p-4 border-b border-[#374151] last:border-b-0 cursor-pointer transition-colors ${
                                  selectedIds.has(result.id) 
                                    ? 'bg-[#3B82F6]/10' 
                                    : 'hover:bg-[#374151]/50'
                                }`}
                                onClick={() => toggleSelection(result.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(result.id)}
                                      onChange={() => {}}
                                      className="h-4 w-4 text-[#3B82F6] border-[#374151] rounded focus:ring-[#3B82F6]"
                                    />
                                  </div>
                                  
                                  <div className="flex-grow">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h5 className="font-medium text-white">{result.page_name}</h5>
                                        <p className="text-sm text-gray-400 mt-1">
                                          {result.import_ready.service_type} • {result.import_ready.city}
                                        </p>
                                        
                                        {result.ad_creative_body && (
                                          <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                            "{result.ad_creative_body}"
                                          </p>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {result.signals.map((signal, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#374151] text-gray-300"
                                            >
                                              {signal}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="flex-shrink-0 ml-4">
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-[#EAB308]">
                                            {result.quality_score}
                                          </div>
                                          <div className="text-xs text-gray-400">Score</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Results */}
                      {hasSearched && results.length === 0 && !isSearching && (
                        <div className="mt-6 text-center py-8">
                          <p className="text-gray-400">No advertisers found. Try different keywords or location.</p>
                        </div>
                      )}

                      {/* Info Box */}
                      <div className="mt-6 p-4 bg-[#3B82F6]/10 rounded-lg">
                        <h4 className="text-sm font-medium text-[#60A5FA]">💡 Pro Tip</h4>
                        <p className="mt-1 text-sm text-gray-300">
                          This searches Facebook's public Ad Library for businesses actively running ads. 
                          Higher scores indicate established advertisers who are already investing in marketing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#374151]/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={selectedIds.size === 0}
                    className="inline-flex w-full justify-center rounded-md bg-[#EAB308] px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-[#D97706] sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import {selectedIds.size} Selected
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-[#1F2937] px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-[#374151] hover:bg-[#374151] sm:mt-0 sm:w-auto"
                  >
                    Cancel
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