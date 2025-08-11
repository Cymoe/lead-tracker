import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useLeadStore } from '@/lib/store';
import { mergeLeadData } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import { trackImportMetrics } from '@/lib/market-coverage-api';
import { updateMarketCoverageFromLeads } from '@/lib/update-market-coverage';
import USCityAutocomplete from '../USCityAutocomplete';
import ServiceTypeDropdown from '../ServiceTypeDropdown';
import { useRefreshLeads } from '@/hooks/useLeadsQuery';
import { safeJsonParse } from '@/utils/safe-json-parse';

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
  // Apify-specific enriched data
  emails?: string[];
  social_media?: {
    instagram: string[];
    facebook: string[];
    linkedin: string[];
    twitter: string[];
  };
  reviews?: any[];
  images?: any[];
}

interface CostEstimate {
  total_cost: number;
  breakdown: Record<string, number>;
  cost_per_lead: number;
}

export default function GoogleMapsImportModal({ open, onClose }: GoogleMapsImportModalProps) {
  const { addLead, leads, updateLead, addImportStatus, updateImportStatus } = useLeadStore();
  const refreshLeads = useRefreshLeads();
  const isMountedRef = useRef(true);
  const [serviceType, setServiceType] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(10); // km
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [searchMode, setSearchMode] = useState<'standard' | 'apify'>('apify');
  const [maxResults, setMaxResults] = useState(100); // Default to reasonable number
  const [includeReviews, setIncludeReviews] = useState(false);
  const [includeContacts, setIncludeContacts] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [showApifyImport, setShowApifyImport] = useState(false);
  const [apifyRunId, setApifyRunId] = useState('');
  const [isImportingApify, setIsImportingApify] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    status: string;
    details?: string;
  }>({ status: '' });
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [hideNonContractors, setHideNonContractors] = useState(false);
  const [autoSelectContractors, setAutoSelectContractors] = useState(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Check URL parameters when modal opens
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlServiceType = params.get('service_type');
      const urlMarketName = params.get('market_name');
      
      if (urlServiceType) {
        setServiceType(urlServiceType);
      }
      
      if (urlMarketName) {
        setCity(urlMarketName);
      }
    }
  }, [open]);

  // Keywords that indicate equipment/supply businesses (not contractors)
  const nonContractorKeywords = [
    'equipment', 'dealer', 'supply', 'supplies', 'rental', 'rentals', 'store',
    'wholesale', 'distributor', 'manufacturer', 'sales', 'retail', 'shop',
    'depot', 'warehouse', 'showroom', 'mart', 'outlet', 'superstore'
  ];

  // Keywords that indicate actual contractors/installers
  const contractorKeywords = [
    'installation', 'installer', 'contractor', 'service', 'services',
    'landscaping', 'landscape', 'construction', 'builder', 'design',
    'maintenance', 'repair', 'specialist', 'professional', 'custom',
    'residential', 'commercial', 'hardscape', 'paver', 'concrete',
    'artificial', 'synthetic', 'turf installation', 'grass installation'
  ];

  // Function to classify a business
  const classifyBusiness = (result: PlaceResult): 'contractor' | 'supplier' | 'unknown' => {
    const searchText = `${result.name} ${result.import_ready.service_type} ${result.import_ready.notes}`.toLowerCase();
    
    // Check for non-contractor keywords
    const hasNonContractorKeyword = nonContractorKeywords.some(keyword => 
      searchText.includes(keyword)
    );
    
    // Check for contractor keywords
    const hasContractorKeyword = contractorKeywords.some(keyword => 
      searchText.includes(keyword)
    );
    
    // If it has non-contractor keywords and no contractor keywords, it's likely a supplier
    if (hasNonContractorKeyword && !hasContractorKeyword) {
      return 'supplier';
    }
    
    // If it has contractor keywords, it's likely a contractor
    if (hasContractorKeyword) {
      return 'contractor';
    }
    
    // If no website and has reviews, likely a contractor
    if (!result.website && result.user_ratings_total && result.user_ratings_total > 5) {
      return 'contractor';
    }
    
    return 'unknown';
  };



  const saveSearchResults = async (searchResults: PlaceResult[], searchParams: any, mode: string, estimate?: CostEstimate | null, searchDuration?: number, apifyRunId?: string) => {
    try {
      const response = await fetch('/api/search-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchType: 'google_maps',
          searchParams,
          results: searchResults,
          searchMode: mode,
          costEstimate: estimate,
          searchDuration,
          apifyRunId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSearchId(data.id);
      }
    } catch (error) {
      console.error('Error saving search results:', error);
    }
  };



  const handleApifyImport = async () => {
    if (!apifyRunId.trim()) {
      toast.error('Please enter an Apify run ID');
      return;
    }
    
    // Validate run ID format
    if (apifyRunId.includes('/')) {
      toast.error('Invalid run ID format. Please enter a run ID like "cj0hg4MwJnfX0Qz2C", not an actor name.');
      return;
    }
    
    if (!serviceType.trim()) {
      toast.error('Please enter the search query from Apify');
      return;
    }
    
    if (!city.trim()) {
      toast.error('Please enter the city');
      return;
    }

    setIsImportingApify(true);
    
    // Add import to global status
    const importId = addImportStatus({
      type: 'apify',
      status: 'connecting',
      message: 'Importing from Apify',
      details: `Run ID: ${apifyRunId.trim()}`,
      metadata: {
        runId: apifyRunId.trim(),
        searchQuery: serviceType.trim(),
        city: city.trim()
      }
    });
    
    setImportProgress({ 
      status: 'Connecting to Apify...', 
      details: 'Fetching data from run ID: ' + apifyRunId.trim() 
    });
    
    try {
      // Add a small delay to ensure user sees the initial status
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateImportStatus(importId, {
        status: 'processing',
        message: 'Processing leads from Apify',
        details: `${serviceType.trim()} in ${city.trim()}`
      });
      
      setImportProgress({ 
        status: 'Processing leads...', 
        details: 'Importing data for ' + serviceType.trim() + ' in ' + city.trim() 
      });
      
      // Use the new direct import endpoint
      const response = await fetch('/api/google-maps-import-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          runId: apifyRunId.trim(),
          searchQuery: serviceType.trim(),
          city: city.trim()
        })
      });

      updateImportStatus(importId, {
        status: 'finalizing',
        message: 'Saving leads to database'
      });

      setImportProgress({ 
        status: 'Finalizing import...', 
        details: 'Saving leads to database' 
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Import error:', data);
        throw new Error(data.error || 'Import failed');
      }

      // Debug log to see what we're getting
      console.log('Import API response:', data);

      // Update global status with results
      updateImportStatus(importId, {
        status: 'completed',
        message: 'Import completed successfully',
        completedAt: new Date(),
        result: {
          imported: data.imported || 0,
          skipped: data.skipped || 0,
          failed: data.failed || 0
        }
      });

      // Direct import completed successfully
      toast.success(`Imported ${data.imported} leads successfully!`);
      if (data.skipped > 0) {
        toast(`Skipped ${data.skipped} duplicate leads`, {
          icon: 'ℹ️',
        });
      }
      
      // Reset form and close modal - user can track progress in the indicator
      setApifyRunId('');
      setServiceType('');
      setCity('');
      setShowApifyImport(false);
      
      // Refresh leads to show new data
      await refreshLeads();
      
      onClose(); // Close the modal
      
    } catch (error) {
      console.error('Import error:', error);
      
      // Only update status and show error if component is still mounted
      if (isMountedRef.current) {
        // Update global status with error
        updateImportStatus(importId, {
          status: 'error',
          message: 'Import failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        });
        
        toast.error(error instanceof Error ? error.message : 'Import failed');
      }
    } finally {
      if (isMountedRef.current) {
        setIsImportingApify(false);
        setImportProgress({ status: '' });
      }
    }
  };

  const handleSearch = async () => {
    if (!serviceType || !city) {
      toast.error('Please select a service type and city');
      return;
    }

    setIsSearching(true);
    setApiKeyError(false);
    setHasSearched(true);
    const searchStartTime = Date.now();

    try {
      // For Apify with contact extraction, use the polling approach
      if (searchMode === 'apify' && includeContacts) {
        // Start the Apify run
        const startResponse = await fetch('/api/google-maps-apify-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType,
            city,
            radius: radius * 1000,
            maxResults,
            includeReviews,
            includeContacts,
            includeImages,
            onlyNoWebsite
          })
        });

        const startData = await startResponse.json();

        if (!startResponse.ok) {
          if (startData.setupInstructions) {
            setApiKeyError(true);
          }
          throw new Error(startData.error || 'Failed to start search');
        }

        const { runId, actorId } = startData;
        toast.loading('Extracting contacts from websites...', { id: 'apify-search' });

        // Poll for results
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes max
        let searchComplete = false;

        while (!searchComplete && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          
          const statusResponse = await fetch(`/api/google-maps-apify-status?runId=${runId}&actorId=${actorId}`);
          const statusData = await statusResponse.json();

          if (statusData.status === 'SUCCEEDED') {
            searchComplete = true;
            setResults(statusData.results);
            
            // Auto-select high opportunity leads
            const highOpportunityIds = new Set<string>(
              statusData.results
                .filter((r: PlaceResult) => r.opportunity_score >= 80)
                .map((r: PlaceResult) => r.place_id)
            );
            setSelectedIds(highOpportunityIds);

            if (statusData.cost_estimate) {
              setCostEstimate(statusData.cost_estimate);
            }

            toast.dismiss('apify-search');
            toast.success(`Found ${statusData.results.length} businesses with contact extraction!`);
            
            // Save search results with duration and run ID
            const searchDuration = Math.round((Date.now() - searchStartTime) / 1000);
            await saveSearchResults(
              statusData.results,
              { serviceType, city, radius: radius * 1000, maxResults, includeReviews, includeContacts, includeImages, onlyNoWebsite },
              'apify',
              statusData.cost_estimate,
              searchDuration,
              runId
            );
          } else if (statusData.status === 'FAILED' || statusData.status === 'ABORTED') {
            searchComplete = true;
            toast.dismiss('apify-search');
            throw new Error(statusData.error || 'Search failed');
          } else {
            // Update loading message
            attempts++;
            const elapsed = attempts * 5;
            toast.loading(`Extracting contacts (${elapsed}s elapsed)...`, { id: 'apify-search' });
          }
        }

        if (!searchComplete) {
          toast.dismiss('apify-search');
          throw new Error('Search timed out. Please try with fewer results.');
        }
      } else {
        // Use the standard approach for regular searches
        const endpoint = searchMode === 'apify' ? '/api/google-maps-apify' : '/api/google-maps-search';
        const payload = searchMode === 'apify' 
          ? {
              serviceType,
              city,
              radius: radius * 1000,
              maxResults,
              includeReviews,
              includeContacts,
              includeImages,
              onlyNoWebsite
            }
          : {
              serviceType,
              city,
              radius: radius * 1000
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.setupInstructions) {
            setApiKeyError(true);
          }
          // Provide more detailed error information
          const errorMessage = data.error || 'Search failed';
          const errorDetails = data.details ? `\n\nDetails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : '';
          
          console.error('Search error:', {
            error: errorMessage,
            details: data.details,
            input: data.input,
            status: response.status
          });
          
          throw new Error(errorMessage + errorDetails);
        }

        setResults(data.results);
        
        // Auto-select based on preferences
        if (autoSelectContractors) {
          const selectedIds = new Set<string>(
            data.results
              .filter((r: PlaceResult) => {
                const businessType = classifyBusiness(r);
                // Select contractors and unknowns with high opportunity score
                return businessType === 'contractor' || 
                       (businessType === 'unknown' && r.opportunity_score >= 80);
              })
              .map((r: PlaceResult) => r.place_id)
          );
          setSelectedIds(selectedIds);
        } else {
          // Original logic - select high opportunity leads
          const highOpportunityIds = new Set<string>(
            data.results
              .filter((r: PlaceResult) => r.opportunity_score >= 80)
              .map((r: PlaceResult) => r.place_id)
          );
          setSelectedIds(highOpportunityIds);
        }

        // Set cost estimate if using Apify
        if (searchMode === 'apify' && data.cost_estimate) {
          setCostEstimate(data.cost_estimate);
        }

        toast.success(`Found ${data.results.length} businesses!`);
        
        // Save search results
        await saveSearchResults(
          data.results,
          searchMode === 'apify' 
            ? { serviceType, city, radius: radius * 1000, maxResults, includeReviews, includeContacts, includeImages, onlyNoWebsite }
            : { serviceType, city, radius: radius * 1000 },
          searchMode,
          data.cost_estimate
        );
      }
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
    // This is for the normal search flow, not the Apify import
    const selectedResults = results.filter(r => selectedIds.has(r.place_id));
    
    if (selectedResults.length === 0) {
      toast.error('Please select at least one business to import');
      return;
    }

    toast.error('Please use the "Import from Apify" option to import leads');
  };
  
  const handleUndo = async () => {
    // TODO: Implement undo functionality
    // const { undoLastImport } = useLeadStore.getState();
    // const result = await undoLastImport();
    // 
    // if (result.success) {
    //   toast.success(`Undone! Removed ${result.deletedCount} leads.`);
    // } else {
    //   toast.error('Failed to undo import');
    // }
    toast.error('Undo functionality not yet implemented');
  };

  const handleResetAllImports = async () => {
    try {
      const response = await fetch('/api/reset-all-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'All imports have been reset');
      } else {
        toast.error('Failed to reset imports');
      }
    } catch (error) {
      toast.error('Failed to reset imports');
    }
  };

  const resetModal = () => {
    setServiceType('');
    setCity('');
    setResults([]);
    setSelectedIds(new Set());
    setHasSearched(false);
    setApiKeyError(false);
    setSearchMode('standard');
    setCostEstimate(null);
    setShowApifyImport(false);
    setApifyRunId('');
    setRadius(10);
    setMaxResults(100);
    setIncludeReviews(false);
    setIncludeContacts(false);
    setIncludeImages(false);
    setOnlyNoWebsite(false);
    setCurrentSearchId(null);
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#1F2937] text-left shadow-xl transition-all sm:my-4 sm:w-full sm:max-w-3xl">
                <div className="bg-[#1F2937] px-3 pb-3 pt-3 sm:p-4">
                  <div className="absolute right-0 top-0 pr-3 pt-3">
                    <button
                      type="button"
                      className="rounded-md bg-[#1F2937] text-gray-400 hover:text-gray-300"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mt-2 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-5 text-white">
                        <MapPinIcon className="inline-block h-5 w-5 mr-1.5 text-[#3B82F6]" />
                        Google Maps Business Search
                      </Dialog.Title>


                      {/* Import from Apify Button */}
                      {!hasSearched && (
                        <div className="mt-2">
                          <button
                            onClick={() => setShowApifyImport(!showApifyImport)}
                            className="inline-flex items-center px-2 py-1 border border-[#374151] text-xs font-medium rounded text-gray-300 bg-[#111827] hover:bg-[#1F2937]"
                          >
                            <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Import from Apify
                          </button>
                        </div>
                      )}


                      {/* Import from Apify Form */}
                      {showApifyImport && (
                        <div className="mt-2 bg-[#111827] rounded p-3">
                          <h4 className="text-xs font-medium text-gray-300 mb-2">Import from Apify Run</h4>
                          <p className="text-xs text-gray-400 mb-2">
                            Enter the run ID from your Apify Google Maps Scraper run (e.g., cj0hg4MwJnfX0Qz2C)
                          </p>
                          
                          {/* Run ID */}
                          <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Apify Run ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={apifyRunId}
                              onChange={(e) => setApifyRunId(e.target.value)}
                              placeholder="e.g., cj0hg4MwJnfX0Qz2C"
                              className={`w-full rounded bg-[#1F2937] border ${
                                apifyRunId && apifyRunId.includes('/') 
                                  ? 'border-red-500' 
                                  : 'border-[#374151]'
                              } text-white text-xs px-2 py-1.5`}
                              disabled={isImportingApify}
                            />
                            {apifyRunId && apifyRunId.includes('/') && (
                              <div className="mt-1 text-xs text-red-500">
                                ⚠️ This looks like an actor name, not a run ID. 
                                Please go to your <a 
                                  href="https://console.apify.com/actors/runs" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline hover:text-red-400"
                                >
                                  Apify console
                                </a> and copy the run ID from a completed run.
                              </div>
                            )}
                          </div>
                          
                          {/* Search Query */}
                          <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Search Query <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={serviceType}
                              onChange={(e) => setServiceType(e.target.value)}
                              placeholder="e.g., Lawn care in Phoenix, AZ"
                              className="w-full rounded bg-[#1F2937] border-[#374151] text-white text-xs px-2 py-1.5"
                              disabled={isImportingApify}
                            />
                            <p className="text-xs text-gray-500 mt-0.5">
                              Copy this from searchStringsArray in your Apify input
                            </p>
                          </div>
                          
                          {/* City */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              City <span className="text-red-500">*</span>
                            </label>
                            <USCityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder="e.g., Phoenix, AZ"
                              className="w-full rounded bg-[#1F2937] border-[#374151] text-white text-xs"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">
                              Enter the city and state
                            </p>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button
                              onClick={handleApifyImport}
                              disabled={isImportingApify || !apifyRunId.trim() || !serviceType.trim() || !city.trim() || apifyRunId.includes('/')}
                              className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs rounded hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isImportingApify ? 'Importing...' : 'Import'}
                            </button>
                            <button
                              onClick={() => {
                                setShowApifyImport(false);
                                setApifyRunId('');
                                setServiceType('');
                                setCity('');
                              }}
                              className="px-3 py-1.5 bg-[#374151] text-gray-300 text-xs rounded hover:bg-[#4B5563]"
                            >
                              Cancel
                            </button>
                          </div>
                          
                          {/* Help text */}
                          <div className="mt-3 p-2 bg-[#1F2937] rounded text-xs text-gray-400">
                            <p className="font-medium text-[#60A5FA] mb-1">📍 How to get your Run ID:</p>
                            <ol className="space-y-0.5 ml-3">
                              <li>1. Go to <a href="https://console.apify.com/actors/runs" target="_blank" rel="noopener noreferrer" className="text-[#60A5FA] hover:underline">Apify Console → Runs</a></li>
                              <li>2. Find your Google Maps Scraper run</li>
                              <li>3. Click on the run to open it</li>
                              <li>4. Copy the Run ID from the URL or run details</li>
                              <li>5. It should look like: <code className="bg-[#374151] px-1 rounded">cj0hg4MwJnfX0Qz2C</code></li>
                            </ol>
                          </div>
                        </div>
                      )}

                      {/* Import Progress Overlay */}
                      {isImportingApify && importProgress.status && (
                        <div className="mt-2 bg-[#1F2937] rounded p-4 border border-[#3B82F6]/30">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{importProgress.status}</p>
                              {importProgress.details && (
                                <p className="text-xs text-gray-400 mt-0.5">{importProgress.details}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 bg-[#111827] rounded p-2">
                            <p className="text-xs text-gray-400">
                              This may take a few moments depending on the number of leads...
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Search Form */}
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-300">
                            Service Type
                          </label>
                          <ServiceTypeDropdown
                            value={serviceType}
                            onChange={setServiceType}
                            placeholder="Search SMB acquisition targets..."
                            className="mt-0.5 block w-full rounded bg-[#111827] border-[#374151] text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-300">
                            City
                          </label>
                          <USCityAutocomplete
                            value={city}
                            onChange={setCity}
                            placeholder="e.g., Phoenix, AZ"
                            className="mt-0.5 block w-full rounded bg-[#111827] border-[#374151] text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-300">
                            Radius (km)
                          </label>
                          <select
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="mt-0.5 block w-full rounded bg-[#111827] border-[#374151] text-white text-xs py-1.5"
                          >
                            <option value={5}>5 km</option>
                            <option value={10}>10 km</option>
                            <option value={25}>25 km</option>
                            <option value={50}>50 km</option>
                          </select>
                        </div>
                      </div>

                      {/* Apify Options */}
                      {searchMode === 'apify' && (
                        <div className="mt-2 bg-[#374151]/30 rounded p-2.5 space-y-2">
                          <h4 className="text-xs font-medium text-[#60A5FA]">Enhanced Options</h4>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-300">
                                Maximum Results
                              </label>
                              <input
                                type="number"
                                value={maxResults}
                                onChange={(e) => setMaxResults(Number(e.target.value))}
                                min="10"
                                max="9999"
                                placeholder="Leave empty for ALL results"
                                className="mt-0.5 block w-full rounded bg-[#111827] border-[#374151] text-white text-xs py-1"
                              />
                              <p className="mt-0.5 text-xs text-gray-400">
                                Leave empty or set to 9999 to get ALL businesses in the area
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={onlyNoWebsite}
                                  onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                                  className="mr-1.5 text-[#3B82F6] focus:ring-[#3B82F6] h-3 w-3"
                                />
                                <span className="text-xs text-gray-300">Filter: Only show businesses without websites</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeContacts}
                                onChange={(e) => setIncludeContacts(e.target.checked)}
                                className="mr-1.5 text-[#3B82F6] focus:ring-[#3B82F6] h-3 w-3"
                              />
                              <span className="text-xs text-gray-300">📧 Extract contact emails & social media (+$2/1000)</span>
                            </label>
                            {includeContacts && (
                              <p className="ml-5 text-xs text-[#FCD34D] mt-0.5">
                                ⚠️ Contact extraction visits each website and may take 5-10 minutes
                              </p>
                            )}
                            
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeReviews}
                                onChange={(e) => setIncludeReviews(e.target.checked)}
                                className="mr-1.5 text-[#3B82F6] focus:ring-[#3B82F6] h-3 w-3"
                              />
                              <span className="text-xs text-gray-300">⭐ Include reviews (+$0.50/1000 reviews)</span>
                            </label>
                            
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeImages}
                                onChange={(e) => setIncludeImages(e.target.checked)}
                                className="mr-1.5 text-[#3B82F6] focus:ring-[#3B82F6] h-3 w-3"
                              />
                              <span className="text-xs text-gray-300">📸 Include images (+$0.50/1000 images)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="mt-2">
                        <button
                          onClick={handleSearch}
                          disabled={isSearching || !serviceType || !city}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-black bg-[#EAB308] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" />
                          {isSearching ? 
                            (includeContacts ? 'Extracting contacts...' : 'Running Apify...') : 
                            'Search with Apify'
                          }
                        </button>
                      </div>

                      {/* API Key Error */}
                      {apiKeyError && (
                        <div className="mt-2 p-2 bg-[#EF4444]/10 border border-[#EF4444] rounded">
                          <h4 className="text-xs font-medium text-[#EF4444]">Google Maps API Key Required</h4>
                          <p className="mt-0.5 text-xs text-gray-300">
                            To use this feature, add your Google Maps API key to your .env.local file:
                          </p>
                          <pre className="mt-1 p-1 bg-[#111827] rounded text-xs text-gray-400">
                            GOOGLE_MAPS_API_KEY=your_api_key_here
                          </pre>
                          <a
                            href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-[#60A5FA] hover:text-[#93BBFC]"
                          >
                            Get an API key →
                          </a>
                        </div>
                      )}

                      {/* Results */}
                      {results.length > 0 && (
                        <div className="space-y-2">
                                      <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Found {results.length} businesses
                </h3>
                <p className="text-xs text-gray-400">
                  Comprehensive search with enriched data from Apify.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={selectAll}
                    className="text-xs text-[#60A5FA] hover:text-[#93BBFC]"
                  >
                    Select All
                  </button>
                  <span className="text-gray-500">|</span>
                  <button
                    onClick={() => {
                      const contractorIds = new Set(
                        results
                          .filter(r => classifyBusiness(r) === 'contractor')
                          .map(r => r.place_id)
                      );
                      setSelectedIds(contractorIds);
                    }}
                    className="text-sm text-[#10B981] hover:text-[#34D399]"
                  >
                    Contractors Only
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
            </div>

            {/* Filter Controls */}
            <div className="mt-4 p-3 bg-[#374151]/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideNonContractors}
                      onChange={(e) => setHideNonContractors(e.target.checked)}
                      className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                    />
                    <span className="text-sm text-gray-300">Hide equipment dealers & suppliers</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSelectContractors}
                      onChange={(e) => setAutoSelectContractors(e.target.checked)}
                      className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                    />
                    <span className="text-sm text-gray-300">Auto-select contractors only</span>
                  </label>
                </div>
                <div className="text-xs text-gray-400">
                  {(() => {
                    const contractors = results.filter(r => classifyBusiness(r) === 'contractor').length;
                    const suppliers = results.filter(r => classifyBusiness(r) === 'supplier').length;
                    const unknown = results.filter(r => classifyBusiness(r) === 'unknown').length;
                    return `${contractors} contractors, ${suppliers} suppliers, ${unknown} unknown`;
                  })()}
                </div>
              </div>
            </div>

                          <div className="max-h-64 overflow-y-auto border border-[#374151] rounded">
                            {results
                              .filter((result) => {
                                // Apply filter if hideNonContractors is true
                                if (hideNonContractors) {
                                  const businessType = classifyBusiness(result);
                                  return businessType !== 'supplier';
                                }
                                return true;
                              })
                              .map((result) => {
                              // Check if this lead already exists
                              const isDuplicate = leads.some(
                                existing => 
                                  existing.company_name.toLowerCase() === result.name.toLowerCase() &&
                                  existing.city?.toLowerCase() === city.toLowerCase()
                              );
                              
                              const businessType = classifyBusiness(result);
                              
                              return (
                                <div
                                  key={result.place_id}
                                  className={`p-2 border-b border-[#374151] last:border-b-0 cursor-pointer transition-colors ${
                                    selectedIds.has(result.place_id) 
                                      ? 'bg-[#3B82F6]/10' 
                                      : isDuplicate
                                      ? 'bg-[#374151]/20'
                                      : 'hover:bg-[#374151]/50'
                                  }`}
                                  onClick={() => !isDuplicate && toggleSelection(result.place_id)}
                                >
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(result.place_id)}
                                      onChange={() => {}}
                                      disabled={isDuplicate}
                                      className="h-3 w-3 text-[#3B82F6] border-[#374151] rounded focus:ring-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                  </div>
                                  
                                  <div className="flex-grow">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <h5 className="text-xs font-medium text-white">{result.name}</h5>
                                          {businessType === 'supplier' && (
                                            <span className="text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded">
                                              Supplier
                                            </span>
                                          )}
                                          {businessType === 'contractor' && (
                                            <span className="text-xs bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded">
                                              Contractor
                                            </span>
                                          )}
                                          {isDuplicate && (
                                            <span className="text-xs bg-[#EF4444]/20 text-[#EF4444] px-1.5 py-0.5 rounded">
                                              Already imported
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{result.formatted_address}</p>
                                        
                                        <div className="flex items-center gap-3 mt-1 text-xs">
                                          {result.formatted_phone_number && (
                                            <span className="text-gray-300">📞 {result.formatted_phone_number}</span>
                                          )}
                                          {result.rating && (
                                            <span className="text-gray-300">
                                              ⭐ {result.rating} ({result.user_ratings_total} reviews)
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {result.quality_signals.map((signal, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[#374151] text-gray-300"
                                            >
                                              {signal}
                                            </span>
                                          ))}
                                        </div>
                                        
                                        {/* Display enriched data if available */}
                                        {result.emails && result.emails.length > 0 && (
                                          <p className="text-xs text-[#10B981] mt-0.5">✉️ {result.emails[0]}</p>
                                        )}
                                        {result.social_media && Object.values(result.social_media).some(arr => arr.length > 0) && (
                                          <div className="flex gap-2 mt-1">
                                            {result.social_media.facebook?.length > 0 && <span className="text-xs">📘</span>}
                                            {result.social_media.instagram?.length > 0 && <span className="text-xs">📷</span>}
                                            {result.social_media.linkedin?.length > 0 && <span className="text-xs">💼</span>}
                                          </div>
                                        )}
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
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No Results */}
                      {hasSearched && results.length === 0 && !isSearching && (
                        <div className="mt-6 text-center py-8">
                          <p className="text-gray-400">No businesses found. Try a different search.</p>
                        </div>
                      )}

                      {/* Cost Estimate for Apify */}
                      {searchMode === 'apify' && costEstimate && results.length > 0 && (
                        <div className="bg-[#3B82F6]/10 border border-[#3B82F6] rounded-lg p-4 mt-4">
                          <h4 className="text-sm font-medium text-[#60A5FA]">💰 Cost Breakdown</h4>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Total places scraped:</span>
                              <span className="text-white">{results.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Cost per lead:</span>
                              <span className="text-white">${costEstimate.cost_per_lead.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t border-[#374151] pt-1 mt-1">
                              <span className="text-gray-300">Total cost:</span>
                              <span className="text-[#10B981]">${costEstimate.total_cost.toFixed(3)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Search Tips */}
                      <div className="bg-[#374151]/50 rounded p-2 space-y-1 mt-3">
                        <h4 className="text-xs font-medium text-[#60A5FA]">💡 Apify Tips:</h4>
                        <ul className="text-xs text-gray-300 space-y-0.5">
                          <li>• Apify can find ALL businesses in an area, not just 60</li>
                          <li>• Contact enrichment finds emails from business websites</li>
                          <li>• Reviews help identify businesses needing reputation help</li>
                          <li>• Leave filter unchecked to see ALL businesses (with and without websites)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#374151]/50 px-3 py-2 sm:flex sm:flex-row-reverse sm:px-4">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={selectedIds.size === 0}
                    className="inline-flex w-full justify-center rounded bg-[#EAB308] px-2.5 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-[#D97706] sm:ml-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import {selectedIds.size} Selected
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 inline-flex w-full justify-center rounded bg-[#1F2937] px-2.5 py-1.5 text-xs font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-[#374151] hover:bg-[#374151] sm:mt-0 sm:w-auto"
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