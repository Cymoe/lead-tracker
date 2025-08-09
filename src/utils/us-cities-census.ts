// Comprehensive US Cities from Census Data
// This module provides access to 29,880+ US cities with coordinates

export interface CensusCity {
  id: number;
  name: string;
  state: string;
  stateCode: string;
  county: string;
  lat: number;
  lng: number;
}

// Cache for cities data
let citiesCache: CensusCity[] | null = null;
let stateCache: Map<string, CensusCity[]> = new Map();
let isLoading = false;
let loadPromise: Promise<CensusCity[]> | null = null;

// URL to the comprehensive US cities CSV data (local file in public folder)
const US_CITIES_CSV_URL = '/data/us_cities.csv';

// Parse CSV line
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    result.push(current.trim());
  }
  
  return result;
}

// Load cities data from CSV
export async function loadCensusCities(): Promise<CensusCity[]> {
  // Return cached data if available
  if (citiesCache) {
    return citiesCache;
  }
  
  // Return existing promise if already loading
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  // Start loading
  isLoading = true;
  
  loadPromise = fetch(US_CITIES_CSV_URL)
    .then(response => {
      console.log('Census data response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(csvText => {
      console.log('CSV data length:', csvText.length);
      const lines = csvText.split('\n');
      console.log('Total lines in CSV:', lines.length);
      const cities: CensusCity[] = [];
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = parseCSVLine(line);
        if (parts.length >= 7) {
          const city: CensusCity = {
            id: parseInt(parts[0]),
            stateCode: parts[1],
            state: parts[2],
            name: parts[3].replace(/"/g, ''),
            county: parts[4].replace(/"/g, ''),
            lat: parseFloat(parts[5]),
            lng: parseFloat(parts[6])
          };
          
          cities.push(city);
          
          // Add to state cache
          if (!stateCache.has(city.stateCode)) {
            stateCache.set(city.stateCode, []);
          }
          stateCache.get(city.stateCode)!.push(city);
        }
      }
      
      // Log state statistics
      console.log('State city counts:');
      stateCache.forEach((stateCities, state) => {
        console.log(`${state}: ${stateCities.length} cities`);
        stateCities.sort((a, b) => a.name.localeCompare(b.name));
      });
      
      citiesCache = cities;
      isLoading = false;
      
      console.log(`Successfully loaded ${cities.length} US cities from Census data`);
      return cities;
    })
    .catch(error => {
      console.error('Failed to load Census cities data:', error);
      isLoading = false;
      citiesCache = [];
      return [];
    });
  
  return loadPromise;
}

// Get cities for a specific state
export async function getCensusCitiesByState(stateCode: string): Promise<CensusCity[]> {
  await loadCensusCities();
  const cities = stateCache.get(stateCode) || [];
  
  // Deduplicate cities by name, keeping the first occurrence
  const seen = new Set<string>();
  const deduped: CensusCity[] = [];
  
  for (const city of cities) {
    if (!seen.has(city.name)) {
      seen.add(city.name);
      deduped.push(city);
    }
  }
  
  return deduped;
}

// Search cities
export async function searchCensusCities(
  query: string,
  options: {
    limit?: number;
    stateCode?: string;
  } = {}
): Promise<CensusCity[]> {
  const { limit = 50, stateCode } = options;
  
  await loadCensusCities();
  
  if (!citiesCache) return [];
  
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];
  
  let cities = citiesCache;
  
  // Filter by state if specified
  if (stateCode) {
    cities = stateCache.get(stateCode) || [];
  }
  
  // Search cities
  const results = cities.filter(city => {
    const cityLower = city.name.toLowerCase();
    const fullName = `${city.name}, ${city.stateCode}`.toLowerCase();
    
    return cityLower.includes(searchTerm) || 
           fullName.includes(searchTerm) ||
           city.county.toLowerCase().includes(searchTerm);
  });
  
  // Sort results
  results.sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    
    // Exact matches first
    if (aLower === searchTerm) return -1;
    if (bLower === searchTerm) return 1;
    
    // Then starts with
    const aStarts = aLower.startsWith(searchTerm);
    const bStarts = bLower.startsWith(searchTerm);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // Finally alphabetical
    return a.name.localeCompare(b.name);
  });
  
  // Deduplicate by city name + state code
  const seen = new Set<string>();
  const deduped: CensusCity[] = [];
  
  for (const city of results) {
    const key = `${city.name}, ${city.stateCode}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(city);
    }
  }
  
  return deduped.slice(0, limit);
}

// Get state statistics
export async function getStateStatistics(): Promise<Map<string, number>> {
  await loadCensusCities();
  
  const stats = new Map<string, number>();
  stateCache.forEach((cities, state) => {
    stats.set(state, cities.length);
  });
  
  return stats;
}