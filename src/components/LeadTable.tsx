import { useState } from 'react';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import { CheckIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { deleteLead as deleteLeadAPI, deleteLeads as deleteLeadsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import EditLeadModal from './modals/EditLeadModal';
import BulkEditModal from './modals/BulkEditModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function LeadTable() {
  const { leads, sourceFilter, deleteLead, selectedLeads: storeSelectedLeads, setSelectedLeads } = useLeadStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    if (lead.lead_source === 'Instagram Manual' && !sourceFilter.instagram) return false;
    if (lead.lead_source === 'FB Ad Library' && !sourceFilter.adLibrary) return false;
    if (lead.lead_source === 'Google Maps' && !sourceFilter.googleMaps) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (storeSelectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
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

  return (
    <>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {storeSelectedLeads.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {storeSelectedLeads.length} lead{storeSelectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Edit selected leads (⌘+E or Ctrl+E)"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Edit Selected
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                title="Delete selected leads (Delete key)"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={storeSelectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <LeadRow 
                  key={lead.id} 
                  lead={lead} 
                  selected={storeSelectedLeads.includes(lead.id)}
                  onToggleSelect={() => toggleSelect(lead.id)}
                  onDelete={() => handleDeleteSingle(lead.id)}
                  onEdit={() => handleEditLead(lead)}
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
    </>
  );
}

interface LeadRowProps {
  lead: Lead;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function LeadRow({ lead, selected, onToggleSelect, onDelete, onEdit }: LeadRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={onEdit}>
        {lead.handle || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={onEdit}>
        <div className="text-sm font-medium text-gray-900">{lead.company_name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={onEdit}>
        {lead.service_type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={onEdit}>
        {lead.city}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={onEdit}>
        {lead.phone || <span className="text-gray-400">Need phone</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex gap-2">
          {lead.instagram_url && (
            <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800" onClick={(e) => e.stopPropagation()}>
              📸
            </a>
          )}
          {lead.website && (
            <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" onClick={(e) => e.stopPropagation()}>
              🌐
            </a>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={onEdit}>
        {lead.lead_source}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer" onClick={onEdit}>
        {lead.running_ads && <CheckIcon className="h-5 w-5 text-green-500" />}
        {!lead.running_ads && <span className="text-red-500">✗</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={onEdit}>
        <div className="max-w-xs truncate" title={lead.notes || undefined}>
          {lead.notes || '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer" onClick={onEdit}>
        {lead.close_crm_id ? (
          <span className="text-green-600" title={`Exported: ${lead.close_crm_id}`}>✓</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-600 hover:text-red-900"
          title="Delete lead"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}