// US Census Bureau API Service for County-level Data
// Focused on County Business Patterns (CBP) and supporting tertiary market analysis

import { 
  getMarketAnalysisNAICSCodes, 
  getBusinessTypesForNAICS,
  getNAICSDescription,
  getNAICSCodesForBusinessType,
  NAICS_GROUPS 
} from '@/utils/naics-mapping';
import { GREY_TSUNAMI_CATEGORIES } from '@/utils/grey-tsunami-business-types';

interface CountyBusinessData {
  fipsCode: string;
  countyName: string;
  state: string;
  totalEstablishments: number;
  totalEmployees: number;
  annualPayroll: number;
  avgBusinessSize: number;
  population?: number;
  boomerOwnedEstimate?: number; // Estimated based on state-level ABS data
}

interface CountyDemographics {
  fipsCode: string;
  population: number;
  medianAge: number;
  populationGrowth?: number;
  medianIncome?: number;
}

interface IndustryData {
  naicsCode: string;
  description: string;
  establishments: number;
  employees?: number;
  payroll?: number;
  greyTsunamiBusinessTypes?: string[];
}

interface GreyTsunamiIndustryData {
  fipsCode: string;
  countyName: string;
  industries: {
    [category: string]: {
      totalEstablishments: number;
      businessTypes: {
        businessType: string;
        estimatedCount: number;
        naicsCodes: string[];
      }[];
    };
  };
  totalGreyTsunamiEstablishments: number;
}

