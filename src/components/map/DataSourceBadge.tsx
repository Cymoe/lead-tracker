import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DataSourceBadgeProps {
  sources: {
    census?: string;
    economic?: string;
    business?: string;
    lastUpdated?: string;
  };
}

export default function DataSourceBadge({ sources }: DataSourceBadgeProps) {
  if (!sources || !sources.lastUpdated) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just updated';
    if (diffHours < 24) return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return `Updated on ${date.toLocaleDateString()}`;
  };

  return (
    <div className="bg-[#1F2937]/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs border border-[#374151]">
      <div className="flex items-center gap-2">
        <InformationCircleIcon className="h-4 w-4 text-gray-400" />
        <div>
          <div className="font-medium text-white">Data Sources</div>
          <div className="text-gray-400">
            US Census • FRED • BLS • {formatDate(sources.lastUpdated)}
          </div>
        </div>
      </div>
    </div>
  );
}