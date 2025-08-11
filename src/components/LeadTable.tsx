import { useState, Fragment, useRef, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import { CheckIcon, TrashIcon, PencilSquareIcon, EyeIcon, EyeSlashIcon, EllipsisVerticalIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { deleteLead as deleteLeadAPI, deleteLeads as deleteLeadsAPI, updateLead as updateLeadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import EditLeadModal from './modals/EditLeadModal';
import BulkEditModal from './modals/BulkEditModal';
import AdViewerModal from './modals/AdViewerModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTableKeyboardNavigation } from '@/hooks/useTableKeyboardNavigation';
import { getCategoryForBusiness } from '@/utils/grey-tsunami-business-types';
import AdPlatformChecker from './AdPlatformChecker';
import { ensureProtocol } from '@/utils/csv-parser';
import { Menu, Transition } from '@headlessui/react';
import InlineEditableCell from './InlineEditableCell';
// import BulkOperationsBar from './BulkOperationsBar'; // Disabled
import CommandPalette from './CommandPalette';
import ResizableColumn from './ResizableColumn';
import MobileLeadCard from './MobileLeadCard';
import { normalizeServiceType } from '@/utils/service-type-normalization';
import useMediaQuery from '@/hooks/useMediaQuery';


interface LeadTableProps {
  visibleColumns: {
    handle: boolean;
    company: boolean;
    type: boolean;
    searchQuery: boolean;
    city: boolean;
    state: boolean;
    phone: boolean;
    email: boolean;
    additionalEmails: boolean;
    address: boolean;
    rating: boolean;
    reviewCount: boolean;
    score: boolean;
    links: boolean;
    source: boolean;
    ads: boolean;
    adPlatforms: boolean;
    close: boolean;
    actions: boolean;
  };
  setVisibleColumns: React.Dispatch<React.SetStateAction<{
    handle: boolean;
    company: boolean;
    type: boolean;
    searchQuery: boolean;
    city: boolean;
    state: boolean;
    phone: boolean;
    email: boolean;
    additionalEmails: boolean;
    address: boolean;
    rating: boolean;
    reviewCount: boolean;
    score: boolean;
    links: boolean;
    source: boolean;
    ads: boolean;
    adPlatforms: boolean;
    close: boolean;
    actions: boolean;
  }>>;
  isHeaderCollapsed: boolean;
  filteredLeads?: Lead[];
  startIndex?: number;
}

export default function LeadTable({ visibleColumns, setVisibleColumns, isHeaderCollapsed, filteredLeads, startIndex = 0 }: LeadTableProps) {
  const { 
    leads: allLeads, 
    sourceFilter, 
    deleteLead, 
    updateLead,
    selectedLeads: storeSelectedLeads, 
    setSelectedLeads,
    cityFilter,
    serviceTypeFilter,
    viewDensity,
    viewMode,
    newlyImportedLeads,
    clearNewlyImported,
    showOnlyNewImports,
    setShowOnlyNewImports
  } = useLeadStore();
  
  // Check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Define essential columns for compact view
  const compactColumns = {
    handle: false,
    company: true,
    type: true,
    searchQuery: false,
    city: true,
    state: false,
    phone: true,
    email: false,
    additionalEmails: false,
    address: false,
    rating: false,
    reviewCount: false,
    score: false,
    links: false,
    source: false,
    ads: false,
    adPlatforms: false,
    adCTA: false,
    adStartDate: false,
    serviceAreas: false,
    priceInfo: false,
    dmSent: false,
    dmResponse: false,
    called: false,
    callResult: false,
    followUpDate: false,
    close: false,
    actions: true
  };

  // Use compact columns when in compact mode, otherwise use user's column selection
  const activeColumns = viewDensity === 'compact' ? compactColumns : visibleColumns;
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showAdViewerModal, setShowAdViewerModal] = useState(false);
  const [adViewerLead, setAdViewerLead] = useState<Lead | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const { focusedCell, isEditing } = useTableKeyboardNavigation(tableRef);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Use provided filtered leads or apply local filters
  const leads = filteredLeads || allLeads;
  
  // Debug filtering issue
  if (filteredLeads && sourceFilter.csvImport && !sourceFilter.instagram && !sourceFilter.adLibrary && !sourceFilter.googleMaps) {
    console.log('LeadTable received filteredLeads:', filteredLeads.length);
    if (filteredLeads.length > 0) {
      console.log('First lead in filteredLeads:', filteredLeads[0]);
    }
  }
  
  const localFilteredLeads = leads.filter((lead) => {
    // If we're using pre-filtered leads, skip all filtering
    if (filteredLeads) {
      // Only apply the new imports filter if active
      if (showOnlyNewImports) {
        return newlyImportedLeads.includes(lead.id);
      }
      return true;
    }
    
    // Show only new imports filter (overrides other filters when active)
    if (showOnlyNewImports) {
      return newlyImportedLeads.includes(lead.id);
    }
    
    // Multi-source filter (special case)
    if (sourceFilter.instagram === false && sourceFilter.adLibrary === false && sourceFilter.googleMaps === false) {
      // This means we're in "multi-source only" mode
      const isMultiSource = 
        (lead.lead_source === 'Google Maps' && lead.running_ads) ||
        (lead.lead_source === 'FB Ad Library' && lead.google_maps_url) ||
        (lead.ad_platforms && lead.ad_platforms.filter(p => p.hasAds).length > 0 && lead.lead_source === 'Google Maps');
      if (!isMultiSource) return false;
    } else {
      // Regular source filter
      if (lead.lead_source === 'Instagram Manual' && !sourceFilter.instagram) return false;
      if (lead.lead_source === 'FB Ad Library' && !sourceFilter.adLibrary) return false;
      if (lead.lead_source === 'Google Maps' && !sourceFilter.googleMaps) return false;
      if (lead.lead_source === 'CSV Import' && !sourceFilter.csvImport) return false;
    }
    
    // City filter
    if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
    
    // Service type filter
    if (serviceTypeFilter !== 'all') {
      const normalizedType = lead.service_type ? normalizeServiceType(lead.service_type) : null;
      if (normalizedType !== serviceTypeFilter) return false;
    }
    
    return true;
  });
  
  // Debug local filtering
  if (sourceFilter.csvImport && !sourceFilter.instagram && !sourceFilter.adLibrary && !sourceFilter.googleMaps) {
    console.log('After local filtering, leads count:', localFilteredLeads.length);
    if (localFilteredLeads.length === 0 && leads.length > 0) {
      console.log('Local filtering removed all leads! Checking filter logic...');
      console.log('filteredLeads prop provided?', !!filteredLeads);
    }
  }
  
  // Sort the filtered leads
  const sortedLeads = [...localFilteredLeads].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof Lead];
    let bValue = b[sortField as keyof Lead];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Convert to strings for comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Clear newly imported highlights after 10 seconds and scroll to show new leads
  useEffect(() => {
    if (newlyImportedLeads.length > 0) {
      // Find all newly imported leads in the sorted list
      const newLeadsInView = sortedLeads.filter(lead => newlyImportedLeads.includes(lead.id));
      
      if (newLeadsInView.length > 0) {
        // Scroll to the first new lead after a short delay to ensure rendering
        setTimeout(() => {
          const firstNewLead = newLeadsInView[0];
          const leadRow = document.getElementById(`lead-row-${firstNewLead.id}`);
          if (leadRow) {
            // If showing only new imports, scroll to top of table
            if (showOnlyNewImports) {
              leadRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Otherwise center the first new lead
              leadRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Flash the row for emphasis
            leadRow.classList.add('flash-highlight');
            setTimeout(() => {
              leadRow.classList.remove('flash-highlight');
            }, 1000);
          }
        }, 300);
      }

      // Clear highlights after 60 seconds (1 minute for much better visibility)
      const timer = setTimeout(() => {
        clearNewlyImported();
        setShowOnlyNewImports(false);
      }, 60000);

      return () => clearTimeout(timer);
    }
  }, [newlyImportedLeads, sortedLeads, clearNewlyImported, showOnlyNewImports, setShowOnlyNewImports]);

  const toggleSelectAll = () => {
    if (storeSelectedLeads.length === sortedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(sortedLeads.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeads(
      storeSelectedLeads.includes(id) 
        ? storeSelectedLeads.filter(i => i !== id)
        : [...storeSelectedLeads, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (storeSelectedLeads.length === 0) return;
    
    const confirmMessage = storeSelectedLeads.length === 1 
      ? 'Delete this lead?' 
      : `Delete ${storeSelectedLeads.length} selected leads?`;
    
    if (!confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    
    try {
      // Use batch delete for multiple leads
      await deleteLeadsAPI(storeSelectedLeads);
      
      // Update local state
      storeSelectedLeads.forEach(id => deleteLead(id));
      
      toast.success(`Deleted ${storeSelectedLeads.length} lead${storeSelectedLeads.length !== 1 ? 's' : ''}`);
      setSelectedLeads([]);
    } catch (error) {
      toast.error('Failed to delete some leads');
      console.error('Batch delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    
    try {
      await deleteLeadAPI(id);
      deleteLead(id);
      toast.success('Lead deleted');
    } catch (error) {
      toast.error('Failed to delete lead');
      console.error(error);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  // Command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      cmd: true,
      ctrl: true,
      handler: () => toggleSelectAll(),
      description: 'Select all leads'
    },
    {
      key: 'e',
      cmd: true,
      ctrl: true,
      handler: () => {
        if (storeSelectedLeads.length > 0) {
          setShowBulkEditModal(true);
        }
      },
      description: 'Edit selected leads'
    },
    {
      key: 'Delete',
      handler: () => {
        if (storeSelectedLeads.length > 0) {
          handleDeleteSelected();
        }
      },
      description: 'Delete selected leads'
    },
    {
      key: 'Escape',
      handler: () => setSelectedLeads([]),
      description: 'Clear selection'
    }
  ]);

  // Mobile card view
  if (isMobile && viewMode === 'grid') {
    return (
      <>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
          {/* Bulk operations bar for mobile - Disabled */}
          {/* <BulkOperationsBar
            selectedCount={storeSelectedLeads.length}
            onBulkEdit={() => setShowBulkEditModal(true)}
            onExport={() => {}}
            onClearSelection={() => setSelectedLeads([])}
          /> */}
          
          {/* Mobile cards */}
          <div className="px-4 py-4">
            {storeSelectedLeads.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {storeSelectedLeads.length} selected
                </span>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Clear
                </button>
              </div>
            )}
            
            {sortedLeads.map((lead) => (
              <MobileLeadCard
                key={lead.id}
                lead={lead}
                selected={storeSelectedLeads.includes(lead.id)}
                onToggleSelect={() => toggleSelect(lead.id)}
                onEdit={() => handleEditLead(lead)}
                onDelete={() => handleDeleteSingle(lead.id)}
              />
            ))}
          </div>
        </div>

        {/* Modals */}
        <EditLeadModal 
          open={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            setEditingLead(null);
          }} 
          lead={editingLead} 
        />

        <BulkEditModal 
          open={showBulkEditModal}
          onClose={() => {
            setShowBulkEditModal(false);
            setSelectedLeads([]);
          }}
          selectedLeadIds={storeSelectedLeads}
        />
        
        <AdViewerModal
          open={showAdViewerModal}
          onClose={() => {
            setShowAdViewerModal(false);
            setAdViewerLead(null);
          }}
          lead={adViewerLead}
        />
        
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onAddLead={() => {}}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExport={() => {}}
        />
      </>
    );
  }

  // Table view (Desktop and Mobile when selected)
  return (
    <>
      <div className={`bg-white dark:bg-gray-900 shadow-sm relative z-0 overflow-hidden mr-4 ${isMobile ? 'mobile-table' : ''}`}>
        {/* New imports filter banner */}
        {showOnlyNewImports && newlyImportedLeads.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Showing {newlyImportedLeads.length} newly imported lead{newlyImportedLeads.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setShowOnlyNewImports(false)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Clear Filter
            </button>
          </div>
        )}
        
        {/* Bulk operations bar - Disabled */}
        {/* <BulkOperationsBar
          selectedCount={storeSelectedLeads.length}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExport={() => {}}
          onClearSelection={() => setSelectedLeads([])}
        /> */}
        
        {storeSelectedLeads.length > 0 && false && (
          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {storeSelectedLeads.length} lead{storeSelectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Edit selected leads (⌘+E or Ctrl+E)"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Edit Selected
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                title="Delete selected leads (Delete key)"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto overflow-y-auto relative" style={{ height: 'calc(100vh - 120px)' }}>
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-50 shadow-sm">
              <tr>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-10">
                  #
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide sticky left-[40px] z-10 bg-gray-50 dark:bg-gray-800 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 dark:border-gray-700 min-w-[44px]">
                  <input
                    type="checkbox"
                    checked={storeSelectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                {activeColumns.company && (
                                <th
                className={`px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 sticky z-10 bg-gray-50 dark:bg-gray-800 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 dark:border-gray-700 w-[320px] min-w-[320px] max-w-[320px]`}
                style={{ left: 'calc(40px + 44px)' }}
              >
                <div className="flex items-center gap-1" onClick={() => handleSort('company_name')}>
                  Company
                  {sortField === 'company_name' && (
                    sortDirection === 'asc' ?
                      <ChevronUpIcon className="h-3 w-3" /> :
                      <ChevronDownIcon className="h-3 w-3" />
                  )}
                </div>
              </th>
                )}
                {activeColumns.links && (
                  <th className={`pl-6 pr-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide w-[120px] min-w-[120px] ${isMobile ? 'hide-on-mobile' : ''}`}>
                    Links
                  </th>
                )}
                {activeColumns.city && (
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center gap-1">
                      City
                      {sortField === 'city' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-3 w-3" /> : 
                          <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {activeColumns.state && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    State
                  </th>
                )}
                {activeColumns.phone && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Phone
                  </th>
                )}
                {activeColumns.email && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Email
                  </th>
                )}
                {activeColumns.handle && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Handle
                  </th>
                )}
                {activeColumns.additionalEmails && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Additional Emails
                  </th>
                )}
                {activeColumns.address && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Address
                  </th>
                )}
                {activeColumns.rating && (
                  <th className={`px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide ${isMobile ? 'hide-on-mobile' : ''}`}>
                    Rating
                  </th>
                )}
                {activeColumns.reviewCount && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Reviews
                  </th>
                )}
                {activeColumns.score && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Score
                  </th>
                )}
                {activeColumns.source && (
                  <th className={`px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide ${isMobile ? 'hide-on-mobile' : ''}`}>
                    Source
                  </th>
                )}
                {activeColumns.ads && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Ads
                  </th>
                )}
                {activeColumns.adPlatforms && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Ad Platforms
                  </th>
                )}
                {activeColumns.type && (
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('service_type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortField === 'service_type' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-3 w-3" /> : 
                          <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {activeColumns.searchQuery && (
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('search_query')}
                  >
                    <div className="flex items-center gap-1">
                      Search Query
                      {sortField === 'search_query' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-3 w-3" /> : 
                          <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {activeColumns.close && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Close
                  </th>
                )}
                {activeColumns.actions && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedLeads.map((lead, index) => (
                <LeadRow 
                  key={lead.id} 
                  lead={lead} 
                  selected={storeSelectedLeads.includes(lead.id)}
                  activeColumns={activeColumns}
                  index={startIndex + index}
                  isNewlyImported={newlyImportedLeads.includes(lead.id)}
                  onToggleSelect={() => toggleSelect(lead.id)}
                  onDelete={() => handleDeleteSingle(lead.id)}
                  onEdit={() => handleEditLead(lead)}
                  onViewAds={(lead) => {
                    setAdViewerLead(lead);
                    setShowAdViewerModal(true);
                  }}
                  isMobile={isMobile}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditLeadModal 
        open={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditingLead(null);
        }} 
        lead={editingLead} 
      />

            <BulkEditModal 
        open={showBulkEditModal}
        onClose={() => {
          setShowBulkEditModal(false);
          setSelectedLeads([]);
        }}
        selectedLeadIds={storeSelectedLeads}
      />
      
      <AdViewerModal
        open={showAdViewerModal}
        onClose={() => {
          setShowAdViewerModal(false);
          setAdViewerLead(null);
        }}
        lead={adViewerLead}
      />
      
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onAddLead={() => {}}
        onBulkEdit={() => setShowBulkEditModal(true)}
        onExport={() => {}}
      />
      
    </>
  );
}

interface LeadRowProps {
  lead: Lead;
  selected: boolean;
  index: number;
  isNewlyImported?: boolean;
  activeColumns: {
    handle: boolean;
    company: boolean;
    type: boolean;
    searchQuery: boolean;
    city: boolean;
    state: boolean;
    phone: boolean;
    email: boolean;
    additionalEmails: boolean;
    address: boolean;
    rating: boolean;
    reviewCount: boolean;
    score: boolean;
    links: boolean;
    source: boolean;
    ads: boolean;
    adPlatforms: boolean;
    close: boolean;
    actions: boolean;
  };
  onToggleSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewAds: (lead: Lead) => void;
  isMobile?: boolean;
  style?: React.CSSProperties;
}

export function LeadRow({ lead, selected, index, isNewlyImported = false, activeColumns, onToggleSelect, onDelete, onEdit, onViewAds, isMobile = false, style }: LeadRowProps) {
  const { updateLead } = useLeadStore();
  // Check for multi-source presence
  const hasMultipleSources = 
    (lead.lead_source === 'Google Maps' && lead.running_ads) ||
    (lead.lead_source === 'FB Ad Library' && lead.google_maps_url) ||
    (lead.ad_platforms && lead.ad_platforms.filter(p => p.hasAds).length > 0 && lead.lead_source === 'Google Maps');
  
  const getSourceBadge = () => {
    if (hasMultipleSources) {
      return (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 dark:from-blue-900/30 to-purple-100 dark:to-purple-900/30 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <span className="mr-1">🔗</span>
            Multi-Source
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ({lead.lead_source}{lead.running_ads ? ' + FB Ads' : ''})
          </div>
        </div>
      );
    }
    
    // Enhanced source badges with icons
    const sourceBadges = {
      'Google Maps': { 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-800 dark:text-blue-400', 
        border: 'border-blue-200 dark:border-blue-800', 
        icon: '📍' 
      },
      'FB Ad Library': { 
        bg: 'bg-indigo-100 dark:bg-indigo-900/30', 
        text: 'text-indigo-800 dark:text-indigo-400', 
        border: 'border-indigo-200 dark:border-indigo-800', 
        icon: '📘' 
      },
      'Instagram Manual': { 
        bg: 'bg-purple-100 dark:bg-purple-900/30', 
        text: 'text-purple-800 dark:text-purple-400', 
        border: 'border-purple-200 dark:border-purple-800', 
        icon: '📷' 
      },
      'CSV Import': { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-800 dark:text-green-400', 
        border: 'border-green-200 dark:border-green-800', 
        icon: '📄' 
      }
    };
    
    const badge = sourceBadges[lead.lead_source as keyof typeof sourceBadges];
    if (!badge) return <span className="text-gray-500 dark:text-gray-400">{lead.lead_source || '-'}</span>;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
        <span className="mr-1">{badge.icon}</span>
        {lead.lead_source}
      </span>
    );
  };
  
  // Enhanced company name display for multi-source
  const getCompanyDisplay = () => {
    return (
      <div className="max-w-[250px]">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={lead.company_name || undefined}>
            {lead.company_name}
          </div>
          {isNewlyImported && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-200/30 dark:border-blue-400/20">
              NEW
            </span>
          )}
        </div>
        {hasMultipleSources && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            ⭐ Found in multiple platforms
          </div>
        )}
      </div>
    );
  };

  return (
    <tr 
      id={`lead-row-${lead.id}`}
      data-lead-id={lead.id}
      className={`
        group transition-all duration-150 cursor-pointer relative
        ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}
        ${hasMultipleSources ? 'bg-gradient-to-r from-blue-50/20 dark:from-blue-900/20 to-purple-50/20 dark:to-purple-900/20' : ''}
        hover:bg-blue-50 dark:hover:bg-gray-800 hover:shadow-sm
        ${selected ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50' : ''}
        ${isNewlyImported ? 'newly-imported border-l-4 border-blue-500 dark:border-blue-400' : ''}
      `}
      style={style}>
      <td className={`px-1 py-2 text-center text-xs text-gray-400 dark:text-gray-500 sticky left-0 z-10 border-r border-gray-200 dark:border-gray-700 transition-colors duration-150 w-10
        ${selected ? 'bg-blue-100 dark:bg-blue-900/30' : index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
        group-hover:bg-blue-50 dark:group-hover:bg-gray-800 ${selected ? 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50' : ''}
      `}>
        {index + 1}
      </td>
      <td className={`px-2 sm:px-3 py-2 whitespace-nowrap sticky left-[40px] z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 dark:border-gray-700 transition-colors duration-150 min-w-[44px]
        ${selected ? 'bg-blue-100 dark:bg-blue-900/30' : index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
        group-hover:bg-blue-50 dark:group-hover:bg-gray-800 ${selected ? 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50' : ''}
      `}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      {activeColumns.company && (
                    <td className={`px-2 sm:px-3 py-2 cursor-pointer sticky z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 dark:border-gray-700 transition-colors duration-150 w-[320px] min-w-[320px] max-w-[320px]
              ${selected ? 'bg-blue-100 dark:bg-blue-900/30' : hasMultipleSources ? 'bg-gradient-to-r from-blue-50/20 dark:from-blue-900/20 to-purple-50/20 dark:to-purple-900/20' : index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
              group-hover:bg-blue-50 dark:group-hover:bg-gray-800 ${selected ? 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50' : ''}
            `}
            style={{ left: 'calc(40px + 44px)' }}
            onClick={onEdit}>
              <div className="truncate pr-2">{getCompanyDisplay()}</div>
            </td>
      )}
      {activeColumns.links && (
        <td className={`pl-6 pr-2 py-2 whitespace-nowrap text-sm w-[120px] min-w-[120px]
          ${selected ? 'bg-blue-100 dark:bg-blue-900/30' : hasMultipleSources ? 'bg-gradient-to-r from-blue-50/20 dark:from-blue-900/20 to-purple-50/20 dark:to-purple-900/20' : index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
          group-hover:bg-blue-50 dark:group-hover:bg-gray-800 ${selected ? 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50' : ''}
        `}>
          <div className="flex gap-1 flex-wrap justify-start">
            {lead.instagram_url && (
              <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300" title="Instagram" onClick={(e) => e.stopPropagation()}>
                📸
              </a>
            )}
            {lead.facebook_url && (
              <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Facebook" onClick={(e) => e.stopPropagation()}>
                f
              </a>
            )}
            {lead.linkedin_url && (
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                in
              </a>
            )}
            {lead.twitter_url && (
              <a href={lead.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sky-500 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300" title="Twitter/X" onClick={(e) => e.stopPropagation()}>
                𝕏
              </a>
            )}
            {lead.website && (
              <a href={ensureProtocol(lead.website) || undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Website" onClick={(e) => e.stopPropagation()}>
                🌐
              </a>
            )}
            {lead.google_maps_url && (
              <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300" title="Google Maps" onClick={(e) => e.stopPropagation()}>
                📍
              </a>
            )}
          </div>
        </td>
      )}
            {activeColumns.city && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
            onClick={onEdit}>
          <div className="max-w-[150px] truncate" title={lead.city || undefined}>
            {lead.city}
          </div>
        </td>
      )}
      {activeColumns.state && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer" onClick={onEdit}>
          <div className="max-w-[50px] truncate" title={lead.state || undefined}>
            {lead.state || '-'}
          </div>
        </td>
      )}
      {activeColumns.phone && (
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
          <InlineEditableCell
            lead={lead}
            field="phone"
            value={lead.phone}
            onUpdate={updateLead}
            type="tel"
            placeholder="Add phone..."
          />
        </td>
      )}
      {activeColumns.email && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          <InlineEditableCell
            lead={lead}
            field="email"
            value={lead.email}
            onUpdate={updateLead}
            type="email"
            className="max-w-[220px]"
            placeholder="Add email..."
          />
          {(lead.email2 || lead.email3) && (
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
              +{[lead.email2, lead.email3].filter(Boolean).length} more
            </span>
          )}
        </td>
      )}
      {activeColumns.handle && (
        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
          <InlineEditableCell
            lead={lead}
            field="handle"
            value={lead.handle}
            onUpdate={updateLead}
            className="max-w-[200px] truncate"
            placeholder="Add handle..."
          />
        </td>
      )}
      {activeColumns.additionalEmails && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="space-y-1">
            {lead.email2 && (
              <InlineEditableCell
                lead={lead}
                field="email2"
                value={lead.email2}
                onUpdate={updateLead}
                type="email"
                className="max-w-[220px]"
                placeholder="Add email 2..."
              />
            )}
            {lead.email3 && (
              <InlineEditableCell
                lead={lead}
                field="email3"
                value={lead.email3}
                onUpdate={updateLead}
                type="email"
                className="max-w-[220px]"
                placeholder="Add email 3..."
              />
            )}
            {!lead.email2 && !lead.email3 && (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        </td>
      )}
      {activeColumns.address && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          <InlineEditableCell
            lead={lead}
            field="address"
            value={lead.address || lead.full_address}
            onUpdate={updateLead}
            className="max-w-[250px] truncate"
            placeholder="Add address..."
          />
        </td>
      )}
      {activeColumns.rating && (
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 cursor-pointer" onClick={onEdit}>
          {lead.rating ? (
            <div className="flex items-center">
              <span>{lead.rating}</span>
              <span className="text-yellow-500 ml-1">⭐</span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
      )}
      {activeColumns.reviewCount && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer" onClick={onEdit}>
          {lead.review_count !== null && lead.review_count !== undefined ? (
            <span>{lead.review_count}</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
      )}
      {activeColumns.score && (
        <td className="px-3 py-2 text-xs cursor-pointer" onClick={onEdit}>
          {lead.score ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              lead.score === 'A++' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
              lead.score === 'A+' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
              lead.score === 'A' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
              lead.score === 'B' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
              'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
            }`}>
              {lead.score}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
      )}
      {activeColumns.source && (
        <td className={`px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 cursor-pointer ${isMobile ? 'hide-on-mobile' : ''}`} onClick={onEdit}>
          {getSourceBadge()}
        </td>
      )}
      {activeColumns.ads && (
        <td className="px-3 py-2 whitespace-nowrap text-sm cursor-pointer" onClick={onEdit}>
          {lead.running_ads && <CheckIcon className="h-5 w-5 text-green-500" />}
          {!lead.running_ads && <span className="text-red-500">✗</span>}
        </td>
      )}
      {activeColumns.adPlatforms && (
        <td className="px-3 py-2 whitespace-nowrap text-sm cursor-pointer" onClick={onEdit}>
          <AdPlatformChecker 
            platforms={lead.ad_platforms} 
            compact={true}
            onViewAds={() => onViewAds(lead)}
          />
        </td>
      )}
      {activeColumns.type && (
        <td className={`px-3 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer ${!activeColumns.handle ? 'pl-6' : ''}`} onClick={onEdit}>
          <div className="relative group max-w-[180px]">
            <span className="truncate block" title={(lead.normalized_service_type || lead.service_type) || undefined}>
              {lead.normalized_service_type || lead.service_type}
            </span>
            {(() => {
              const serviceType = lead.normalized_service_type || lead.service_type;
              if (!serviceType) return null;
              const category = getCategoryForBusiness(serviceType);
              if (!category) return null;
              return (
                <div className="absolute z-10 hidden group-hover:block bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64">
                  <div className="font-semibold">{category.tier}</div>
                  <div>{category.category}</div>
                  <div className="text-gray-300 mt-1">{category.description}</div>
                  <div className="text-yellow-300 mt-1">Acquisition Score: {category.acquisitionScore}/10</div>
                </div>
              );
            })()}
          </div>
        </td>
      )}
      {activeColumns.searchQuery && (
        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer" onClick={onEdit}>
          <div className="max-w-[200px] truncate" title={lead.search_query || undefined}>
            {lead.search_query || '-'}
          </div>
        </td>
      )}
      {activeColumns.close && (
        <td className="px-3 py-2 whitespace-nowrap text-sm cursor-pointer" onClick={onEdit}>
          {lead.close_crm_id ? (
            <span className="text-green-600" title={`Exported: ${lead.close_crm_id}`}>✓</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
      )}
      {activeColumns.actions && (
        <td className="px-3 py-2 whitespace-nowrap text-sm">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                        data-action="edit"
                        className={`${
                          active ? 'bg-gray-100 text-gray-900 dark:text-gray-100' : 'text-gray-700'
                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                      >
                        <PencilSquareIcon className="mr-3 h-4 w-4" />
                        Edit Lead
                      </button>
                    )}
                  </Menu.Item>
                  <div className="border-t border-gray-100"></div>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className={`${
                          active ? 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-300' : 'text-red-700 dark:text-red-400'
                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                      >
                        <TrashIcon className="mr-3 h-4 w-4" />
                        Delete Lead
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </td>
      )}
    </tr>
  );
}