import { useLeadStore } from '@/lib/store';

export default function SourceFilter() {
  const { sourceFilter, toggleSourceFilter, setSourceFilter, leads } = useLeadStore();

  // Count leads by source
  const counts = {
    instagram: leads.filter(lead => lead.lead_source === 'Instagram Manual').length,
    adLibrary: leads.filter(lead => lead.lead_source === 'FB Ad Library').length,
    googleMaps: leads.filter(lead => lead.lead_source === 'Google Maps').length,
    csvImport: leads.filter(lead => lead.lead_source === 'CSV Import').length,
    total: leads.length
  };

  // Count multi-source leads
  const multiSourceCount = leads.filter(lead => 
    (lead.lead_source === 'Google Maps' && lead.running_ads) ||
    (lead.lead_source === 'FB Ad Library' && lead.google_maps_url) ||
    (lead.ad_platforms && lead.ad_platforms.filter(p => p.hasAds).length > 0 && lead.lead_source === 'Google Maps')
  ).length;

  // Check if all filters are active (show all)
  const allActive = sourceFilter.instagram && sourceFilter.adLibrary && sourceFilter.googleMaps && sourceFilter.csvImport;

  const handleFilterClick = (source: 'instagram' | 'adLibrary' | 'googleMaps' | 'csvImport') => {
    // If clicking an active filter when others are off, show all
    if (sourceFilter[source] && !allActive) {
      setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true });
    } else {
      // Otherwise, show only the clicked source
      setSourceFilter({ 
        instagram: source === 'instagram',
        adLibrary: source === 'adLibrary',
        googleMaps: source === 'googleMaps',
        csvImport: source === 'csvImport'
      });
    }
  };

  const handleMultiSourceClick = () => {
    // Set all to false to trigger multi-source only mode
    setSourceFilter({ instagram: false, adLibrary: false, googleMaps: false, csvImport: false });
  };

  // Check if we're in multi-source mode
  const isMultiSourceMode = !sourceFilter.instagram && !sourceFilter.adLibrary && !sourceFilter.googleMaps && !sourceFilter.csvImport;

  return (
    <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Source</h3>
        {multiSourceCount > 0 && (
          <button
            onClick={handleMultiSourceClick}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
              isMultiSourceMode
                ? 'bg-yellow-500 text-black font-medium'
                : 'text-yellow-400 bg-gray-800 dark:bg-gray-900 border border-gray-600 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-yellow-300'
            }`}
          >
            <span>🔗</span>
            <span className="font-medium">{multiSourceCount} multi-source</span>
          </button>
        )}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true })}
          className={`px-4 py-2 rounded-lg border transition-all ${
            allActive && !isMultiSourceMode
              ? 'bg-yellow-500 border-yellow-600 text-black font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-sm font-medium">All Sources ({counts.total})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('instagram')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.instagram && !allActive
              ? 'bg-blue-500 border-blue-600 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-sm font-medium">📷 Instagram ({counts.instagram})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('adLibrary')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.adLibrary && !allActive
              ? 'bg-blue-500 border-blue-600 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-sm font-medium">📘 FB Ad Library ({counts.adLibrary})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('googleMaps')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.googleMaps && !allActive
              ? 'bg-blue-500 border-blue-600 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-sm font-medium">📍 Google Maps ({counts.googleMaps})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('csvImport')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.csvImport && !allActive
              ? 'bg-purple-500 border-purple-600 text-white font-medium'
              : 'bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-sm font-medium">📄 CSV Import ({counts.csvImport})</span>
        </button>
      </div>
    </div>
  );
}