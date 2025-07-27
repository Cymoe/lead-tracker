import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { marketDataAggregator } from '@/services/market-data-aggregator';

interface RefreshDataButtonProps {
  onRefresh: () => void;
}

export default function RefreshDataButton({ onRefresh }: RefreshDataButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear the cache to force fresh data
      marketDataAggregator.clearCache();
      
      // Call parent refresh handler
      await onRefresh();
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just refreshed';
    if (diffMins < 60) return `Refreshed ${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `Refreshed ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          ${isRefreshing 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }
          transition-colors shadow-sm
        `}
        title="Refresh market data from all sources"
      >
        <ArrowPathIcon 
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      
      {lastRefresh && !isRefreshing && (
        <span className="text-xs text-gray-500">
          {formatLastRefresh()}
        </span>
      )}
    </div>
  );
}