import { useState, Fragment, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

// Import LeadRow component from the original file
import LeadTable, { LeadRow } from './LeadTable';

interface VirtualizedLeadTableProps {
  visibleColumns: {
    handle: boolean;
    company: boolean;
    type: boolean;
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
}

export default function VirtualizedLeadTable({ visibleColumns, setVisibleColumns, isHeaderCollapsed, filteredLeads }: VirtualizedLeadTableProps) {
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
    city: true,
    state: false,
    phone: true,
    email: true,
    additionalEmails: false,
    address: false,
    rating: true,
    reviewCount: false,
    score: true,
    links: true,
    source: true,
    ads: true,
    adPlatforms: false,
    close: false,
    actions: true
  };

  // Use appropriate columns based on view density
  const activeColumns = viewDensity === 'compact' ? { ...compactColumns } : { ...visibleColumns };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAdViewerModal, setShowAdViewerModal] = useState(false);
  const [adViewerLead, setAdViewerLead] = useState<Lead | null>(null);

  // Use filteredLeads if provided, otherwise use allLeads
  // Don't apply additional filters here as they're already applied in the parent component
  const leads = useMemo(() => {
    let baseLeads = filteredLeads || allLeads;
    
    // Only apply new imports filter here as it's specific to this component
    if (showOnlyNewImports) {
      baseLeads = baseLeads.filter(lead => newlyImportedLeads.includes(lead.id));
    }
    
    return baseLeads;
  }, [allLeads, filteredLeads, showOnlyNewImports, newlyImportedLeads]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    if (!sortField) return leads;
    
    return [...leads].sort((a, b) => {
      let aValue = a[sortField as keyof Lead];
      let bValue = b[sortField as keyof Lead];
      
      // Handle null/undefined values
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      // Convert to strings for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [leads, sortField, sortDirection]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedLeads.length,
    getScrollElement: () => scrollingRef.current,
    estimateSize: () => viewDensity === 'compact' ? 48 : 64, // Estimated row height
    overscan: 10, // Render 10 extra rows outside viewport
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection handling
  const toggleSelect = (leadId: string) => {
    if (storeSelectedLeads.includes(leadId)) {
      setSelectedLeads(storeSelectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...storeSelectedLeads, leadId]);
    }
  };

  const selectAll = () => {
    if (storeSelectedLeads.length === sortedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(sortedLeads.map(lead => lead.id));
    }
  };

  // Delete handling
  const handleDeleteSingle = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLeadAPI(id);
        deleteLead(id);
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (storeSelectedLeads.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${storeSelectedLeads.length} leads?`)) {
      try {
        await deleteLeadsAPI(storeSelectedLeads);
        storeSelectedLeads.forEach(id => deleteLead(id));
        setSelectedLeads([]);
        toast.success(`${storeSelectedLeads.length} leads deleted successfully`);
      } catch (error) {
        toast.error('Failed to delete leads');
      }
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-4 px-4 py-2">
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
    );
  }

  // Desktop virtualized view
  // Show no leads message if empty
  if (sortedLeads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No leads found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Bulk operations bar - Disabled */}
      {/* {storeSelectedLeads.length > 0 && (
        <BulkOperationsBar
          selectedCount={storeSelectedLeads.length}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExport={() => {}}
          onClearSelection={() => setSelectedLeads([])}
        />
      )} */}

      <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Separate fixed header */}
        <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
          <table className="min-w-full table-fixed">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left w-12">
                  <input
                    type="checkbox"
                    checked={storeSelectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                    onChange={selectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                {activeColumns.handle && (
                  <th 
                    onClick={() => handleSort('handle')}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                  >
                    Handle
                    {sortField === 'handle' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                )}
                {activeColumns.company && (
                  <th 
                    onClick={() => handleSort('company_name')}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                  >
                    Company
                    {sortField === 'company_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                )}
                {activeColumns.links && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Links
                  </th>
                )}
                {activeColumns.city && (
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    State
                  </th>
                )}
                {activeColumns.phone && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Phone
                  </th>
                )}
                {activeColumns.email && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Email
                  </th>
                )}
                {activeColumns.additionalEmails && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Additional Emails
                  </th>
                )}
                {activeColumns.address && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Address
                  </th>
                )}
                {activeColumns.rating && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Rating
                  </th>
                )}
                {activeColumns.reviewCount && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Reviews
                  </th>
                )}
                {activeColumns.score && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Score
                  </th>
                )}
                {activeColumns.source && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Source
                  </th>
                )}
                {activeColumns.ads && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Ads
                  </th>
                )}
                {activeColumns.adPlatforms && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Ad Platforms
                  </th>
                )}
                {activeColumns.type && (
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
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
                {activeColumns.close && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Close
                  </th>
                )}
                {activeColumns.actions && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
          </table>
        </div>
        
        {/* Scrollable body */}
        <div 
          ref={scrollingRef}
          className="flex-1 overflow-auto relative"
          style={{ 
            height: '100%'
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
              {virtualItems.map((virtualRow) => {
                const lead = sortedLeads[virtualRow.index];
                if (!lead) return null;
                
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <table className="min-w-full table-fixed">
                      <tbody>
                        <LeadRow 
                          lead={lead} 
                          selected={storeSelectedLeads.includes(lead.id)}
                          activeColumns={activeColumns}
                          index={virtualRow.index}
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
                      </tbody>
                    </table>
                  </div>
                );
              })}
          </div>
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