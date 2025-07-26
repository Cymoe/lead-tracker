import { City, CityCache, CitySearchResult } from '@/types/city';

const CACHE_VERSION = '1.0.0';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const DB_NAME = 'LeadTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'cities';

export class CityService {
  private db: IDBDatabase | null = null;
  private instantCities: City[] = [];
  private allCities: City[] = [];
  private isLoading = false;
  
  constructor() {
    this.initDB();
    this.loadInstantCities();
  }

  private async initDB(): Promise<void> {
    if (!('indexedDB' in window)) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  private loadInstantCities(): void {
    // Top 100 US cities by population for instant results
    this.instantCities = [
      { name: 'New York', state: 'New York', stateCode: 'NY', population: 8336817, rank: 1 },
      { name: 'Los Angeles', state: 'California', stateCode: 'CA', population: 3979576, rank: 2 },
      { name: 'Chicago', state: 'Illinois', stateCode: 'IL', population: 2693976, rank: 3 },
      { name: 'Houston', state: 'Texas', stateCode: 'TX', population: 2320268, rank: 4 },
      { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ', population: 1680992, rank: 5 },
      { name: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', population: 1584064, rank: 6 },
      { name: 'San Antonio', state: 'Texas', stateCode: 'TX', population: 1547253, rank: 7 },
      { name: 'San Diego', state: 'California', stateCode: 'CA', population: 1423851, rank: 8 },
      { name: 'Dallas', state: 'Texas', stateCode: 'TX', population: 1343573, rank: 9 },
      { name: 'San Jose', state: 'California', stateCode: 'CA', population: 1021795, rank: 10 },
      { name: 'Austin', state: 'Texas', stateCode: 'TX', population: 978908, rank: 11 },
      { name: 'Jacksonville', state: 'Florida', stateCode: 'FL', population: 911507, rank: 12 },
      { name: 'Fort Worth', state: 'Texas', stateCode: 'TX', population: 909585, rank: 13 },
      { name: 'Columbus', state: 'Ohio', stateCode: 'OH', population: 898553, rank: 14 },
      { name: 'Charlotte', state: 'North Carolina', stateCode: 'NC', population: 885708, rank: 15 },
      { name: 'San Francisco', state: 'California', stateCode: 'CA', population: 881549, rank: 16 },
      { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN', population: 876384, rank: 17 },
      { name: 'Seattle', state: 'Washington', stateCode: 'WA', population: 753675, rank: 18 },
      { name: 'Denver', state: 'Colorado', stateCode: 'CO', population: 727211, rank: 19 },
      { name: 'Washington', state: 'District of Columbia', stateCode: 'DC', population: 705749, rank: 20 },
      { name: 'Boston', state: 'Massachusetts', stateCode: 'MA', population: 694583, rank: 21 },
      { name: 'El Paso', state: 'Texas', stateCode: 'TX', population: 681728, rank: 22 },
      { name: 'Nashville', state: 'Tennessee', stateCode: 'TN', population: 670820, rank: 23 },
      { name: 'Detroit', state: 'Michigan', stateCode: 'MI', population: 670031, rank: 24 },
      { name: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK', population: 655057, rank: 25 },
      { name: 'Portland', state: 'Oregon', stateCode: 'OR', population: 654741, rank: 26 },
      { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV', population: 651319, rank: 27 },
      { name: 'Memphis', state: 'Tennessee', stateCode: 'TN', population: 651073, rank: 28 },
      { name: 'Louisville', state: 'Kentucky', stateCode: 'KY', population: 617638, rank: 29 },
      { name: 'Baltimore', state: 'Maryland', stateCode: 'MD', population: 602495, rank: 30 },
      { name: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', population: 592025, rank: 31 },
      { name: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', population: 560513, rank: 32 },
      { name: 'Tucson', state: 'Arizona', stateCode: 'AZ', population: 548073, rank: 33 },
      { name: 'Fresno', state: 'California', stateCode: 'CA', population: 542012, rank: 34 },
      { name: 'Sacramento', state: 'California', stateCode: 'CA', population: 513624, rank: 35 },
      { name: 'Kansas City', state: 'Missouri', stateCode: 'MO', population: 495327, rank: 36 },
      { name: 'Long Beach', state: 'California', stateCode: 'CA', population: 462628, rank: 37 },
      { name: 'Mesa', state: 'Arizona', stateCode: 'AZ', population: 518012, rank: 38 },
      { name: 'Atlanta', state: 'Georgia', stateCode: 'GA', population: 506811, rank: 39 },
      { name: 'Colorado Springs', state: 'Colorado', stateCode: 'CO', population: 478221, rank: 40 },
      { name: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', population: 452745, rank: 41 },
      { name: 'Raleigh', state: 'North Carolina', stateCode: 'NC', population: 474069, rank: 42 },
      { name: 'Omaha', state: 'Nebraska', stateCode: 'NE', population: 486051, rank: 43 },
      { name: 'Miami', state: 'Florida', stateCode: 'FL', population: 467963, rank: 44 },
      { name: 'Oakland', state: 'California', stateCode: 'CA', population: 433031, rank: 45 },
      { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', population: 429606, rank: 46 },
      { name: 'Tulsa', state: 'Oklahoma', stateCode: 'OK', population: 413066, rank: 47 },
      { name: 'Wichita', state: 'Kansas', stateCode: 'KS', population: 389938, rank: 48 },
      { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA', population: 390144, rank: 49 },
      { name: 'Arlington', state: 'Texas', stateCode: 'TX', population: 398854, rank: 50 },
    ];
    
    this.allCities = [...this.instantCities];
  }

  async loadFromCache(): Promise<City[] | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('cityCache');
      
      request.onsuccess = () => {
        const cache: CityCache | undefined = request.result;
        if (cache && cache.version === CACHE_VERSION && Date.now() < cache.expires) {
          resolve(cache.cities);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async saveToCache(cities: City[]): Promise<void> {
    if (!this.db) return;

    const cache: CityCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      cities,
      expires: Date.now() + CACHE_DURATION,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: 'cityCache', ...cache });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadAllCities(): Promise<void> {
    if (this.isLoading || this.allCities.length > this.instantCities.length) return;
    
    this.isLoading = true;

    try {
      // First try cache
      const cached = await this.loadFromCache();
      if (cached) {
        this.allCities = cached;
        return;
      }

      // Then try local JSON file
      const response = await fetch('/us-cities.json');
      if (response.ok) {
        const data = await response.json();
        const cities: City[] = data.cities.map((item: any, index: number) => ({
          name: item.name,
          state: item.state,
          stateCode: item.stateCode,
          population: item.population,
          lat: item.lat,
          lng: item.lng,
          rank: index + 1,
        }));
        
        this.allCities = cities;
        await this.saveToCache(cities);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
      // Fall back to instant cities
    } finally {
      this.isLoading = false;
    }
  }

  private getStateCode(stateName: string): string {
    const stateCodes: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY',
    };
    return stateCodes[stateName] || stateName.slice(0, 2).toUpperCase();
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  search(query: string, limit: number = 20): CitySearchResult[] {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const cities = this.allCities.length > this.instantCities.length 
      ? this.allCities 
      : this.instantCities;

    // Enhanced scoring with fuzzy matching
    const results = cities
      .map(city => {
        const cityLower = city.name.toLowerCase();
        const stateLower = city.state.toLowerCase();
        const stateCodeLower = city.stateCode.toLowerCase();
        const displayName = `${city.name}, ${city.stateCode}`;
        let searchScore = 0;

        // Exact match
        if (cityLower === lowerQuery) {
          searchScore = 100;
        } 
        // Starts with query
        else if (cityLower.startsWith(lowerQuery)) {
          searchScore = 90;
        }
        // State code match (e.g., "Phoenix, AZ" matches "az")
        else if (stateCodeLower === lowerQuery || stateLower === lowerQuery) {
          searchScore = 85;
        }
        // Contains query
        else if (cityLower.includes(lowerQuery)) {
          searchScore = 80;
        }
        // Display name contains query
        else if (displayName.toLowerCase().includes(lowerQuery)) {
          searchScore = 70;
        }
        // Fuzzy match for typos (only for queries > 3 chars)
        else if (lowerQuery.length > 3) {
          const distance = this.levenshteinDistance(lowerQuery, cityLower);
          const maxDistance = Math.floor(lowerQuery.length * 0.3); // Allow 30% error
          if (distance <= maxDistance) {
            searchScore = 60 - (distance * 10);
          }
        }

        if (searchScore === 0) return null;

        return {
          ...city,
          displayName,
          searchScore,
        } as CitySearchResult;
      })
      .filter((result): result is CitySearchResult => result !== null)
      .sort((a, b) => {
        // Sort by search score first, then by population
        const scoreA = a.searchScore || 0;
        const scoreB = b.searchScore || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return (b.population || 0) - (a.population || 0);
      })
      .slice(0, limit);

    return results;
  }

  // Get city by exact name and state
  getCity(name: string, stateCode?: string): City | undefined {
    return this.allCities.find(city => 
      city.name.toLowerCase() === name.toLowerCase() &&
      (!stateCode || city.stateCode === stateCode)
    );
  }
}

// Singleton instance
let cityServiceInstance: CityService | null = null;

export function getCityService(): CityService {
  if (!cityServiceInstance) {
    cityServiceInstance = new CityService();
  }
  return cityServiceInstance;
}