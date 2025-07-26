import { useState, useEffect, useRef, useCallback } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { getCityService } from '@/lib/cityService';
import { CitySearchResult } from '@/types/city';
import debounce from 'lodash/debounce';

interface CitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function CitySearch({
  value,
  onChange,
  placeholder = "Search for a city...",
  className = "",
  required = false
}: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const cityService = useRef(getCityService());
  const loadingRef = useRef(false);

  // Load all cities in the background after component mounts
  useEffect(() => {
    const loadCities = async () => {
      if (!hasLoadedAll && !loadingRef.current) {
        loadingRef.current = true;
        await cityService.current.loadAllCities();
        setHasLoadedAll(true);
        loadingRef.current = false;
        // Re-run search with current query to show more results
        if (query) {
          const newResults = cityService.current.search(query, 50);
          setResults(newResults);
        }
      }
    };

    // Delay loading to prioritize initial render
    const timer = setTimeout(loadCities, 1000);
    return () => clearTimeout(timer);
  }, [hasLoadedAll, query]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchResults = cityService.current.search(searchQuery, 50);
      setResults(searchResults);
      setIsLoading(false);
    }, 300),
    []
  );

  // Handle query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Parse display value back to city object for comparison
  const selectedCity = results.find(city => city.displayName === value) || null;

  return (
    <Combobox 
      value={selectedCity} 
      onChange={(city) => onChange(city?.displayName || '')}
    >
      <div className="relative">
        <div className="relative w-full">
          <Combobox.Input
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${className}`}
            displayValue={(city: CitySearchResult | null) => city?.displayName || value}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>

        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {isLoading && query.length >= 2 && (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              <span className="block truncate">Searching...</span>
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              <span className="block truncate">No cities found</span>
            </div>
          )}

          {results.map((city) => (
            <Combobox.Option
              key={`${city.name}-${city.stateCode}`}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                  active ? 'bg-blue-600 text-white' : 'text-gray-900'
                }`
              }
              value={city}
            >
              {({ selected, active }) => (
                <>
                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                    {city.displayName}
                  </span>
                  {city.population && (
                    <span className={`block text-xs ${active ? 'text-blue-200' : 'text-gray-500'}`}>
                      Population: {city.population.toLocaleString()}
                    </span>
                  )}
                  {selected ? (
                    <span
                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                        active ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : null}
                </>
              )}
            </Combobox.Option>
          ))}

          {!hasLoadedAll && query.length >= 2 && results.length > 0 && (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-500 text-xs border-t">
              <span className="block">Loading more cities...</span>
            </div>
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}