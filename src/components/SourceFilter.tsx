import { useLeadStore } from '@/lib/store';

export default function SourceFilter() {
  const { sourceFilter, toggleSourceFilter } = useLeadStore();

  return (
    <div className="flex gap-3 mb-6">
      <button
        onClick={() => toggleSourceFilter('instagram')}
        className={`px-4 py-2 rounded-lg border transition-all ${
          sourceFilter.instagram
            ? 'bg-green-900/20 border-green-700/50 text-white'
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600'
        }`}
      >
        <span className="text-sm font-medium">Instagram Manual</span>
      </button>
      
      <button
        onClick={() => toggleSourceFilter('adLibrary')}
        className={`px-4 py-2 rounded-lg border transition-all ${
          sourceFilter.adLibrary
            ? 'bg-green-900/20 border-green-700/50 text-white'
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600'
        }`}
      >
        <span className="text-sm font-medium">FB Ad Library</span>
      </button>
      
      <button
        onClick={() => toggleSourceFilter('googleMaps')}
        className={`px-4 py-2 rounded-lg border transition-all ${
          sourceFilter.googleMaps
            ? 'bg-green-900/20 border-green-700/50 text-white'
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600'
        }`}
      >
        <span className="text-sm font-medium">Google Maps</span>
      </button>
    </div>
  );
}