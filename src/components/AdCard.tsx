'use client';

import { AdCreative } from '@/types';
import { 
  PlayCircleIcon, 
  PhotoIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface AdCardProps {
  ad: AdCreative;
  platform: string;
}

export default function AdCard({ ad, platform }: AdCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    paused: 'bg-yellow-100 text-yellow-800',
  };

  const getAdTypeIcon = () => {
    switch (ad.type) {
      case 'video':
        return <PlayCircleIcon className="h-5 w-5" />;
      case 'image':
      case 'carousel':
        return <PhotoIcon className="h-5 w-5" />;
      case 'text':
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Ad Preview */}
      {(ad.imageUrl || ad.thumbnailUrl) && (
        <div className="relative aspect-video bg-gray-100">
          <img
            src={ad.imageUrl || ad.thumbnailUrl}
            alt={ad.headline || 'Ad preview'}
            className="w-full h-full object-cover"
          />
          {ad.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircleIcon className="h-16 w-16 text-white drop-shadow-lg" />
            </div>
          )}
          {ad.status && (
            <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${statusColors[ad.status]}`}>
              {ad.status}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Platform & Type */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getAdTypeIcon()}
            <span className="font-medium">{platform}</span>
          </div>
          {ad.spend && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>{ad.spend}</span>
            </div>
          )}
        </div>

        {/* Ad Copy */}
        <div className="space-y-2">
          {ad.headline && (
            <h4 className="font-semibold text-gray-900 line-clamp-2">{ad.headline}</h4>
          )}
          {ad.primaryText && (
            <p className="text-sm text-gray-700 line-clamp-3">{ad.primaryText}</p>
          )}
          {ad.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{ad.description}</p>
          )}
        </div>

        {/* CTA */}
        {ad.callToAction && (
          <div className="mt-3">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
              {ad.callToAction}
            </button>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {ad.lastSeen && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CalendarIcon className="h-3 w-3" />
              <span>Last seen: {new Date(ad.lastSeen).toLocaleDateString()}</span>
            </div>
          )}
          
          {ad.targeting && (
            <>
              {ad.targeting.locations && ad.targeting.locations.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{ad.targeting.locations.join(', ')}</span>
                </div>
              )}
              {(ad.targeting.ageRange || ad.targeting.gender) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <UsersIcon className="h-3 w-3" />
                  <span>
                    {[ad.targeting.ageRange, ad.targeting.gender].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </>
          )}

          {ad.impressions && (
            <div className="text-xs text-gray-500">
              {ad.impressions.toLocaleString()} impressions
            </div>
          )}
        </div>

        {/* View Full Ad Link */}
        {ad.linkUrl && (
          <div className="mt-3">
            <a 
              href={ad.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View full ad →
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 