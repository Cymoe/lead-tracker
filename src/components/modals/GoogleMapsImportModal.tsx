import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useLeadStore } from '@/lib/store';
import { saveLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import USCityAutocomplete from '../USCityAutocomplete';
import ServiceTypeDropdown from '../ServiceTypeDropdown';

interface GoogleMapsImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opportunity_score: number;
  quality_signals: string[];
  import_ready: {
    company_name: string;
    address: string;
    phone: string;
    website: string;
    service_type: string;
    source: string;
    notes: string;
  };
}

export default function GoogleMapsImportModal({ open, onClose }: GoogleMapsImportModalProps) {
  const { addLead, leads } = useLeadStore();
  const [serviceType, setServiceType] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(10); // km
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  const handleSearch = async () => {
    if (!serviceType || !city) {
      toast.error('Please select a service type and city');
      return;
    }

    setIsSearching(true);
    setApiKeyError(false);
    setHasSearched(true);

    try {
      const response = await fetch('/api/google-maps-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          city,
          radius: radius * 1000 // Convert to meters
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
      
      // Auto-select high opportunity leads
      const highOpportunityIds = new Set<string>(
        data.results
          .filter((r: PlaceResult) => r.opportunity_score >= 80)
          .map((r: PlaceResult) => r.place_id)
      );
      setSelectedIds(highOpportunityIds);

      toast.success(`Found ${data.results.length} businesses!`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (placeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId);
    } else {
      newSelected.add(placeId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(results.map(r => r.place_id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    const selectedResults = results.filter(r => selectedIds.has(r.place_id));
    
    if (selectedResults.length === 0) {
      toast.error('Please select at least one business to import');
      return;
    }

    let successCount = 0;
    const toastId = toast.loading(`Importing ${selectedResults.length} leads...`);

    for (const result of selectedResults) {
      // Check for duplicates
      const isDuplicate = leads.some(
        existing => 
          existing.company_name.toLowerCase() === result.import_ready.company_name.toLowerCase() &&
          existing.city?.toLowerCase() === city.toLowerCase()
      );

      if (!isDuplicate) {
        const newLead: Lead = {
          id: crypto.randomUUID(),
          user_id: '', // Will be set by the API
          company_name: result.import_ready.company_name,
          service_type: result.import_ready.service_type,
          city: city,
          phone: result.import_ready.phone,
          website: result.import_ready.website,
          lead_source: 'Google Maps',
          running_ads: false,
          notes: result.import_ready.notes,
          score: result.opportunity_score >= 90 ? 'A++' : 
                 result.opportunity_score >= 80 ? 'A+' : 
                 result.opportunity_score >= 70 ? 'A' : 
                 result.opportunity_score >= 60 ? 'B' : 'C',
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
    setServiceType('');
    setCity('');
    setResults([]);
    setSelectedIds(new Set());
    setHasSearched(false);
    setApiKeyError(false);
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
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-white">
                        <MapPinIcon className="inline-block h-6 w-6 mr-2 text-[#3B82F6]" />
                        Google Maps Business Search
                      </Dialog.Title>

                      {/* Search Form */}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-300">
                            Service Type
                          </label>
                          <ServiceTypeDropdown
                            value={serviceType}
                            onChange={setServiceType}
                            placeholder="e.g., HVAC, Plumbing, Landscaping..."
                            className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            City
                          </label>
                          <USCityAutocomplete
                            value={city}
                            onChange={setCity}
                            placeholder="e.g., Phoenix, AZ"
                            className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            Radius (km)
                          </label>
                          <select
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                          >
                            <option value={5}>5 km</option>
                            <option value={10}>10 km</option>
                            <option value={25}>25 km</option>
                            <option value={50}>50 km</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={handleSearch}
                          disabled={isSearching || !serviceType || !city}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#EAB308] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                          {isSearching ? 'Searching...' : 'Search Google Maps'}
                        </button>
                      </div>

                      {/* API Key Error */}
                      {apiKeyError && (
                        <div className="mt-4 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg">
                          <h4 className="text-sm font-medium text-[#EF4444]">Google Maps API Key Required</h4>
                          <p className="mt-1 text-sm text-gray-300">
                            To use this feature, add your Google Maps API key to your .env.local file:
                          </p>
                          <pre className="mt-2 p-2 bg-[#111827] rounded text-xs text-gray-400">
                            GOOGLE_MAPS_API_KEY=your_api_key_here
                          </pre>
                          <a
                            href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-[#60A5FA] hover:text-[#93BBFC]"
                          >
                            Get an API key →
                          </a>
                        </div>
                      )}

                      {/* Results */}
                      {results.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-300">
                              Found {results.length} businesses ({selectedIds.size} selected)
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
                                key={result.place_id}
                                className={`p-4 border-b border-[#374151] last:border-b-0 cursor-pointer transition-colors ${
                                  selectedIds.has(result.place_id) 
                                    ? 'bg-[#3B82F6]/10' 
                                    : 'hover:bg-[#374151]/50'
                                }`}
                                onClick={() => toggleSelection(result.place_id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(result.place_id)}
                                      onChange={() => {}}
                                      className="h-4 w-4 text-[#3B82F6] border-[#374151] rounded focus:ring-[#3B82F6]"
                                    />
                                  </div>
                                  
                                  <div className="flex-grow">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h5 className="font-medium text-white">{result.name}</h5>
                                        <p className="text-sm text-gray-400 mt-1">{result.formatted_address}</p>
                                        
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                          {result.formatted_phone_number && (
                                            <span className="text-gray-300">📞 {result.formatted_phone_number}</span>
                                          )}
                                          {result.rating && (
                                            <span className="text-gray-300">
                                              ⭐ {result.rating} ({result.user_ratings_total} reviews)
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {result.quality_signals.map((signal, idx) => (
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
                                            {result.opportunity_score}
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
                          <p className="text-gray-400">No businesses found. Try a different search.</p>
                        </div>
                      )}
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