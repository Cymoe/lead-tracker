import { useLeadStore } from '@/lib/store';

export default function SourceFilter() {
  const { sourceFilter, toggleSourceFilter } = useLeadStore();

  return (
    <div className="flex gap-4 mb-4">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={sourceFilter.instagram}
          onChange={() => toggleSourceFilter('instagram')}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">Instagram Manual</span>
      </label>
      
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={sourceFilter.adLibrary}
          onChange={() => toggleSourceFilter('adLibrary')}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">FB Ad Library</span>
      </label>
      
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={sourceFilter.googleMaps}
          onChange={() => toggleSourceFilter('googleMaps')}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">Google Maps</span>
      </label>
    </div>
  );
}