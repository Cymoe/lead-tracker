import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useLeadStore } from '@/lib/store';
import { saveLead, mergeLeadData } from '@/lib/api';
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
  const { addLead, leads, updateLead } = useLeadStore();
  const [serviceType, setServiceType] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(10); // km
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [searchMode, setSearchMode] = useState<'standard' | 'apify'>('standard');
  const [maxResults, setMaxResults] = useState(100); // Default to reasonable number
  const [includeReviews, setIncludeReviews] = useState(false);
  const [includeContacts, setIncludeContacts] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [previousSearches, setPreviousSearches] = useState<any[]>([]);
  const [showPreviousSearches, setShowPreviousSearches] = useState(false);
  const [isLoadingPreviousSearches, setIsLoadingPreviousSearches] = useState(false);
  const [showApifyImport, setShowApifyImport] = useState(false);
  const [apifyRunId, setApifyRunId] = useState('');
  const [isImportingApify, setIsImportingApify] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [hideNonContractors, setHideNonContractors] = useState(false);
  const [autoSelectContractors, setAutoSelectContractors] = useState(true);

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

  // Load previous searches when modal opens
  useEffect(() => {
    if (open) {
      loadPreviousSearches();
    }
  }, [open]);

  const loadPreviousSearches = async () => {
    setIsLoadingPreviousSearches(true);
    try {
      const response = await fetch('/api/search-results?searchType=google_maps&limit=10');
      const data = await response.json();
      if (response.ok) {
        setPreviousSearches(data.results || []);
      }
    } catch (error) {
      console.error('Error loading previous searches:', error);
    } finally {
      setIsLoadingPreviousSearches(false);
    }
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
        // Reload previous searches to include the new one
        loadPreviousSearches();
      }
    } catch (error) {
      console.error('Error saving search results:', error);
    }
  };

  const loadSavedSearch = (savedSearch: any) => {
    // Load the search parameters
    setServiceType(savedSearch.search_params.serviceType || '');
    setCity(savedSearch.search_params.city || '');
    setRadius(savedSearch.search_params.radius ? savedSearch.search_params.radius / 1000 : 10);
    setSearchMode(savedSearch.search_mode || 'standard');
    
    // Load the results
    setResults(savedSearch.results);
    setCostEstimate(savedSearch.cost_estimate);
    setHasSearched(true);
    setShowPreviousSearches(false);
    
    // Auto-select high opportunity leads
    const highOpportunityIds = new Set<string>(
      savedSearch.results
        .filter((r: PlaceResult) => r.opportunity_score >= 80)
        .map((r: PlaceResult) => r.place_id)
    );
    setSelectedIds(highOpportunityIds);
    
    toast.success('Previous search loaded!');
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/search-results?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPreviousSearches(prev => prev.filter(s => s.id !== id));
        toast.success('Search deleted');
      }
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleApifyImport = async () => {
    if (!apifyRunId.trim()) {
      toast.error('Please enter an Apify run ID');
      return;
    }

    setIsImportingApify(true);
    try {
      const response = await fetch('/api/apify-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: apifyRunId.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.setupInstructions) {
          setApiKeyError(true);
        }
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.results);
      setHasSearched(true);
      setShowApifyImport(false);
      
      // Auto-select based on preferences
      if (autoSelectContractors) {
        const selectedIds = new Set<string>(
          data.results
            .filter((r: PlaceResult) => {
              const businessType = classifyBusiness(r);
              return businessType === 'contractor' || 
                     (businessType === 'unknown' && r.opportunity_score >= 80);
            })
            .map((r: PlaceResult) => r.place_id)
        );
        setSelectedIds(selectedIds);
      } else {
        const highOpportunityIds = new Set<string>(
          data.results
            .filter((r: PlaceResult) => r.opportunity_score >= 80)
            .map((r: PlaceResult) => r.place_id)
        );
        setSelectedIds(highOpportunityIds);
      }

      toast.success(`Imported ${data.count} businesses from Apify!`);
      
      // Reload previous searches to include the imported one
      if (data.savedSearchId) {
        loadPreviousSearches();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImportingApify(false);
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
    const selectedResults = results.filter(r => selectedIds.has(r.place_id));
    
    if (selectedResults.length === 0) {
      toast.error('Please select at least one business to import');
      return;
    }

    let successCount = 0;
    const importedLeadIds: string[] = [];
    const toastId = toast.loading(`Importing ${selectedResults.length} leads...`);

    for (const result of selectedResults) {
      // Use city from search form
      const leadCity = city;
      
      // Extract Instagram handle if available
      let instagramHandle = null;
      let instagramUrl = null;
      
      if (result.social_media?.instagram && result.social_media.instagram.length > 0) {
        instagramUrl = result.social_media.instagram[0];
        // Extract handle from Instagram URL (e.g., https://www.instagram.com/username/ -> @username)
        const match = instagramUrl.match(/instagram\.com\/([^\/\?]+)/);
        if (match) {
          instagramHandle = `@${match[1]}`;
        }
      }
      
      // Check for duplicates
      const existingLead = leads.find(
        existing => 
          existing.company_name.toLowerCase() === result.import_ready.company_name.toLowerCase() &&
          existing.city?.toLowerCase() === leadCity.toLowerCase()
      );

      if (existingLead) {
        // Merge data instead of skipping
        try {
          const mergedLead = await mergeLeadData(existingLead, {
            company_name: result.import_ready.company_name,
            service_type: result.import_ready.service_type,
            city: leadCity,
            phone: result.import_ready.phone,
            website: result.import_ready.website,
            google_maps_url: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
            address: result.formatted_address || null,
            rating: result.rating,
            review_count: result.user_ratings_total,
            lead_source: 'Google Maps',
            notes: result.import_ready.notes,
            instagram_url: instagramUrl,
            handle: instagramHandle,
          });

          if (mergedLead) {
            updateLead(mergedLead);
            successCount++;
            importedLeadIds.push(mergedLead.id);
            toast.success(`Merged data for ${result.name}`);
          }
        } catch (error) {
          console.error('Error merging lead:', error);
          toast.error(`Failed to merge ${result.name}`);
        }
      } else {
        // Create new lead if not duplicate
        const newLead: Lead = {
          id: crypto.randomUUID(),
          user_id: '', // Will be set by the API
          handle: instagramHandle,
          company_name: result.import_ready.company_name,
          service_type: result.import_ready.service_type,
          city: leadCity,
          state: null,
          phone: result.import_ready.phone,
          email: result.emails && result.emails.length > 0 ? result.emails[0] : null,
          instagram_url: instagramUrl,
          website: result.import_ready.website,
          google_maps_url: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
          address: result.formatted_address || null,
          rating: result.rating || null,
          review_count: result.user_ratings_total || null,
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
            importedLeadIds.push(savedLead.id);
          }
        } catch (error) {
          console.error('Error saving lead:', error);
        }
      }
    }

    // Update the search result with imported lead IDs
    if (currentSearchId && importedLeadIds.length > 0) {
      try {
        await fetch('/api/search-results/update-imported', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchResultId: currentSearchId,
            importedLeadIds
          })
        });
      } catch (error) {
        console.error('Error updating imported lead IDs:', error);
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
    setSearchMode('standard');
    setCostEstimate(null);
    setShowPreviousSearches(false);
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

                      {/* Previous Searches Button */}
                      {previousSearches.length > 0 && !hasSearched && (
                        <div className="mt-4">
                          <button
                            onClick={() => setShowPreviousSearches(!showPreviousSearches)}
                            className="inline-flex items-center px-3 py-1.5 border border-[#374151] text-sm font-medium rounded-md text-gray-300 bg-[#111827] hover:bg-[#1F2937]"
                          >
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Previous Searches ({previousSearches.length})
                          </button>
                        </div>
                      )}

                      {/* Import from Apify Button */}
                      {!hasSearched && (
                        <div className="mt-4">
                          <button
                            onClick={() => setShowApifyImport(!showApifyImport)}
                            className="inline-flex items-center px-3 py-1.5 border border-[#374151] text-sm font-medium rounded-md text-gray-300 bg-[#111827] hover:bg-[#1F2937]"
                          >
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Import from Apify
                          </button>
                        </div>
                      )}

                      {/* Previous Searches List */}
                      {showPreviousSearches && (
                        <div className="mt-4 bg-[#111827] rounded-lg p-4 max-h-60 overflow-y-auto">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Searches (Last 7 days)</h4>
                          {isLoadingPreviousSearches ? (
                            <p className="text-sm text-gray-400">Loading...</p>
                          ) : (
                            <div className="space-y-3">
                              {previousSearches.map((search) => {
                                const daysAgo = Math.floor((Date.now() - new Date(search.created_at).getTime()) / (1000 * 60 * 60 * 24));
                                const hoursAgo = Math.floor((Date.now() - new Date(search.created_at).getTime()) / (1000 * 60 * 60));
                                const timeAgo = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
                                
                                return (
                                  <div
                                    key={search.id}
                                    className="flex items-center justify-between p-3 bg-[#1F2937] rounded-md hover:bg-[#374151] transition-colors"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm text-white font-medium">
                                        {search.search_params.serviceType} in {search.search_params.city}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {search.result_count} results • {timeAgo}
                                        {search.search_mode === 'apify' && ' • Apify'}
                                        {search.search_duration_seconds && ` • ${search.search_duration_seconds}s`}
                                      </p>
                                      {search.emails_found > 0 && (
                                        <p className="text-xs text-[#10B981] mt-1">
                                          📧 {search.emails_found} emails • 📞 {search.contacts_found} contacts
                                        </p>
                                      )}
                                      {search.high_quality_leads > 0 && (
                                        <p className="text-xs text-[#EAB308] mt-1">
                                          ⭐ {search.high_quality_leads} high-quality leads
                                        </p>
                                      )}
                                      {search.imported_lead_ids?.length > 0 && (
                                        <p className="text-xs text-[#3B82F6] mt-1">
                                          ✓ {search.imported_lead_ids.length} imported
                                        </p>
                                      )}
                                      {search.total_cost && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          💰 ${search.total_cost.toFixed(3)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      <button
                                        onClick={() => loadSavedSearch(search)}
                                        className="text-sm text-[#3B82F6] hover:text-[#60A5FA]"
                                      >
                                        Load
                                      </button>
                                      <button
                                        onClick={() => window.open(`/api/search-results/export?id=${search.id}`, '_blank')}
                                        className="text-sm text-[#10B981] hover:text-[#34D399]"
                                        title="Export to CSV"
                                      >
                                        CSV
                                      </button>
                                      <button
                                        onClick={() => deleteSavedSearch(search.id)}
                                        className="text-sm text-[#EF4444] hover:text-[#F87171]"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Import from Apify Form */}
                      {showApifyImport && (
                        <div className="mt-4 bg-[#111827] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">Import from Apify Run</h4>
                          <p className="text-xs text-gray-400 mb-3">
                            Enter the run ID from your Apify Google Maps Scraper run (e.g., cj0hg4MwJnfX0Qz2C)
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={apifyRunId}
                              onChange={(e) => setApifyRunId(e.target.value)}
                              placeholder="Enter Apify run ID"
                              className="flex-1 rounded-md bg-[#1F2937] border-[#374151] text-white px-3 py-2"
                              disabled={isImportingApify}
                            />
                            <button
                              onClick={handleApifyImport}
                              disabled={isImportingApify || !apifyRunId.trim()}
                              className="px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isImportingApify ? 'Importing...' : 'Import'}
                            </button>
                            <button
                              onClick={() => {
                                setShowApifyImport(false);
                                setApifyRunId('');
                              }}
                              className="px-4 py-2 bg-[#374151] text-gray-300 rounded-md hover:bg-[#4B5563]"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Find the run ID in your Apify console under the run details
                          </p>
                        </div>
                      )}

                      {/* Search Mode Selection */}
                      <div className="mt-4 bg-[#374151]/30 rounded-lg p-4">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="searchMode"
                              value="standard"
                              checked={searchMode === 'standard'}
                              onChange={(e) => setSearchMode(e.target.value as 'standard' | 'apify')}
                              className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                            />
                            <div>
                              <span className="text-white font-medium">Quick Search</span>
                              <span className="text-gray-400 text-sm ml-2">(Free, up to 60 results)</span>
                            </div>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="searchMode"
                              value="apify"
                              checked={searchMode === 'apify'}
                              onChange={(e) => setSearchMode(e.target.value as 'standard' | 'apify')}
                              className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                            />
                            <div>
                              <span className="text-white font-medium">Comprehensive Search</span>
                              <span className="text-gray-400 text-sm ml-2">(Apify, unlimited results + enrichment)</span>
                            </div>
                          </label>
                        </div>
                      </div>

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

                      {/* Apify Options */}
                      {searchMode === 'apify' && (
                        <div className="mt-4 bg-[#374151]/30 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-medium text-[#60A5FA]">Enhanced Options</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300">
                                Maximum Results
                              </label>
                              <input
                                type="number"
                                value={maxResults}
                                onChange={(e) => setMaxResults(Number(e.target.value))}
                                min="10"
                                max="9999"
                                placeholder="Leave empty for ALL results"
                                className="mt-1 block w-full rounded-md bg-[#111827] border-[#374151] text-white"
                              />
                              <p className="mt-1 text-xs text-gray-400">
                                Leave empty or set to 9999 to get ALL businesses in the area
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={onlyNoWebsite}
                                  onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                                  className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                                />
                                <span className="text-sm text-gray-300">Filter: Only show businesses without websites</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeContacts}
                                onChange={(e) => setIncludeContacts(e.target.checked)}
                                className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                              />
                              <span className="text-sm text-gray-300">📧 Extract contact emails & social media (+$2/1000)</span>
                            </label>
                            {includeContacts && (
                              <p className="ml-6 text-xs text-[#FCD34D] mt-1">
                                ⚠️ Contact extraction visits each website and may take 5-10 minutes
                              </p>
                            )}
                            
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeReviews}
                                onChange={(e) => setIncludeReviews(e.target.checked)}
                                className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                              />
                              <span className="text-sm text-gray-300">⭐ Include reviews (+$0.50/1000 reviews)</span>
                            </label>
                            
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeImages}
                                onChange={(e) => setIncludeImages(e.target.checked)}
                                className="mr-2 text-[#3B82F6] focus:ring-[#3B82F6]"
                              />
                              <span className="text-sm text-gray-300">📸 Include images (+$0.50/1000 images)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <button
                          onClick={handleSearch}
                          disabled={isSearching || !serviceType || !city}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#EAB308] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                          {isSearching ? (
                            searchMode === 'apify' ? 
                              (includeContacts ? 'Extracting contacts (this may take a few minutes)...' : 'Running Apify scraper...') : 
                              'Searching...'
                          ) : (
                            searchMode === 'apify' ? 'Search with Apify' : 'Search Google Maps'
                          )}
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
                        <div className="space-y-4">
                                      <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Found {results.length} businesses
                </h3>
                <p className="text-sm text-gray-400">
                  {searchMode === 'standard' ? (
                    <>Google Maps returns up to 60 results per search. 
                    {results.length === 60 && ' Try different search terms or areas to find more.'}</>
                  ) : (
                    <>Comprehensive search with enriched data from Apify.</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-[#60A5FA] hover:text-[#93BBFC]"
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

                          <div className="max-h-96 overflow-y-auto border border-[#374151] rounded-lg">
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
                                  className={`p-4 border-b border-[#374151] last:border-b-0 cursor-pointer transition-colors ${
                                    selectedIds.has(result.place_id) 
                                      ? 'bg-[#3B82F6]/10' 
                                      : isDuplicate
                                      ? 'bg-[#374151]/20'
                                      : 'hover:bg-[#374151]/50'
                                  }`}
                                  onClick={() => !isDuplicate && toggleSelection(result.place_id)}
                                >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(result.place_id)}
                                      onChange={() => {}}
                                      disabled={isDuplicate}
                                      className="h-4 w-4 text-[#3B82F6] border-[#374151] rounded focus:ring-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                  </div>
                                  
                                  <div className="flex-grow">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-medium text-white">{result.name}</h5>
                                          {businessType === 'supplier' && (
                                            <span className="text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded">
                                              Supplier/Dealer
                                            </span>
                                          )}
                                          {businessType === 'contractor' && (
                                            <span className="text-xs bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded">
                                              Contractor
                                            </span>
                                          )}
                                          {isDuplicate && (
                                            <span className="text-xs bg-[#EF4444]/20 text-[#EF4444] px-2 py-0.5 rounded">
                                              Already imported
                                            </span>
                                          )}
                                        </div>
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
                                        
                                        {/* Display enriched data if available */}
                                        {result.emails && result.emails.length > 0 && (
                                          <p className="text-sm text-[#10B981] mt-1">✉️ {result.emails[0]}</p>
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
                      <div className="bg-[#374151]/50 rounded-lg p-4 space-y-2 mt-6">
                        <h4 className="text-sm font-medium text-[#60A5FA]">💡 {searchMode === 'standard' ? 'Getting More Results:' : 'Apify Tips:'}</h4>
                        <ul className="text-xs text-gray-300 space-y-1">
                          {searchMode === 'standard' ? (
                            <>
                              <li>• Search different areas of the city (north, south, east, west)</li>
                              <li>• Try variations: &quot;plumber&quot; vs &quot;plumbing&quot; vs &quot;emergency plumber&quot;</li>
                              <li>• Use smaller radius (5-10km) and search multiple times</li>
                              <li>• Search nearby cities for metro area coverage</li>
                            </>
                          ) : (
                            <>
                              <li>• Apify can find ALL businesses in an area, not just 60</li>
                              <li>• Contact enrichment finds emails from business websites</li>
                              <li>• Reviews help identify businesses needing reputation help</li>
                              <li>• Leave filter unchecked to see ALL businesses (with and without websites)</li>
                            </>
                          )}
                        </ul>
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