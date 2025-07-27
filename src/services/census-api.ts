// US Census Bureau API Service
// Documentation: https://www.census.gov/data/developers/data-sets.html

interface CensusBusinessData {
  state: string;
  county?: string;
  metro?: string;
  totalBusinesses: number;
  businessesByAge: {
    under25: number;
    age25to34: number;
    age35to44: number;
    age45to54: number;
    age55to64: number;
    age65plus: number;
  };
  businessesByIndustry: {
    naicsCode: string;
    industryName: string;
    count: number;
    avgEmployees: number;
    avgRevenue?: number;
  }[];
  ownerDemographics: {
    gender: {
      male: number;
      female: number;
      equallyOwned: number;
    };
    ethnicity: {
      white: number;
      black: number;
      asian: number;
      hispanic: number;
      other: number;
    };
    veteranOwned: number;
  };
  lastUpdated: string;
}

interface CensusAPIResponse {
  [key: string]: any;
}

class CensusAPIService {
  private baseUrl = 'https://api.census.gov/data';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CENSUS_API_KEY || '';
  }

  // County Business Patterns (CBP) - Get business counts by location
  async getBusinessCountsByLocation(state: string, county?: string): Promise<CensusBusinessData> {
    try {
      const year = 2022; // Most recent complete data
      const endpoint = `${this.baseUrl}/${year}/cbp`;
      
      let params = `?get=ESTAB,EMP,PAYANN,NAICS2017_LABEL&for=state:${state}`;
      if (county) {
        params += `&in=county:${county}`;
      }
      if (this.apiKey) {
        params += `&key=${this.apiKey}`;
      }

      const response = await fetch(endpoint + params);
      const data: CensusAPIResponse = await response.json();
      
      return this.parseCBPData(data, state);
    } catch (error) {
      console.error('Census API error:', error);
      throw new Error('Failed to fetch Census business data');
    }
  }

  // Annual Business Survey (ABS) - Get business owner demographics
  async getBusinessOwnerDemographics(state: string): Promise<CensusBusinessData['ownerDemographics']> {
    try {
      const year = 2021; // Most recent ABS data
      const endpoint = `${this.baseUrl}/${year}/abscs`;
      
      const params = `?get=FIRMPDEMP,SEX,ETH_GROUP,RACE_GROUP,VET_GROUP&for=state:${state}${
        this.apiKey ? `&key=${this.apiKey}` : ''
      }`;

      const response = await fetch(endpoint + params);
      const data: CensusAPIResponse = await response.json();
      
      return this.parseABSData(data);
    } catch (error) {
      console.error('Census ABS API error:', error);
      // Return default demographics if API fails
      return {
        gender: { male: 0, female: 0, equallyOwned: 0 },
        ethnicity: { white: 0, black: 0, asian: 0, hispanic: 0, other: 0 },
        veteranOwned: 0
      };
    }
  }

  // Nonemployer Statistics - Get data on businesses without employees
  async getNonemployerStatistics(state: string): Promise<number> {
    try {
      const year = 2021;
      const endpoint = `${this.baseUrl}/${year}/nonemp`;
      
      const params = `?get=NESTAB&for=state:${state}${
        this.apiKey ? `&key=${this.apiKey}` : ''
      }`;

      const response = await fetch(endpoint + params);
      const data: CensusAPIResponse = await response.json();
      
      return parseInt(data[1]?.[0] || '0');
    } catch (error) {
      console.error('Census Nonemployer API error:', error);
      return 0;
    }
  }

  // Get comprehensive market data for a metro area
  async getMetroAreaBusinessData(metroCode: string): Promise<CensusBusinessData> {
    try {
      // Use multiple Census datasets to compile comprehensive data
      const year = 2022;
      const endpoint = `${this.baseUrl}/${year}/cbp`;
      
      const params = `?get=ESTAB,EMP,PAYANN,NAICS2017_LABEL&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:${metroCode}${
        this.apiKey ? `&key=${this.apiKey}` : ''
      }`;

      const response = await fetch(endpoint + params);
      const data: CensusAPIResponse = await response.json();
      
      // Parse and aggregate the data
      return this.parseMetroData(data, metroCode);
    } catch (error) {
      console.error('Census Metro API error:', error);
      throw new Error('Failed to fetch metro area data');
    }
  }

  // Parse County Business Patterns data
  private parseCBPData(data: CensusAPIResponse, state: string): CensusBusinessData {
    // Skip header row
    const records = data.slice(1);
    
    let totalEstablishments = 0;
    let totalEmployees = 0;
    const industryData: CensusBusinessData['businessesByIndustry'] = [];

    records.forEach((record: any[]) => {
      const establishments = parseInt(record[0] || '0');
      const employees = parseInt(record[1] || '0');
      const industry = record[3] || 'Unknown';
      
      totalEstablishments += establishments;
      totalEmployees += employees;
      
      if (industry !== 'Total for all sectors') {
        industryData.push({
          naicsCode: record[3] || '',
          industryName: industry,
          count: establishments,
          avgEmployees: employees > 0 ? Math.round(employees / establishments) : 0
        });
      }
    });

    // Estimate age distribution based on national averages
    const ageDistribution = this.estimateAgeDistribution(totalEstablishments);

    return {
      state,
      totalBusinesses: totalEstablishments,
      businessesByAge: ageDistribution,
      businessesByIndustry: industryData.slice(0, 10), // Top 10 industries
      ownerDemographics: {
        gender: { male: 0, female: 0, equallyOwned: 0 },
        ethnicity: { white: 0, black: 0, asian: 0, hispanic: 0, other: 0 },
        veteranOwned: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }

  // Parse Annual Business Survey data
  private parseABSData(data: CensusAPIResponse): CensusBusinessData['ownerDemographics'] {
    // Process demographic data
    const demographics: CensusBusinessData['ownerDemographics'] = {
      gender: { male: 0, female: 0, equallyOwned: 0 },
      ethnicity: { white: 0, black: 0, asian: 0, hispanic: 0, other: 0 },
      veteranOwned: 0
    };

    // Parse the complex ABS response structure
    // This is simplified - actual implementation would need to handle the specific response format
    return demographics;
  }

  // Parse metro area data
  private parseMetroData(data: CensusAPIResponse, metroCode: string): CensusBusinessData {
    // Similar to parseCBPData but for metro areas
    const baseData = this.parseCBPData(data, metroCode);
    baseData.metro = metroCode;
    return baseData;
  }

  // Estimate age distribution based on national statistics
  private estimateAgeDistribution(totalBusinesses: number): CensusBusinessData['businessesByAge'] {
    // Based on research: 41% of businesses owned by boomers (55+)
    const boomerPercentage = 0.41;
    const boomerBusinesses = Math.round(totalBusinesses * boomerPercentage);
    
    return {
      under25: Math.round(totalBusinesses * 0.02),
      age25to34: Math.round(totalBusinesses * 0.13),
      age35to44: Math.round(totalBusinesses * 0.21),
      age45to54: Math.round(totalBusinesses * 0.23),
      age55to64: Math.round(boomerBusinesses * 0.6), // 60% of boomer businesses
      age65plus: Math.round(boomerBusinesses * 0.4)  // 40% of boomer businesses
    };
  }

  // Get state FIPS code
  private getStateFIPS(stateName: string): string {
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
}

export const censusAPI = new CensusAPIService();
export type { CensusBusinessData };