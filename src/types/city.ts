export interface City {
  name: string;
  state: string;
  stateCode: string;
  county?: string;
  population?: number;
  lat?: number;
  lng?: number;
  rank?: number; // Population rank for sorting
}

export interface CitySearchResult extends City {
  displayName: string; // "Phoenix, AZ"
  searchScore?: number; // For fuzzy search ranking
}

export interface CityDataTier {
  instant: City[];      // Top 200 cities
  fast: City[];        // Next 2,000 cities
  onDemand?: string;   // URL to fetch remaining cities
}

export interface CityCache {
  version: string;
  timestamp: number;
  cities: City[];
  expires: number; // Timestamp when cache expires
}