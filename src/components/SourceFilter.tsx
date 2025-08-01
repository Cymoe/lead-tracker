import { useLeadStore } from '@/lib/store';

export default function SourceFilter() {
  const { sourceFilter, toggleSourceFilter, setSourceFilter, leads } = useLeadStore();

  // Count leads by source
  const counts = {
    instagram: leads.filter(lead => lead.lead_source === 'Instagram Manual').length,
    adLibrary: leads.filter(lead => lead.lead_source === 'FB Ad Library').length,
    googleMaps: leads.filter(lead => lead.lead_source === 'Google Maps').length,
    total: leads.length
  };

  // Count multi-source leads
  const multiSourceCount = leads.filter(lead => 
    (lead.lead_source === 'Google Maps' && lead.running_ads) ||
    (lead.lead_source === 'FB Ad Library' && lead.google_maps_url) ||
    (lead.ad_platforms && lead.ad_platforms.filter(p => p.hasAds).length > 0 && lead.lead_source === 'Google Maps')
  ).length;

  // Check if all filters are active (show all)
  const allActive = sourceFilter.instagram && sourceFilter.adLibrary && sourceFilter.googleMaps;

  const handleFilterClick = (source: 'instagram' | 'adLibrary' | 'googleMaps') => {
    // If clicking an active filter when others are off, show all
    if (sourceFilter[source] && !allActive) {
      setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true });
    } else {
      // Otherwise, show only the clicked source
      setSourceFilter({ 
        instagram: source === 'instagram',
        adLibrary: source === 'adLibrary',
        googleMaps: source === 'googleMaps'
      });
    }
  };

  const handleMultiSourceClick = () => {
    // Set all to false to trigger multi-source only mode
    setSourceFilter({ instagram: false, adLibrary: false, googleMaps: false });
  };

  // Check if we're in multi-source mode
  const isMultiSourceMode = !sourceFilter.instagram && !sourceFilter.adLibrary && !sourceFilter.googleMaps;

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Filter by Source</h3>
        {multiSourceCount > 0 && (
          <button
            onClick={handleMultiSourceClick}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
              isMultiSourceMode
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'text-purple-600 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100'
            }`}
          >
            <span>🔗</span>
            <span className="font-medium">{multiSourceCount} multi-source</span>
          </button>
        )}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true })}
          className={`px-4 py-2 rounded-lg border transition-all ${
            allActive && !isMultiSourceMode
              ? 'bg-blue-500 border-blue-600 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">All Sources ({counts.total})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('instagram')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.instagram && !allActive
              ? 'bg-purple-500 border-purple-600 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">📷 Instagram ({counts.instagram})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('adLibrary')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.adLibrary && !allActive
              ? 'bg-indigo-500 border-indigo-600 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">📘 FB Ad Library ({counts.adLibrary})</span>
        </button>
        
        <button
          onClick={() => handleFilterClick('googleMaps')}
          className={`px-4 py-2 rounded-lg border transition-all ${
            sourceFilter.googleMaps && !allActive
              ? 'bg-blue-500 border-blue-600 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">📍 Google Maps ({counts.googleMaps})</span>
        </button>
      </div>
    </div>
  );
}