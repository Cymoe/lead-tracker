// US Cities data structure
export interface USCity {
  name: string;
  state: string;
  stateCode: string;
  county?: string;
  population?: number;
  lat?: number;
  lng?: number;
}

// State information
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

// Helper to get state name from code
export function getStateName(stateCode: string): string {
  const state = US_STATES.find(s => s.code === stateCode);
  return state?.name || stateCode;
}

// Helper to get state code from name
export function getStateCode(stateName: string): string {
  const state = US_STATES.find(s => 
    s.name.toLowerCase() === stateName.toLowerCase() ||
    s.code.toLowerCase() === stateName.toLowerCase()
  );
  return state?.code || '';
}

// This will be populated with actual Census data
// For now, creating a structure that can be easily replaced with real data
export const US_CITIES_DATA: USCity[] = [];

// Function to load cities data (will be implemented with actual Census data)
export async function loadUSCitiesData(): Promise<USCity[]> {
  // In production, this would fetch from Census API or load from a pre-processed file
  // For now, returning empty array
  return US_CITIES_DATA;
}

// Function to get cities by state
export function getCitiesByState(stateCode: string): USCity[] {
  return US_CITIES_DATA.filter(city => city.stateCode === stateCode);
}

// Function to search cities
export function searchCities(query: string, limit: number = 50): USCity[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return [];
  
  // Check if searching by state
  const stateCode = getStateCode(searchTerm);
  if (stateCode && searchTerm.length <= 2) {
    return getCitiesByState(stateCode).slice(0, limit);
  }
  
  // Search cities
  const results = US_CITIES_DATA.filter(city => {
    const cityLower = city.name.toLowerCase();
    const fullName = `${city.name}, ${city.stateCode}`.toLowerCase();
    
    // Exact match
    if (cityLower === searchTerm || fullName === searchTerm) return true;
    
    // Starts with
    if (cityLower.startsWith(searchTerm) || fullName.startsWith(searchTerm)) return true;
    
    // Contains
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
    
    // Then by population (if available)
    if (a.population && b.population) {
      return b.population - a.population;
    }
    
    // Finally alphabetical
    return a.name.localeCompare(b.name);
  });
  
  return results.slice(0, limit);
}

// Popular US cities (with population for reference)
export const POPULAR_US_CITIES: USCity[] = [
  { name: "New York", state: "New York", stateCode: "NY", population: 8336817 },
  { name: "Los Angeles", state: "California", stateCode: "CA", population: 3979576 },
  { name: "Chicago", state: "Illinois", stateCode: "IL", population: 2693976 },
  { name: "Houston", state: "Texas", stateCode: "TX", population: 2320268 },
  { name: "Phoenix", state: "Arizona", stateCode: "AZ", population: 1680992 },
  { name: "Philadelphia", state: "Pennsylvania", stateCode: "PA", population: 1584064 },
  { name: "San Antonio", state: "Texas", stateCode: "TX", population: 1547253 },
  { name: "San Diego", state: "California", stateCode: "CA", population: 1423851 },
  { name: "Dallas", state: "Texas", stateCode: "TX", population: 1343573 },
  { name: "San Jose", state: "California", stateCode: "CA", population: 1021795 },
  { name: "Austin", state: "Texas", stateCode: "TX", population: 978908 },
  { name: "Jacksonville", state: "Florida", stateCode: "FL", population: 911507 },
  { name: "Fort Worth", state: "Texas", stateCode: "TX", population: 909585 },
  { name: "Columbus", state: "Ohio", stateCode: "OH", population: 898553 },
  { name: "Charlotte", state: "North Carolina", stateCode: "NC", population: 885708 },
  { name: "San Francisco", state: "California", stateCode: "CA", population: 881549 },
  { name: "Indianapolis", state: "Indiana", stateCode: "IN", population: 876384 },
  { name: "Seattle", state: "Washington", stateCode: "WA", population: 753675 },
  { name: "Denver", state: "Colorado", stateCode: "CO", population: 727211 },
  { name: "Washington", state: "District of Columbia", stateCode: "DC", population: 705749 }
];