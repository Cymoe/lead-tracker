import { Lead } from '@/types';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  GlobeAltIcon,
  CheckIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/20/solid';

interface MobileLeadCardProps {
  lead: Lead;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MobileLeadCard({
  lead,
  selected,
  onToggleSelect,
  onEdit,
  onDelete
}: MobileLeadCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${
      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    } p-4 mb-3 transition-all`}>
      {/* Header with checkbox and company name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 mt-0.5"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base">
              {lead.company_name}
            </h3>
            {(lead.normalized_service_type || lead.service_type) && (
              <p className="text-sm text-gray-500 mt-0.5">{lead.normalized_service_type || lead.service_type}</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm">
            <PhoneIcon className="h-4 w-4 text-gray-400" />
            <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
              {lead.phone}
            </a>
          </div>
        )}
        
        {lead.email && (
          <div className="flex items-center gap-2 text-sm">
            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
            <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline truncate">
              {lead.email}
            </a>
          </div>
        )}
        
        {lead.city && (
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{lead.city}</span>
          </div>
        )}
        
        {lead.website && (
          <div className="flex items-center gap-2 text-sm">
            <GlobeAltIcon className="h-4 w-4 text-gray-400" />
            <a 
              href={lead.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              {lead.website}
            </a>
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        {lead.running_ads && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckIconSolid className="h-4 w-4" />
            <span>Running Ads</span>
          </div>
        )}
        
        {lead.rating && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span>⭐ {lead.rating}</span>
            {lead.review_count && (
              <span>({lead.review_count})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}