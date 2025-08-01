import { useState, useEffect } from 'react';
import USCityAutocomplete from './USCityAutocomplete';

interface SimpleCitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  useComprehensiveData?: boolean; // New prop to opt-in to full city data
}

// Top 20 most populated US cities for initial display - diverse geographic representation
const POPULAR_CITIES = [
  "New York, NY",
  "Los Angeles, CA", 
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Indianapolis, IN",
  "Charlotte, NC",
  "San Francisco, CA",
  "Seattle, WA",
  "Denver, CO",
  "Washington, DC"
];

// All cities organized by state for comprehensive coverage
const ALL_CITIES = [
  // Popular cities first (already defined above)
  ...POPULAR_CITIES,
  
  // Alabama
  "Birmingham, AL", "Montgomery, AL", "Mobile, AL", "Huntsville, AL",
  
  // Alaska
  "Anchorage, AK", "Fairbanks, AK", "Juneau, AK",
  
  // Arizona (additional)
  "Tucson, AZ", "Mesa, AZ", "Chandler, AZ", "Scottsdale, AZ", 
  "Gilbert, AZ", "Tempe, AZ", "Peoria, AZ", "Surprise, AZ", "Glendale, AZ",
  
  // Arkansas
  "Little Rock, AR", "Fort Smith, AR", "Fayetteville, AR",
  
  // California (additional)
  "Fresno, CA", "Sacramento, CA", "Oakland, CA", "Bakersfield, CA", 
  "Anaheim, CA", "Riverside, CA", "Santa Ana, CA", "Irvine, CA",
  "Long Beach, CA", "Stockton, CA", "Fremont, CA", "San Bernardino, CA",
  
  // Colorado (additional)
  "Colorado Springs, CO", "Aurora, CO", "Fort Collins, CO",
  
  // Connecticut
  "Hartford, CT", "New Haven, CT", "Bridgeport, CT", "Stamford, CT",
  
  // Delaware
  "Wilmington, DE", "Dover, DE", "Newark, DE",
  
  // Florida (additional)
  "Miami, FL", "Tampa, FL", "Orlando, FL", "St. Petersburg, FL",
  "Hialeah, FL", "Tallahassee, FL", "Fort Lauderdale, FL", "Pembroke Pines, FL",
  
  // Georgia (additional)
  "Atlanta, GA", "Augusta, GA", "Savannah, GA",
  
  // Hawaii
  "Honolulu, HI", "Pearl City, HI", "Hilo, HI",
  
  // Idaho
  "Boise, ID", "Meridian, ID", "Nampa, ID",
  
  // Illinois (additional)
  "Aurora, IL", "Rockford, IL", "Naperville, IL",
  
  // Indiana (additional)
  "Fort Wayne, IN", "Evansville, IN", "South Bend, IN",
  
  // Iowa
  "Des Moines, IA", "Cedar Rapids, IA", "Davenport, IA",
  
  // Kansas
  "Wichita, KS", "Kansas City, KS", "Topeka, KS",
  
  // Kentucky
  "Louisville, KY", "Lexington, KY", "Bowling Green, KY",
  
  // Louisiana
  "New Orleans, LA", "Baton Rouge, LA", "Shreveport, LA",
  
  // Maine
  "Portland, ME", "Augusta, ME", "Bangor, ME",
  
  // Maryland
  "Baltimore, MD", "Annapolis, MD", "Rockville, MD",
  
  // Massachusetts
  "Boston, MA", "Worcester, MA", "Springfield, MA", "Cambridge, MA",
  
  // Michigan
  "Detroit, MI", "Grand Rapids, MI", "Ann Arbor, MI",
  
  // Minnesota
  "Minneapolis, MN", "St. Paul, MN", "Rochester, MN",
  
  // Mississippi
  "Jackson, MS", "Gulfport, MS", "Biloxi, MS",
  
  // Missouri
  "Kansas City, MO", "St. Louis, MO", "Springfield, MO",
  
  // Montana
  "Billings, MT", "Missoula, MT", "Great Falls, MT",
  
  // Nebraska
  "Omaha, NE", "Lincoln, NE", "Bellevue, NE",
  
  // Nevada
  "Las Vegas, NV", "Henderson, NV", "Reno, NV", "North Las Vegas, NV",
  
  // New Hampshire
  "Manchester, NH", "Nashua, NH", "Concord, NH",
  
  // New Jersey
  "Newark, NJ", "Jersey City, NJ", "Paterson, NJ", "Elizabeth, NJ",
  
  // New Mexico
  "Albuquerque, NM", "Santa Fe, NM", "Las Cruces, NM",
  
  // New York (additional)
  "Buffalo, NY", "Rochester, NY", "Syracuse, NY", "Albany, NY",
  
  // North Carolina (additional)
  "Raleigh, NC", "Greensboro, NC", "Durham, NC", "Winston-Salem, NC",
  
  // North Dakota
  "Fargo, ND", "Bismarck, ND", "Grand Forks, ND",
  
  // Ohio (additional)
  "Cleveland, OH", "Cincinnati, OH", "Toledo, OH", "Akron, OH",
  
  // Oklahoma
  "Oklahoma City, OK", "Tulsa, OK", "Norman, OK",
  
  // Oregon
  "Portland, OR", "Eugene, OR", "Salem, OR",
  
  // Pennsylvania (additional)
  "Pittsburgh, PA", "Allentown, PA", "Erie, PA",
  
  // Rhode Island
  "Providence, RI", "Warwick, RI", "Cranston, RI",
  
  // South Carolina
  "Charleston, SC", "Columbia, SC", "Greenville, SC",
  
  // South Dakota
  "Sioux Falls, SD", "Rapid City, SD", "Aberdeen, SD",
  
  // Tennessee
  "Nashville, TN", "Memphis, TN", "Knoxville, TN",
  
  // Texas (additional)
  "El Paso, TX", "Arlington, TX", "Plano, TX", "Laredo, TX", "Irving, TX",
  "Corpus Christi, TX", "Garland, TX", "Lubbock, TX",
  
  // Utah
  "Salt Lake City, UT", "Provo, UT", "West Valley City, UT",
  
  // Vermont
  "Burlington, VT", "Montpelier, VT", "Rutland, VT",
  
  // Virginia
  "Virginia Beach, VA", "Norfolk, VA", "Richmond, VA", "Newport News, VA",
  
  // Washington (additional)
  "Spokane, WA", "Tacoma, WA", "Bellevue, WA",
  
  // West Virginia
  "Charleston, WV", "Huntington, WV", "Morgantown, WV",
  
  // Wisconsin
  "Milwaukee, WI", "Madison, WI", "Green Bay, WI",
  
  // Wyoming
  "Cheyenne, WY", "Casper, WY", "Laramie, WY"
];

