import { useState, Fragment, useRef, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import { CheckIcon, TrashIcon, PencilSquareIcon, GlobeAltIcon, EyeIcon, EyeSlashIcon, EllipsisVerticalIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { deleteLead as deleteLeadAPI, deleteLeads as deleteLeadsAPI, updateLead as updateLeadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import EditLeadModal from './modals/EditLeadModal';
import BulkEditModal from './modals/BulkEditModal';
import AdPlatformModal from './modals/AdPlatformModal';
import AdViewerModal from './modals/AdViewerModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTableKeyboardNavigation } from '@/hooks/useTableKeyboardNavigation';
import { getCategoryForBusiness } from '@/utils/grey-tsunami-business-types';
import AdPlatformChecker from './AdPlatformChecker';
import { ensureProtocol } from '@/utils/csv-parser';
import { Menu, Transition } from '@headlessui/react';
import InlineEditableCell from './InlineEditableCell';
import BulkOperationsBar from './BulkOperationsBar';
import CommandPalette from './CommandPalette';
import ResizableColumn from './ResizableColumn';
import MobileLeadCard from './MobileLeadCard';
import useMediaQuery from '@/hooks/useMediaQuery';

interface LeadTableProps {
  visibleColumns: {
    handle: boolean;
    company: boolean;
    type: boolean;
    city: boolean;
    phone: boolean;
    email: boolean;
    rating: boolean;
    links: boolean;
    source: boolean;
    ads: boolean;
    adPlatforms: boolean;
    notes: boolean;
    close: boolean;
    actions: boolean;
  };
  setVisibleColumns: React.Dispatch<React.SetStateAction<{
    handle: boolean;
    company: boolean;
    type: boolean;
    city: boolean;
    phone: boolean;
    email: boolean;
    rating: boolean;
    links: boolean;
    source: boolean;
    ads: boolean;
    adPlatforms: boolean;
    notes: boolean;
    close: boolean;
    actions: boolean;
  }>>;
  isHeaderCollapsed: boolean;
}

export default function LeadTable({ visibleColumns, setVisibleColumns, isHeaderCollapsed }: LeadTableProps) {
  const { 
    leads, 
    sourceFilter, 
    deleteLead, 
    updateLead,
    selectedLeads: storeSelectedLeads, 
    setSelectedLeads,
    cityFilter,
    serviceTypeFilter,
    viewDensity,
    viewMode
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
    phone: true,
    email: false,
    rating: false,
    links: false,
    source: false,
    ads: false,
    adPlatforms: false,
    notes: false,
    close: false,
    actions: true
  };

  // Use compact columns when in compact mode, otherwise use user's column selection
  const activeColumns = viewDensity === 'compact' ? compactColumns : visibleColumns;
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showAdPlatformModal, setShowAdPlatformModal] = useState(false);
  const [adPlatformLeadId, setAdPlatformLeadId] = useState<string | null>(null);
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

  const filteredLeads = leads.filter((lead) => {
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
    }
    
    // City filter
    if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
    
    // Service type filter
    if (serviceTypeFilter !== 'all' && lead.service_type !== serviceTypeFilter) return false;
    
    return true;
  });
  
  // Sort the filtered leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
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
        <div className="bg-gray-50 min-h-screen">
          {/* Bulk operations bar for mobile */}
          <BulkOperationsBar
            selectedCount={storeSelectedLeads.length}
            onBulkEdit={() => setShowBulkEditModal(true)}
            onExport={() => {}}
            onCheckPlatforms={() => setShowAdPlatformModal(true)}
            onClearSelection={() => setSelectedLeads([])}
          />
          
          {/* Mobile cards */}
          <div className="px-4 py-4">
            {storeSelectedLeads.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {storeSelectedLeads.length} selected
                </span>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
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
                onCheckPlatforms={setAdPlatformLeadId}
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
        
        <AdPlatformModal
          open={showAdPlatformModal}
          onClose={() => {
            setShowAdPlatformModal(false);
            setAdPlatformLeadId(null);
          }}
          selectedLeadIds={adPlatformLeadId ? [adPlatformLeadId] : []}
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
          onCheckPlatforms={() => setShowAdPlatformModal(true)}
        />
      </>
    );
  }

  // Table view (Desktop and Mobile when selected)
  return (
    <>
      <div className={`bg-white shadow-sm relative z-0 overflow-hidden ${isMobile ? 'mobile-table' : ''}`}>
        {/* Bulk operations bar */}
        <BulkOperationsBar
          selectedCount={storeSelectedLeads.length}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExport={() => {}}
          onCheckPlatforms={() => setShowAdPlatformModal(true)}
          onClearSelection={() => setSelectedLeads([])}
        />
        
        {storeSelectedLeads.length > 0 && false && (
          <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-700">
              {storeSelectedLeads.length} lead{storeSelectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-50 shadow-sm">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide sticky left-0 z-10 bg-gray-50 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 min-w-[44px]">
                  <input
                    type="checkbox"
                    checked={storeSelectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                {activeColumns.handle && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Handle
                  </th>
                )}
                {activeColumns.company && (
                  <ResizableColumn
                    className={`px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 sticky z-10 bg-gray-50 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 min-w-[150px]`}
                    minWidth={150}
                    maxWidth={400}
                    style={{ left: '44px' }}
                  >
                    <div className="flex items-center gap-1" onClick={() => handleSort('company_name')}>
                      Company
                      {sortField === 'company_name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-3 w-3" /> : 
                          <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </div>
                  </ResizableColumn>
                )}
                {activeColumns.type && (
                  <th 
                    className={`px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 ${!activeColumns.handle ? 'pl-6' : ''}`}
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
                {activeColumns.rating && (
                  <th className={`px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide ${isMobile ? 'hide-on-mobile' : ''}`}>
                    Rating
                  </th>
                )}
                {activeColumns.links && (
                  <th className={`px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide ${isMobile ? 'hide-on-mobile' : ''}`}>
                    Links
                  </th>
                )}
                {activeColumns.source && (
                  <th className={`px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide ${isMobile ? 'hide-on-mobile' : ''}`}>
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
                {activeColumns.notes && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Notes
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
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLeads.map((lead, index) => (
                <LeadRow 
                  key={lead.id} 
                  lead={lead} 
                  selected={storeSelectedLeads.includes(lead.id)}
                  activeColumns={activeColumns}
                  index={index}
                  onToggleSelect={() => toggleSelect(lead.id)}
                  onDelete={() => handleDeleteSingle(lead.id)}
                  onEdit={() => handleEditLead(lead)}
                  onCheckPlatforms={(leadId) => {
                    setAdPlatformLeadId(leadId);
                    setShowAdPlatformModal(true);
                  }}
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
      
      <AdPlatformModal
        open={showAdPlatformModal}
        onClose={() => {
          setShowAdPlatformModal(false);
          setAdPlatformLeadId(null);
        }}
        selectedLeadIds={adPlatformLeadId ? [adPlatformLeadId] : []}
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
        onCheckPlatforms={() => setShowAdPlatformModal(true)}
      />
    </>
  );
}

interface LeadRowProps {
  lead: Lead;
  selected: boolean;
  index: number;
  activeColumns: {
    handle: boolean;
    company: boolean;
    type: boolean;
    city: boolean;
    phone: boolean;
    email: boolean;
    rating: boolean;
    links: boolean;
    source: boolean;
    ads: boolean;
    adPlatforms: boolean;
    notes: boolean;
    close: boolean;
    actions: boolean;
  };
  onToggleSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCheckPlatforms: (leadId: string) => void;
  onViewAds: (lead: Lead) => void;
  isMobile?: boolean;
}

function LeadRow({ lead, selected, index, activeColumns, onToggleSelect, onDelete, onEdit, onCheckPlatforms, onViewAds, isMobile = false }: LeadRowProps) {
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 border border-purple-200">
            <span className="mr-1">🔗</span>
            Multi-Source
          </span>
          <div className="text-xs text-gray-500">
            ({lead.lead_source}{lead.running_ads ? ' + FB Ads' : ''})
          </div>
        </div>
      );
    }
    
    // Enhanced source badges with icons
    const sourceBadges = {
      'Google Maps': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '📍' },
      'FB Ad Library': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', icon: '📘' },
      'Instagram Manual': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: '📷' }
    };
    
    const badge = sourceBadges[lead.lead_source as keyof typeof sourceBadges];
    if (!badge) return <span className="text-gray-500">{lead.lead_source || '-'}</span>;
    
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
        <div className="text-sm font-medium text-gray-900 truncate" title={lead.company_name || undefined}>
          {lead.company_name}
        </div>
        {hasMultipleSources && (
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            ⭐ Found in multiple platforms
          </div>
        )}
      </div>
    );
  };

  return (
    <tr className={`
      group transition-colors duration-150 cursor-pointer
      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
      ${hasMultipleSources ? 'bg-gradient-to-r from-blue-50/30 to-purple-50/30' : ''}
      hover:bg-blue-50 hover:shadow-sm
      ${selected ? 'bg-blue-100 hover:bg-blue-200' : ''}
    `}>
      <td className={`px-2 sm:px-3 py-2 whitespace-nowrap sticky left-0 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 transition-colors duration-150 min-w-[44px]
        ${selected ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
        group-hover:bg-blue-50 ${selected ? 'group-hover:bg-blue-200' : ''}
      `}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      {activeColumns.handle && (
        <td className="px-3 py-2 text-xs text-gray-900">
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
      {activeColumns.company && (
        <td className={`px-2 sm:px-3 py-2 cursor-pointer sticky z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.2)] border-r border-gray-200 transition-colors duration-150 min-w-[150px]
          ${selected ? 'bg-blue-100' : hasMultipleSources ? 'bg-gradient-to-r from-blue-50 to-purple-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
          group-hover:bg-blue-50 ${selected ? 'group-hover:bg-blue-200' : ''}
        `} 
        style={{ left: '44px' }}
        onClick={onEdit}>
          {getCompanyDisplay()}
        </td>
      )}
      {activeColumns.type && (
        <td className={`px-3 py-2 text-xs text-gray-500 cursor-pointer ${!activeColumns.handle ? 'pl-6' : ''}`} onClick={onEdit}>
          <div className="relative group max-w-[180px]">
            <span className="truncate block" title={lead.service_type || undefined}>
              {lead.service_type}
            </span>
            {lead.service_type && getCategoryForBusiness(lead.service_type) && (
              <div className="absolute z-10 hidden group-hover:block bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-64">
                <div className="font-semibold">{getCategoryForBusiness(lead.service_type)?.tier}</div>
                <div>{getCategoryForBusiness(lead.service_type)?.category}</div>
                <div className="text-gray-300 mt-1">{getCategoryForBusiness(lead.service_type)?.description}</div>
                <div className="text-yellow-300 mt-1">Acquisition Score: {getCategoryForBusiness(lead.service_type)?.acquisitionScore}/10</div>
              </div>
            )}
          </div>
        </td>
      )}
      {activeColumns.city && (
        <td className="px-3 py-2 text-xs text-gray-500 cursor-pointer" onClick={onEdit}>
          <div className="max-w-[150px] truncate" title={lead.city || undefined}>
            {lead.city}
          </div>
        </td>
      )}
      {activeColumns.phone && (
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
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
        <td className="px-3 py-2 text-xs text-gray-500">
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
            <span className="text-gray-400 text-xs ml-1">
              +{[lead.email2, lead.email3].filter(Boolean).length} more
            </span>
          )}
        </td>
      )}
      {activeColumns.rating && (
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 cursor-pointer" onClick={onEdit}>
          {lead.rating ? (
            <div className="flex items-center">
              <span>{lead.rating}</span>
              <span className="text-yellow-500 ml-1">⭐</span>
              {lead.review_count && (
                <span className="text-gray-400 ml-1">({lead.review_count})</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      )}
      {activeColumns.links && (
        <td className="px-3 py-2 whitespace-nowrap text-sm">
          <div className="flex gap-2">
            {lead.instagram_url && (
              <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800" title="Instagram" onClick={(e) => e.stopPropagation()}>
                📸
              </a>
            )}
            {lead.facebook_url && (
              <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Facebook" onClick={(e) => e.stopPropagation()}>
                f
              </a>
            )}
            {lead.linkedin_url && (
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                in
              </a>
            )}
            {lead.twitter_url && (
              <a href={lead.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-700" title="Twitter/X" onClick={(e) => e.stopPropagation()}>
                𝕏
              </a>
            )}
            {lead.website && (
              <a href={ensureProtocol(lead.website) || undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Website" onClick={(e) => e.stopPropagation()}>
                🌐
              </a>
            )}
            {lead.google_maps_url && (
              <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800" title="Google Maps" onClick={(e) => e.stopPropagation()}>
                📍
              </a>
            )}
          </div>
        </td>
      )}
      {activeColumns.source && (
        <td className={`px-3 py-2 whitespace-nowrap text-xs text-gray-500 cursor-pointer ${isMobile ? 'hide-on-mobile' : ''}`} onClick={onEdit}>
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
      {activeColumns.notes && (
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
          <InlineEditableCell
            lead={lead}
            field="notes"
            value={lead.notes}
            onUpdate={updateLead}
            className="max-w-[200px] truncate"
            placeholder="Add notes..."
          />
        </td>
      )}
      {activeColumns.close && (
        <td className="px-3 py-2 whitespace-nowrap text-sm cursor-pointer" onClick={onEdit}>
          {lead.close_crm_id ? (
            <span className="text-green-600" title={`Exported: ${lead.close_crm_id}`}>✓</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      )}
      {activeColumns.actions && (
        <td className="px-3 py-2 whitespace-nowrap text-sm">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                      >
                        <PencilSquareIcon className="mr-3 h-4 w-4" />
                        Edit Lead
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckPlatforms(lead.id);
                        }}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                      >
                        <GlobeAltIcon className="mr-3 h-4 w-4" />
                        Check Ad Platforms
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
                          active ? 'bg-red-50 text-red-900' : 'text-red-700'
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