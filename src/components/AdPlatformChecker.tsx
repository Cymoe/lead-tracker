'use client';

import { useState } from 'react';
import { AdPlatformStatus } from '@/types';
import { 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface AdPlatformCheckerProps {
  platforms?: AdPlatformStatus[];
  onPlatformCheck?: (platform: string) => void;
  onViewAds?: (platform: string) => void;
  compact?: boolean;
}

const PLATFORM_CONFIGS = {
  'Google Ads': { color: 'blue', icon: '🔍' },
  'Facebook Ads': { color: 'indigo', icon: '📘' },
  'Instagram Ads': { color: 'purple', icon: '📷' },
  'Nextdoor': { color: 'green', icon: '🏠' },
  'LinkedIn Ads': { color: 'sky', icon: '💼' },
  'Twitter Ads': { color: 'cyan', icon: '🐦' },
  'Yelp Ads': { color: 'red', icon: '⭐' },
  'Angi Ads': { color: 'orange', icon: '🔨' },
  'HomeAdvisor': { color: 'teal', icon: '🏡' },
  'Thumbtack': { color: 'yellow', icon: '👍' },
} as const;

export default function AdPlatformChecker({ platforms = [], onPlatformCheck, onViewAds, compact = false }: AdPlatformCheckerProps) {
  const [checking, setChecking] = useState<string | null>(null);
  
  const handleCheck = async (platform: string) => {
    setChecking(platform);
    if (onPlatformCheck) {
      await onPlatformCheck(platform);
    }
    setTimeout(() => setChecking(null), 1000); // Simulate checking
  };
  
  const getPlatformStatus = (platformName: string) => {
    return platforms.find(p => p.platform === platformName);
  };
  
  if (compact) {
    const activeCount = platforms.filter(p => p.hasAds).length;
    const totalAds = platforms.reduce((sum, p) => sum + (p.ads?.length || 0), 0);
    
    return (
      <div className="flex items-center gap-2">
        {activeCount > 0 ? (
          <>
            <span className="text-sm font-medium text-green-600">{activeCount} Active</span>
            <div className="flex -space-x-1">
              {platforms.filter(p => p.hasAds).slice(0, 3).map((platform) => {
                const config = PLATFORM_CONFIGS[platform.platform];
                return (
                  <div
                    key={platform.platform}
                    className={`w-6 h-6 rounded-full bg-${config.color}-100 border-2 border-white flex items-center justify-center text-xs`}
                    title={`${platform.platform}: ${platform.ads?.length || 0} ads`}
                  >
                    {config.icon}
                  </div>
                );
              })}
              {activeCount > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{activeCount - 3}
                </div>
              )}
            </div>
            {totalAds > 0 && onViewAds && (
              <button
                onClick={() => onViewAds('all')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View {totalAds} ads →
              </button>
            )}
          </>
        ) : (
          <span className="text-sm text-gray-500">No ads detected</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Advertising Platforms</h4>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
          const status = getPlatformStatus(platform);
          const isChecking = checking === platform;
          
          return (
            <div
              key={platform}
              className={`relative p-3 rounded-lg border ${
                status?.hasAds 
                  ? `bg-${config.color}-50 border-${config.color}-200` 
                  : 'bg-gray-50 border-gray-200'
              } transition-all`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{config.icon}</span>
                {status ? (
                  status.hasAds ? (
                    <CheckCircleIcon className={`w-5 h-5 text-${config.color}-600`} />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )
                ) : (
                  <button
                    onClick={() => handleCheck(platform)}
                    disabled={isChecking}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {isChecking ? (
                      <ClockIcon className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">{platform}</p>
                {status && (
                  <>
                    {status.hasAds && status.ads && status.ads.length > 0 && (
                      <p className="text-xs text-gray-600">{status.ads.length} ads</p>
                    )}
                    {status.lastChecked && (
                      <p className="text-xs text-gray-400">
                        {new Date(status.lastChecked).toLocaleDateString()}
                      </p>
                    )}
                    {status.hasAds && status.ads && status.ads.length > 0 && onViewAds && (
                      <button
                        onClick={() => onViewAds(platform)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View ads
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {platforms.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Active Platforms:</span>
            <span className="font-semibold text-gray-900">
              {platforms.filter(p => p.hasAds).length} / {Object.keys(PLATFORM_CONFIGS).length}
            </span>
          </div>
          {platforms.filter(p => p.hasAds).length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Active on: {platforms.filter(p => p.hasAds).map(p => p.platform).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 