class CountyCensusAPI {
  private baseUrl = 'https://api.census.gov/data';
  private apiKey: string;
  private year = 2021; // Most recent available CBP data
  private rateLimitDelay = 100; // Delay between API calls in milliseconds
  private maxRetries = 3;
  private retryDelay = 1000; // Initial retry delay in milliseconds

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CENSUS_API_KEY || '';
    console.log('Census API Key status:', this.apiKey ? `Present (${this.apiKey.substring(0, 8)}...)` : 'MISSING');
    if (!this.apiKey) {
      console.error('CENSUS API KEY IS MISSING! The app will not work properly.');
      console.error('Make sure NEXT_PUBLIC_CENSUS_API_KEY is set in .env.local');
    }
  }

  // Helper function to add delay for rate limiting
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to retry API calls with exponential backoff
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries,
    delay = this.retryDelay
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && (error.status === 429 || error.status === 503)) {
        console.log(`Rate limited or service unavailable. Retrying in ${delay}ms...`);
        await this.delay(delay);
        return this.retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // Get business data for all counties in a state
  async getStateCountiesBusinessData(stateFips: string): Promise<Map<string, CountyBusinessData>> {
    const params = new URLSearchParams({
      endpoint: `${this.year}/cbp`,
      get: 'ESTAB,EMP,PAYANN,NAME',
      for: 'county:*',
      in: `state:${stateFips}`,
      NAICS2017: '00', // All industries
    });

    const countyData = new Map<string, CountyBusinessData>();

    try {
      console.log('[Census API] Fetching counties for state:', stateFips);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      const response = await fetch(`/api/census?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Census API] Error for state ${stateFips}:`, response.status, errorText);
        throw new Error(`Census API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Census API] Got response for state ${stateFips}:`, data.length - 1, 'counties');
      
      if (!data || data.length < 2) {
        console.warn(`[Census API] No data for state ${stateFips}`);
        return countyData;
      }

      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const establishments = parseInt(row[0]) || 0;
        const employees = parseInt(row[1]) || 0;
        const payroll = parseInt(row[2]) || 0;
        const countyName = row[3] || 'Unknown County';
        const countyFips = row[6]; // County FIPS is at index 6
        
        const fullFips = `${stateFips}${countyFips}`;
        
        countyData.set(fullFips, {
          fipsCode: fullFips,
          countyName: countyName.replace(' County', '').replace(' Parish', ''),
          state: stateFips,
          totalEstablishments: establishments,
          totalEmployees: employees,
          annualPayroll: payroll,
          avgBusinessSize: employees && establishments ? Math.round(employees / establishments) : 0
        });
      }

      console.log(`[Census API] Successfully loaded ${countyData.size} counties for state ${stateFips}`);
      return countyData;
    } catch (error) {
      console.error(`[Census API] Error for state ${stateFips}:`, error);
      return countyData;
    }
  }

  // Get business data for specific counties (more efficient for targeted queries)
  async getCountiesBusinessData(countyFipsList: string[]): Promise<Map<string, CountyBusinessData>> {
    const countyData = new Map<string, CountyBusinessData>();
    
    // Group counties by state for efficient API calls
    const stateGroups = new Map<string, string[]>();
    countyFipsList.forEach(fips => {
      const stateFips = fips.substring(0, 2);
      const countyFips = fips.substring(2);
      if (!stateGroups.has(stateFips)) {
        stateGroups.set(stateFips, []);
      }
      stateGroups.get(stateFips)!.push(countyFips);
    });

    // Fetch data for each state
    const promises = Array.from(stateGroups.entries()).map(async ([stateFips, counties]) => {
      // Build query for specific counties
      const countyQuery = counties.map(c => `county:${c}`).join(',');
      const params = new URLSearchParams({
        endpoint: `${this.year}/cbp`,
        get: 'ESTAB,EMP,PAYANN,NAME',
        for: countyQuery,
        in: `state:${stateFips}`,
        NAICS2017: '00',
      });

      try {
        const response = await fetch(`/api/census?${params}`);
        if (!response.ok) {
          console.warn(`Failed to fetch data for state ${stateFips}`);
          return;
        }

        const data = await response.json();
        if (!data || data.length < 2) return;

        // Process results
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const fullFips = `${stateFips}${row[3]}`;
          
          countyData.set(fullFips, {
            fipsCode: fullFips,
            countyName: (row[4] || 'Unknown').replace(' County', '').replace(' Parish', ''),
            state: stateFips,
            totalEstablishments: parseInt(row[0]) || 0,
            totalEmployees: parseInt(row[1]) || 0,
            annualPayroll: parseInt(row[2]) || 0,
            avgBusinessSize: row[1] && row[0] ? Math.round(parseInt(row[1]) / parseInt(row[0])) : 0
          });
        }
      } catch (error) {
        console.error(`Error fetching counties for state ${stateFips}:`, error);
      }
    });

    await Promise.all(promises);
    return countyData;
  }

  // Get county demographics from ACS (American Community Survey)
  async getCountyDemographics(countyFips: string): Promise<CountyDemographics | null> {
    const stateFips = countyFips.substring(0, 2);
    const county = countyFips.substring(2);
    
    const params = new URLSearchParams({
      endpoint: '2022/acs/acs5',
      get: 'B01003_001E,B01002_001E,B19013_001E', // Total pop, median age, median income
      for: `county:${county}`,
      in: `state:${stateFips}`
    });

    try {
      const response = await fetch(`/api/census?${params}`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data || data.length < 2) {
        return null;
      }

      const row = data[1];
      return {
        fipsCode: countyFips,
        population: parseInt(row[0]) || 0,
        medianAge: parseFloat(row[1]) || 0,
        medianIncome: parseInt(row[2]) || 0
      };
    } catch (error) {
      console.error('Error fetching county demographics:', error);
      return null;
    }
  }

  // Get business data by industry for opportunity scoring
  async getCountyIndustryData(countyFips: string, naicsCodes: string[]): Promise<Map<string, IndustryData>> {
    const stateFips = countyFips.substring(0, 2);
    const county = countyFips.substring(2);
    const industryData = new Map<string, IndustryData>();

    console.log(`[Census API] Fetching industry data for county ${countyFips} with ${naicsCodes.length} NAICS codes`);
    
    // Batch NAICS codes for efficiency (max 10 per batch to avoid URL length limits)
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < naicsCodes.length; i += batchSize) {
      batches.push(naicsCodes.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (naics) => {
        await this.delay(this.rateLimitDelay); // Rate limiting
        
        return this.retryWithBackoff(async () => {
          const params = new URLSearchParams({
            endpoint: `${this.year}/cbp`,
            get: 'ESTAB,EMP,PAYANN',
            for: `county:${county}`,
            in: `state:${stateFips}`,
            NAICS2017: naics
          });

          console.log(`[Census API] Querying NAICS ${naics} for county ${countyFips}`);
          
          const response = await fetch(`/api/census?${params}`);
          
          if (!response.ok) {
            const error = new Error(`Failed to fetch NAICS ${naics}`);
            (error as any).status = response.status;
            throw error;
          }

          const data = await response.json();
          if (data && data.length > 1) {
            const establishments = parseInt(data[1][0]) || 0;
            const employees = parseInt(data[1][1]) || 0;
            const payroll = parseInt(data[1][2]) || 0;
            
            industryData.set(naics, {
              naicsCode: naics,
              description: getNAICSDescription(naics),
              establishments,
              employees,
              payroll,
              greyTsunamiBusinessTypes: getBusinessTypesForNAICS(naics)
            });
            
            console.log(`[Census API] NAICS ${naics}: ${establishments} establishments`);
          }
        }).catch(error => {
          console.error(`[Census API] Error fetching NAICS ${naics} for county ${countyFips}:`, error);
          // Don't throw, just log and continue with other codes
        });
      });

      await Promise.all(batchPromises);
    }

    console.log(`[Census API] Completed industry data fetch. Found data for ${industryData.size} NAICS codes`);
    return industryData;
  }

  // Get county industry distribution for specific NAICS codes
  async getCountyIndustryDistribution(countyFips: string, naicsCodes: string[]): Promise<Map<string, number>> {
    const stateFips = countyFips.substring(0, 2);
    const county = countyFips.substring(2);
    const distributionData = new Map<string, number>();

    console.log(`[Census API] Fetching industry distribution for county ${countyFips}`);
    
    // Remove duplicates and sort NAICS codes
    const uniqueCodes = Array.from(new Set(naicsCodes)).sort();
    
    // Batch requests efficiently
    const batchSize = 15; // Larger batch size for simple queries
    const batches = [];
    for (let i = 0; i < uniqueCodes.length; i += batchSize) {
      batches.push(uniqueCodes.slice(i, i + batchSize));
    }

    let processedCount = 0;
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (naics) => {
        await this.delay(this.rateLimitDelay); // Rate limiting
        
        return this.retryWithBackoff(async () => {
          const params = new URLSearchParams({
            endpoint: `${this.year}/cbp`,
            get: 'ESTAB',
            for: `county:${county}`,
            in: `state:${stateFips}`,
            NAICS2017: naics
          });
          
          const response = await fetch(`/api/census?${params}`);
          
          if (!response.ok) {
            const error = new Error(`Failed to fetch NAICS ${naics}`);
            (error as any).status = response.status;
            throw error;
          }

          const data = await response.json();
          if (data && data.length > 1) {
            const establishments = parseInt(data[1][0]) || 0;
            distributionData.set(naics, establishments);
            processedCount++;
            
            if (processedCount % 10 === 0) {
              console.log(`[Census API] Progress: ${processedCount}/${uniqueCodes.length} NAICS codes processed`);
            }
          }
        }).catch(error => {
          console.error(`[Census API] Error fetching NAICS ${naics}:`, error);
          distributionData.set(naics, 0); // Set to 0 on error
        });
      });

      await Promise.all(batchPromises);
    }

    console.log(`[Census API] Completed distribution fetch. Retrieved data for ${distributionData.size} NAICS codes`);
    return distributionData;
  }

  // Get Grey Tsunami industries data for a county
  async getCountyGreyTsunamiIndustries(countyFips: string): Promise<GreyTsunamiIndustryData> {
    // DISABLED FOR PERFORMANCE - Return empty data immediately
    console.log(`[Census API] Industry data fetching DISABLED for performance`);
    return {
      fipsCode: countyFips,
      countyName: '',
      industries: {},
      totalGreyTsunamiEstablishments: 0
    };
    
    console.log(`[Census API] Fetching Grey Tsunami industry data for county ${countyFips}`);
    
    // Get county name first
    const stateFips = countyFips.substring(0, 2);
    const countyData = await this.getCountiesBusinessData([countyFips]);
    const countyInfo = countyData.get(countyFips);
    const countyName = countyInfo?.countyName || 'Unknown County';
    
    const result: GreyTsunamiIndustryData = {
      fipsCode: countyFips,
      countyName,
      industries: {},
      totalGreyTsunamiEstablishments: 0
    };

    // Process each Grey Tsunami category
    for (const category of GREY_TSUNAMI_CATEGORIES) {
      console.log(`[Census API] Processing category: ${category.category}`);
      
      // Collect all NAICS codes for this category
      const categoryNaicsCodes = new Set<string>();
      const businessTypeToNaics = new Map<string, string[]>();
      
      for (const businessType of category.businesses) {
        const naicsCodes = getNAICSCodesForBusinessType(businessType);
        naicsCodes.forEach(code => categoryNaicsCodes.add(code));
        businessTypeToNaics.set(businessType, naicsCodes);
      }
      
      // Fetch industry data for all NAICS codes in this category
      const naicsArray = Array.from(categoryNaicsCodes);
      const industryDistribution = await this.getCountyIndustryDistribution(countyFips, naicsArray);
      
      // Calculate establishments per business type
      const businessTypes = [];
      let categoryTotal = 0;
      
      for (const businessType of category.businesses) {
        const naicsCodes = businessTypeToNaics.get(businessType) || [];
        let estimatedCount = 0;
        
        // Sum establishments across all NAICS codes for this business type
        for (const naics of naicsCodes) {
          const count = industryDistribution.get(naics) || 0;
          // Divide by number of business types sharing this NAICS code to avoid double counting
          const businessTypesForNaics = getBusinessTypesForNAICS(naics).length || 1;
          estimatedCount += count / businessTypesForNaics;
        }
        
        estimatedCount = Math.round(estimatedCount);
        categoryTotal += estimatedCount;
        
        if (estimatedCount > 0) {
          businessTypes.push({
            businessType,
            estimatedCount,
            naicsCodes
          });
        }
      }
      
      // Sort business types by estimated count
      businessTypes.sort((a, b) => b.estimatedCount - a.estimatedCount);
      
      result.industries[category.category] = {
        totalEstablishments: categoryTotal,
        businessTypes
      };
      
      result.totalGreyTsunamiEstablishments += categoryTotal;
      
      console.log(`[Census API] Category ${category.category}: ${categoryTotal} establishments`);
    }
    
    console.log(`[Census API] Total Grey Tsunami establishments in county: ${result.totalGreyTsunamiEstablishments}`);
    return result;
  }

  // Helper to convert state name to FIPS
  getStateFIPS(stateName: string): string {
    const fipsMap: { [key: string]: string } = {
      'Alabama': '01', 'Alaska': '02', 'Arizona': '04', 'Arkansas': '05',
      'California': '06', 'Colorado': '08', 'Connecticut': '09', 'Delaware': '10',
      'Florida': '12', 'Georgia': '13', 'Hawaii': '15', 'Idaho': '16',
      'Illinois': '17', 'Indiana': '18', 'Iowa': '19', 'Kansas': '20',
      'Kentucky': '21', 'Louisiana': '22', 'Maine': '23', 'Maryland': '24',
      'Massachusetts': '25', 'Michigan': '26', 'Minnesota': '27', 'Mississippi': '28',
      'Missouri': '29', 'Montana': '30', 'Nebraska': '31', 'Nevada': '32',
      'New Hampshire': '33', 'New Jersey': '34', 'New Mexico': '35', 'New York': '36',
      'North Carolina': '37', 'North Dakota': '38', 'Ohio': '39', 'Oklahoma': '40',
      'Oregon': '41', 'Pennsylvania': '42', 'Rhode Island': '44', 'South Carolina': '45',
      'South Dakota': '46', 'Tennessee': '47', 'Texas': '48', 'Utah': '49',
      'Vermont': '50', 'Virginia': '51', 'Washington': '53', 'West Virginia': '54',
      'Wisconsin': '55', 'Wyoming': '56'
    };
    
    return fipsMap[stateName] || '';
  }

  // Get state abbreviation from FIPS
  getStateAbbr(fips: string): string {
    const abbrMap: { [key: string]: string } = {
      '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', 
      '08': 'CO', '09': 'CT', '10': 'DE', '12': 'FL', '13': 'GA',
      '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
      '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
      '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO',
      '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ',
      '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
      '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC',
      '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT',
      '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY'
    };
    
    return abbrMap[fips] || '';
  }
}

export const countyCensusAPI = new CountyCensusAPI();
export type { CountyBusinessData, CountyDemographics, IndustryData, GreyTsunamiIndustryData };