// Remove duplicates and ensure unique cities
const UNIQUE_CITIES = Array.from(new Set(ALL_CITIES));

// State abbreviations for search
const STATE_ABBR: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

// Create array of state objects for display
const US_STATES = Object.entries(STATE_ABBR).map(([code, name]) => ({
  code,
  name,
  displayName: `${code} - ${name}`
})).sort((a, b) => a.name.localeCompare(b.name));

export default function SimpleCitySearch({
  value,
  onChange,
  placeholder = "Type or select a city...",
  className = "",
  required = false,
  useComprehensiveData = false
}: SimpleCitySearchProps) {
  console.log('SimpleCitySearch - US_STATES count:', US_STATES.length);
  // Temporarily comment out to ensure we use our new implementation
  // if (useComprehensiveData) {
  //   return (
  //     <USCityAutocomplete
  //       value={value}
  //       onChange={onChange}
  //       placeholder={placeholder}
  //       className={className}
  //       required={required}
  //     />
  //   );
  // }
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'states' | 'cities' | 'search'>('states');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Load recent cities from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentCities');
    if (stored) {
      setRecentCities(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const saveToRecentCities = (city: string) => {
    const updated = [city, ...recentCities.filter(c => c !== city)].slice(0, 5);
    setRecentCities(updated);
    localStorage.setItem('recentCities', JSON.stringify(updated));
  };

  const searchCities = (searchTerm: string) => {
    const term = searchTerm.toLowerCase().trim();
    
    // Check if searching by state abbreviation
    const stateAbbr = term.toUpperCase();
    if (STATE_ABBR[stateAbbr]) {
      return UNIQUE_CITIES.filter(city => 
        city.endsWith(`, ${stateAbbr}`)
      );
    }
    
    // Regular city search
    const filtered = UNIQUE_CITIES.filter(city => 
      city.toLowerCase().includes(term)
    );
    
    // Sort results to prioritize:
    // 1. Exact matches
    // 2. Starts with search term
    // 3. Popular cities
    // 4. Others
    return filtered.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact match
      if (aLower === term) return -1;
      if (bLower === term) return 1;
      
      // Starts with
      const aStarts = aLower.startsWith(term);
      const bStarts = bLower.startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Popular cities
      const aPopular = POPULAR_CITIES.includes(a);
      const bPopular = POPULAR_CITIES.includes(b);
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;
      
      return 0;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.length >= 1) {
      const filtered = searchCities(newValue);
      setFilteredCities(filtered.slice(0, 20)); // Show max 20 results
      setDisplayMode('search');
      setShowDropdown(true);
    } else if (newValue.length === 0) {
      // Show states when empty
      setDisplayMode('states');
      setSelectedState(null);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setInputValue(city);
    onChange(city);
    saveToRecentCities(city);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            console.log('SimpleCitySearch onFocus - inputValue:', inputValue, 'length:', inputValue.length);
            if (inputValue.length === 0) {
              // Show states when focused with empty input
              console.log('Setting display mode to states');
              setDisplayMode('states');
              setSelectedState(null);
              setShowDropdown(true);
            } else {
              // Show search results for non-empty input
              const filtered = searchCities(inputValue);
              setFilteredCities(filtered.slice(0, 20));
              setDisplayMode('search');
              setShowDropdown(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click on dropdown
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            console.log('Dropdown button clicked!');
            setDisplayMode('states');
            setSelectedState(null);
            setShowDropdown(!showDropdown);
          }}
          className="absolute inset-y-0 right-0 px-3 flex items-center"
        >
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto">
          {/* State Selection Mode */}
          {displayMode === 'states' && (
            <>
              <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b sticky top-0">
                🏙️ Select a State ({US_STATES.length} states available)
              </div>
              {US_STATES.map((state) => (
                <div
                  key={state.code}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between group"
                  onClick={() => {
                    setSelectedState(state.code);
                    setDisplayMode('cities');
                    const stateCities = UNIQUE_CITIES.filter(city => 
                      city.endsWith(`, ${state.code}`)
                    );
                    setFilteredCities(stateCities);
                  }}
                >
                  <span className="font-medium">{state.displayName}</span>
                  <span className="text-gray-400 text-sm group-hover:text-gray-600">
                    {UNIQUE_CITIES.filter(city => city.endsWith(`, ${state.code}`)).length} cities
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
                <span>{STATE_ABBR[selectedState]} Cities</span>
              </div>
              {filteredCities.map((city, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectCity(city)}
                >
                  {city}
                </div>
              ))}
            </>
          )}

          {/* Search Mode */}
          {displayMode === 'search' && (
            <>
              {/* Recent cities if available */}
              {inputValue.length === 0 && recentCities.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                    Recent Cities
                  </div>
                  {recentCities.filter(c => UNIQUE_CITIES.includes(c)).map((city, index) => (
                    <div
                      key={`recent-${index}`}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelectCity(city)}
                    >
                      {city}
                    </div>
                  ))}
                </>
              )}
              
              {/* Search results */}
              {filteredCities.map((city, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectCity(city)}
                >
                  {city}
                </div>
              ))}
              
              {/* Help text for state search */}
              {inputValue.length === 2 && STATE_ABBR[inputValue.toUpperCase()] && (
                <div className="px-3 py-1 text-xs text-gray-500 bg-gray-50">
                  Showing cities in {STATE_ABBR[inputValue.toUpperCase()]}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}