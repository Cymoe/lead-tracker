import { useLeadStore } from '@/lib/store';

export default function DebugLeadSources() {
  const { leads, sourceFilter } = useLeadStore();
  
  // Get unique lead sources
  const sources = new Map<string, number>();
  leads.forEach(lead => {
    const source = lead.lead_source || 'null';
    sources.set(source, (sources.get(source) || 0) + 1);
  });
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md">
      <h3 className="font-bold mb-2">Debug: Lead Sources</h3>
      <div className="mb-2">
        <strong>Actual sources in data:</strong>
        {Array.from(sources.entries()).map(([source, count]) => (
          <div key={source}>"{source}": {count} leads</div>
        ))}
      </div>
      <div>
        <strong>Current filter state:</strong>
        <div>Instagram: {sourceFilter.instagram ? 'ON' : 'OFF'}</div>
        <div>FB Ad Library: {sourceFilter.adLibrary ? 'ON' : 'OFF'}</div>
        <div>Google Maps: {sourceFilter.googleMaps ? 'ON' : 'OFF'}</div>
        <div>CSV Import: {sourceFilter.csvImport ? 'ON' : 'OFF'}</div>
      </div>
    </div>
  );
}