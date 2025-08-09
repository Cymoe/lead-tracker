/**
 * Standardize market ID creation to prevent duplicates
 */

/**
 * Create a standardized market ID from city and state
 * Always returns format: "city-CityName-ST"
 */
export function createMarketId(city: string, state: string): string {
  const cleanCity = standardizeCityName(city);
  const cleanState = standardizeStateName(state);
  
  return `city-${cleanCity}-${cleanState}`;
}

/**
 * Parse market ID to extract city and state
 */
export function parseMarketId(marketId: string): { city: string; state: string } | null {
  const match = marketId.match(/^city-(.+)-([A-Z]{2})$/);
  if (!match) return null;
  
  return {
    city: match[1],
    state: match[2]
  };
}

/**
 * Create market name from city and state
 * Returns format: "City Name, ST"
 */
export function createMarketName(city: string, state: string): string {
  const cleanCity = standardizeCityName(city);
  const cleanState = standardizeStateName(state);
  
  return `${cleanCity}, ${cleanState}`;
}

/**
 * Parse market name to extract city and state
 * Handles formats like "Amarillo, TX" or "San Antonio, Texas"
 */
export function parseMarketName(marketName: string): { city: string; state: string } | null {
  const parts = marketName.split(',').map(p => p.trim());
  if (parts.length < 2) return null;
  
  const city = parts[0];
  const state = parts[parts.length - 1]; // Last part in case of "City, County, State"
  
  return {
    city: standardizeCityName(city),
    state: standardizeStateName(state)
  };
}

/**
 * Standardize city name formatting
 */
function standardizeCityName(city: string): string {
  if (!city) return '';
  
  // Trim and normalize spacing
  let clean = city.trim().replace(/\s+/g, ' ');
  
  // Capitalize each word properly
  clean = clean.split(' ')
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'de') return 'de'; // Las Vegas de...
      if (word.toLowerCase() === 'la') return 'La'; // La Jolla
      if (word.toLowerCase() === 'el') return 'El'; // El Paso
      if (word.toLowerCase() === 'san') return 'San'; // San Antonio
      if (word.toLowerCase() === 'los') return 'Los'; // Los Angeles
      if (word.toLowerCase() === 'las') return 'Las'; // Las Vegas
      
      // Regular capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  // Replace special characters that might cause issues
  clean = clean.replace(/[^a-zA-Z0-9\s-]/g, '');
  
  return clean;
}

/**
 * Standardize state name to 2-letter abbreviation
 */
function standardizeStateName(state: string): string {
  if (!state) return '';
  
  // If already 2-letter abbreviation
  if (/^[A-Z]{2}$/.test(state.trim())) {
    return state.trim().toUpperCase();
  }
  
  // Map full state names to abbreviations
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };
  
  const normalized = state.trim().toLowerCase();
  return stateMap[normalized] || state.trim().toUpperCase();
}