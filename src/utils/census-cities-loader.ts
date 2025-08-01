// US Census Cities Data Loader
// This module handles loading comprehensive US cities data

import { USCity } from './us-cities-data';

// Cache for loaded cities data
let citiesCache: USCity[] | null = null;
let citiesByStateCache: Map<string, USCity[]> = new Map();

// Public dataset URL - using SimpleMaps comprehensive US cities database
// This includes 30,000+ US cities with population data
const CITIES_DATA_URL = 'https://simplemaps.com/static/data/us-cities/uscities.csv';

// For now, we'll use a static approach with comprehensive data
// In production, this would load from Census API or a CDN-hosted dataset

// Comprehensive city data will be loaded from a JSON file
export async function loadComprehensiveCitiesData(): Promise<USCity[]> {
  if (citiesCache) {
    return citiesCache;
  }

  try {
    // In a real implementation, we'd fetch from a CDN or API
    // For now, we'll use the imported data
    const { US_CITIES_COMPLETE } = await import('@/data/us-cities-complete');
    citiesCache = US_CITIES_COMPLETE;
    
    // Pre-populate state caches
    citiesCache.forEach(city => {
      const stateCode = city.stateCode;
      if (!citiesByStateCache.has(stateCode)) {
        citiesByStateCache.set(stateCode, []);
      }
      citiesByStateCache.get(stateCode)!.push(city);
    });
    
    return citiesCache;
  } catch (error) {
    console.error('Failed to load cities data:', error);
    // Fallback to empty array
    citiesCache = [];
    return citiesCache;
  }
}

// Get cities for a specific state
export async function getCitiesForState(stateCode: string): Promise<USCity[]> {
  // Check cache first
  if (citiesByStateCache.has(stateCode)) {
    return citiesByStateCache.get(stateCode)!;
  }
  
  // Load all cities if not cached
  await loadComprehensiveCitiesData();
  
  return citiesByStateCache.get(stateCode) || [];
}

// Search cities with smart filtering
export async function searchUSCities(
  query: string, 
  options: {
    limit?: number;
    minPopulation?: number;
    stateCode?: string;
  } = {}
): Promise<USCity[]> {
  const { limit = 50, minPopulation = 0, stateCode } = options;
  
  // Ensure cities are loaded
  const allCities = await loadComprehensiveCitiesData();
  
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];
  
  // Filter cities
  let results = allCities.filter(city => {
    // State filter
    if (stateCode && city.stateCode !== stateCode) return false;
    
    // Population filter
    if (minPopulation && city.population && city.population < minPopulation) return false;
    
    // Name matching
    const cityLower = city.name.toLowerCase();
    const fullName = `${city.name}, ${city.stateCode}`.toLowerCase();
    
    return cityLower.includes(searchTerm) || fullName.includes(searchTerm);
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
    
    // Then by population (larger cities first)
    if (a.population && b.population) {
      return b.population - a.population;
    }
    
    // Finally alphabetical
    return a.name.localeCompare(b.name);
  });
  
  return results.slice(0, limit);
}