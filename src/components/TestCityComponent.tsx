import { useState } from 'react';
import { State, City } from 'country-state-city';

export default function TestCityComponent() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Test getting US states
      const states = State.getStatesOfCountry('US');
      console.log('US States count:', states.length);
      
      // Test getting cities for California
      const caCities = City.getCitiesOfState('US', 'CA');
      console.log('California cities count:', caCities.length);
      
      setResults(caCities.slice(0, 10)); // Show first 10 CA cities
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Test Country-State-City Package</h3>
      
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Test Load Cities'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">First 10 California Cities:</h4>
          <ul className="space-y-1">
            {results.map((city, i) => (
              <li key={i} className="text-sm">
                {city.name} ({city.latitude}, {city.longitude})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}