import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import { 
  loadCensusCities, 
  getCensusCitiesByState, 
  searchCensusCities,
  getStateStatistics,
  type CensusCity 
} from '@/utils/us-cities-census';
import { US_STATES } from '@/utils/us-cities-data';

interface USCityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  maxResults?: number;
}

interface CityData {
  name: string;
  stateCode: string;
  stateName: string;
  displayName: string;
  county?: string;
  lat?: number;
  lng?: number;
}


export default function USCityAutocomplete({
  value,
  onChange,
  placeholder = "Search for any US city...",
  className = "",
  required = false,
  maxResults = 50
}: USCityAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredCities, setFilteredCities] = useState<CityData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [censusDataLoaded, setCensusDataLoaded] = useState(false);
  const [displayMode, setDisplayMode] = useState<'states' | 'cities' | 'search'>('states');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateStats, setStateStats] = useState<Map<string, number>>(new Map());
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
  const selectedCityRef = useRef<HTMLDivElement>(null);

  // Load Census data on component mount
  useEffect(() => {
    // Load Census data on component mount
    loadCensusCities().then(() => {
      setCensusDataLoaded(true);
      // Get state statistics
      getStateStatistics().then(stats => {
        setStateStats(stats);
      });
    });
  }, []);

  // Scroll to selected city when cities are displayed
  useEffect(() => {
    if (displayMode === 'cities' && selectedCityRef.current && showDropdown) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        selectedCityRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [displayMode, showDropdown, filteredCities]);

  // Convert Census city to CityData format
  const convertCensusCity = useCallback((city: CensusCity): CityData => {
    return {
      name: city.name,
      stateCode: city.stateCode,
      stateName: city.state,
      displayName: `${city.name}, ${city.stateCode}`,
      county: city.county,
      lat: city.lat,
      lng: city.lng
    };
  }, []);


  // Search function using Census data
  const searchCities = useCallback(async (term: string): Promise<CityData[]> => {
    if (!term || term.length < 1) return [];

    const searchLower = term.toLowerCase().trim();
    
    // Check if searching by state abbreviation
    const stateCode = searchLower.length === 2 ? searchLower.toUpperCase() : undefined;
    
    // Search using Census data
    const results = await searchCensusCities(searchLower, {
      limit: maxResults,
      stateCode: stateCode
    });
    
    return results.map(convertCensusCity);
  }, [maxResults, convertCensusCity]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (term.length >= 1) {
        setLoading(true);
        const results = await searchCities(term);
        setFilteredCities(results);
        setShowDropdown(true);
        setLoading(false);
      } else {
        setFilteredCities([]);
        setShowDropdown(false);
      }
    }, 300),
    [searchCities]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setDisplayMode('search');
    debouncedSearch(newValue);
  };

  // Handle city selection
  const handleSelectCity = (city: CityData) => {
    const cityString = city.displayName;
    setSearchTerm(cityString);
    onChange(cityString);
    setSelectedState(city.stateCode); // Remember which state was selected
    setShowDropdown(false);
  };

  // Handle focus
  const handleFocus = async () => {
    setShowDropdown(true);
    
    // If we have a selected value that looks like a city
    if (searchTerm.includes(', ')) {
      const parts = searchTerm.split(', ');
      const stateCode = parts[parts.length - 1].trim();
      
      // Check if it's a valid state code
      const state = US_STATES.find(s => s.code === stateCode);
      if (state && !selectedState) {
        // Load cities for this state
        setSelectedState(stateCode);
        setDisplayMode('cities');
        setLoading(true);
        
        const stateCities = await getCensusCitiesByState(stateCode);
        const formattedCities = stateCities.map(convertCensusCity);
        setFilteredCities(formattedCities);
        setLoading(false);
        return;
      }
    }
    
    // If user has typed something else, search for it
    if (searchTerm.length >= 1 && !searchTerm.includes(', ')) {
      setDisplayMode('search');
      debouncedSearch(searchTerm);
    }
    // Otherwise show states (or cities if already in that mode)
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => {
            if (!isInteractingWithDropdown) {
              setShowDropdown(false);
            }
          }, 200)}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required={required}
          autoComplete="off"
        />
        
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // If dropdown is open, close it
            if (showDropdown) {
              setShowDropdown(false);
              return;
            }
            
            // If we have a selected city, show its state's cities
            if (searchTerm.includes(', ')) {
              const parts = searchTerm.split(', ');
              const stateCode = parts[parts.length - 1].trim();
              const state = US_STATES.find(s => s.code === stateCode);
              
              if (state) {
                setSelectedState(stateCode);
                setDisplayMode('cities');
                setShowDropdown(true);
                setLoading(true);
                
                const stateCities = await getCensusCitiesByState(stateCode);
                const formattedCities = stateCities.map(convertCensusCity);
                setFilteredCities(formattedCities);
                setLoading(false);
                return;
              }
            }
            
            // Otherwise show states
            setDisplayMode('states');
            setSelectedState(null);
            setShowDropdown(true);
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent focus change
          className="absolute inset-y-0 right-0 px-3 flex items-center"
        >
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {loading && displayMode === 'search' && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
      
      {showDropdown && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto"
          onMouseEnter={() => setIsInteractingWithDropdown(true)}
          onMouseLeave={() => setIsInteractingWithDropdown(false)}>
          {/* State Selection Mode */}
          {displayMode === 'states' && (
            <>
              <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b sticky top-0">
                🏙️ Select a State
              </div>
              {US_STATES.map((state) => (
                <div
                  key={state.code}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between group"
                  onClick={async () => {
                    setSelectedState(state.code);
                    setDisplayMode('cities');
                    setLoading(true);
                    
                    // Load cities for this state from Census data
                    const stateCities = await getCensusCitiesByState(state.code);
                    console.log(`Loaded ${stateCities.length} cities for ${state.name} (${state.code})`);
                    const formattedCities = stateCities.map(convertCensusCity);
                    
                    setFilteredCities(formattedCities);
                    setLoading(false);
                  }}
                >
                  <span className="font-medium">{state.name}</span>
                  <span className="text-gray-400 text-sm group-hover:text-gray-600">
                    {state.code} • {stateStats.get(state.code) || 0} cities
                  </span>
                </div>
              ))}
            </>
          )}

          {/* City Selection Mode (after state selection) */}
          {displayMode === 'cities' && selectedState && (
            <>
              <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b sticky top-0 flex items-center justify-between">
                <button
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDisplayMode('states');
                    setSelectedState(null);
                  }}
                >
                  ← Back to States
                </button>
                <span>{US_STATES.find(s => s.code === selectedState)?.name} Cities</span>
              </div>
              {loading ? (
                <div className="px-3 py-4 text-center text-gray-500">
                  Loading cities...
                </div>
              ) : (
                filteredCities.map((city, index) => {
                  const isSelected = searchTerm === city.displayName;
                  return (
                    <div
                      key={`${city.stateCode}-${city.name}-${index}`}
                      ref={isSelected ? selectedCityRef : null}
                      className={`px-3 py-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-900 font-medium' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectCity(city)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{city.name}</span>
                        {isSelected && (
                          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Search Mode */}
          {displayMode === 'search' && searchTerm.length > 0 && (
            <>
              {/* Search Results */}
                <>
                  {loading ? (
                    <div className="px-3 py-4 text-center text-gray-500">
                      Searching cities...
                    </div>
                  ) : filteredCities.length > 0 ? (
                    filteredCities.map((city, index) => (
                      <div
                        key={`${city.stateCode}-${city.name}-${index}`}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                        onClick={() => handleSelectCity(city)}
                      >
                        <span>{city.displayName}</span>
                        {city.lat && city.lng && (
                          <span className="text-xs text-gray-500">
                            {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">
                      No cities found matching "{searchTerm}"
                    </div>
                  )}
                </>
            </>
          )}
        </div>
      )}
    </div>
  );
}