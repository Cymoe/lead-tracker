import { Lead } from '@/types';
import { CheckIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import EditLeadModal from './modals/EditLeadModal';
import AdViewerModal from './modals/AdViewerModal';
import { deleteLead as deleteLeadAPI } from '@/lib/api';
import { useLeadStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ensureProtocol } from '@/utils/csv-parser';
import { normalizeServiceType } from '@/utils/service-type-normalization';

export default function LeadGrid() {
  const { 
    leads, 
    deleteLead, 
    selectedLeads, 
    setSelectedLeads,
    sourceFilter,
    cityFilter,
    serviceTypeFilter
  } = useLeadStore();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdViewerModal, setShowAdViewerModal] = useState(false);
  const [adViewerLead, setAdViewerLead] = useState<Lead | null>(null);

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
    if (serviceTypeFilter !== 'all') {
      const normalizedType = lead.service_type ? normalizeServiceType(lead.service_type) : null;
      if (normalizedType !== serviceTypeFilter) return false;
    }
    
    return true;
  });

  const handleDeleteLead = async (id: string) => {
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

  const toggleSelect = (id: string) => {
    setSelectedLeads(
      selectedLeads.includes(id) 
        ? selectedLeads.filter(i => i !== id)
        : [...selectedLeads, id]
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleEditLead(lead)}
          >
            {/* Selection checkbox */}
            <div className="flex items-start justify-between mb-4">
              <input
                type="checkbox"
                checked={selectedLeads.includes(lead.id)}
                onChange={() => toggleSelect(lead.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLead(lead.id);
                  }}
                  className="text-red-600 hover:text-red-900"
                  title="Delete lead"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Company info */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{lead.company_name}</h3>
            {lead.handle && (
              <p className="text-sm text-gray-600 mb-2">{lead.handle}</p>
            )}

            {/* Service type and location */}
            <div className="space-y-1 mb-4">
              <p className="text-sm text-gray-600">{lead.normalized_service_type || lead.service_type}</p>
              <p className="text-sm text-gray-500">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>
            </div>

            {/* Contact info */}
            <div className="space-y-2 mb-4">
              {lead.phone && (
                <p className="text-sm text-gray-600">📞 {lead.phone}</p>
              )}
              {lead.email && (
                <p className="text-sm text-gray-600 truncate">✉️ {lead.email}</p>
              )}
            </div>

            {/* Rating */}
            {lead.rating && (
              <div className="flex items-center gap-1 mb-4">
                <span className="text-sm font-medium">{lead.rating}</span>
                <span className="text-yellow-500">⭐</span>
                {lead.review_count && (
                  <span className="text-sm text-gray-500">({lead.review_count})</span>
                )}
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 mb-4">
              {lead.instagram_url && (
                <a 
                  href={lead.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-pink-600 hover:text-pink-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  📸
                </a>
              )}
              {lead.website && (
                <a 
                  href={ensureProtocol(lead.website) || undefined} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  🌐
                </a>
              )}
              {lead.google_maps_url && (
                <a 
                  href={lead.google_maps_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-green-600 hover:text-green-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  📍
                </a>
              )}
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {/* Source badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                lead.lead_source === 'Google Maps' ? 'bg-blue-100 text-blue-800' :
                lead.lead_source === 'FB Ad Library' ? 'bg-indigo-100 text-indigo-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {lead.lead_source}
              </span>

              {/* Ad status */}
              <div className="flex items-center">
                {lead.running_ads ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-red-500 text-sm">✗</span>
                )}
              </div>
            </div>
          </div>
        ))}
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
      
      <AdViewerModal
        open={showAdViewerModal}
        onClose={() => {
          setShowAdViewerModal(false);
          setAdViewerLead(null);
        }}
        lead={adViewerLead}
      />
    </>
  );
}