// Economic Data API Service
// Integrates FRED (Federal Reserve Economic Data) and BLS (Bureau of Labor Statistics)

interface EconomicIndicators {
  gdpGrowth: number;
  unemploymentRate: number;
  populationGrowth: number;
  medianHouseholdIncome: number;
  businessFormationRate: number;
  interestRate: number;
  inflationRate: number;
  constructionPermits: number;
  lastUpdated: string;
}

interface LaborMarketData {
  totalEmployment: number;
  employmentGrowthRate: number;
  averageWage: number;
  jobOpenings: number;
  industryEmployment: {
    industry: string;
    employment: number;
    growthRate: number;
  }[];
}

class EconomicDataService {
  private fredBaseUrl = 'https://api.stlouisfed.org/fred';
  private blsBaseUrl = 'https://api.bls.gov/publicAPI/v2';
  private fredApiKey: string;
  private blsApiKey: string;

  constructor() {
    this.fredApiKey = process.env.NEXT_PUBLIC_FRED_API_KEY || '';
    this.blsApiKey = process.env.NEXT_PUBLIC_BLS_API_KEY || '';
  }

  // Get comprehensive economic indicators for a metro area
  async getMetroEconomicIndicators(metroCode: string): Promise<EconomicIndicators> {
    try {
      const [gdp, unemployment, population, permits] = await Promise.all([
        this.getMetroGDP(metroCode),
        this.getMetroUnemployment(metroCode),
        this.getMetroPopulation(metroCode),
        this.getConstructionPermits(metroCode)
      ]);

      // Get national indicators as fallback/comparison
      const [interestRate, inflationRate] = await Promise.all([
        this.getNationalInterestRate(),
        this.getNationalInflationRate()
      ]);

      return {
        gdpGrowth: gdp.growthRate,
        unemploymentRate: unemployment,
        populationGrowth: population.growthRate,
        medianHouseholdIncome: population.medianIncome || 0,
        businessFormationRate: await this.getBusinessFormationRate(),
        interestRate,
        inflationRate,
        constructionPermits: permits,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Economic data fetch error:', error);
      // Return default values if API fails
      return this.getDefaultEconomicIndicators();
    }
  }

  // FRED API - Get Metro GDP data
  private async getMetroGDP(metroCode: string): Promise<{ value: number; growthRate: number }> {
    if (!this.fredApiKey) {
      return { value: 0, growthRate: 3.2 }; // Default growth rate
    }

    try {
      const seriesId = `RGMP${metroCode}`; // Real GDP by Metro
      const url = `${this.fredBaseUrl}/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&limit=5&sort_order=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length >= 2) {
        const latest = parseFloat(data.observations[0].value);
        const previous = parseFloat(data.observations[1].value);
        const growthRate = ((latest - previous) / previous) * 100;
        
        return { value: latest, growthRate: Math.round(growthRate * 10) / 10 };
      }
    } catch (error) {
      console.error('FRED GDP error:', error);
    }
    
    return { value: 0, growthRate: 3.2 };
  }

  // FRED API - Get Metro Unemployment Rate
  private async getMetroUnemployment(metroCode: string): Promise<number> {
    if (!this.fredApiKey) {
      return 4.5; // Default unemployment rate
    }

    try {
      const seriesId = `${metroCode}URN`; // Unemployment Rate by Metro
      const url = `${this.fredBaseUrl}/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&limit=1&sort_order=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        return parseFloat(data.observations[0].value);
      }
    } catch (error) {
      console.error('FRED unemployment error:', error);
    }
    
    return 4.5;
  }

  // Get population data (would typically come from Census API)
  private async getMetroPopulation(metroCode: string): Promise<{ total: number; growthRate: number; medianIncome: number }> {
    // This would integrate with Census API for real data
    // For now, return estimated values based on metro size
    return {
      total: 1000000,
      growthRate: 2.1,
      medianIncome: 65000
    };
  }

  // FRED API - Get Construction Permits
  private async getConstructionPermits(metroCode: string): Promise<number> {
    if (!this.fredApiKey) {
      return 10000; // Default value
    }

    try {
      const seriesId = `${metroCode}BPPRIVSA`; // Building Permits
      const url = `${this.fredBaseUrl}/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&limit=12&sort_order=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        // Sum last 12 months
        const annual = data.observations.reduce((sum: number, obs: any) => 
          sum + parseFloat(obs.value || '0'), 0
        );
        return Math.round(annual);
      }
    } catch (error) {
      console.error('FRED permits error:', error);
    }
    
    return 10000;
  }

  // FRED API - Get National Interest Rate
  private async getNationalInterestRate(): Promise<number> {
    if (!this.fredApiKey) {
      return 5.5; // Default federal funds rate
    }

    try {
      const url = `${this.fredBaseUrl}/series/observations?series_id=DFF&api_key=${this.fredApiKey}&file_type=json&limit=1&sort_order=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        return parseFloat(data.observations[0].value);
      }
    } catch (error) {
      console.error('FRED interest rate error:', error);
    }
    
    return 5.5;
  }

  // FRED API - Get Inflation Rate
  private async getNationalInflationRate(): Promise<number> {
    if (!this.fredApiKey) {
      return 3.2; // Default inflation rate
    }

    try {
      const url = `${this.fredBaseUrl}/series/observations?series_id=CPIAUCSL&api_key=${this.fredApiKey}&file_type=json&limit=13&sort_order=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length >= 13) {
        const latest = parseFloat(data.observations[0].value);
        const yearAgo = parseFloat(data.observations[12].value);
        const inflationRate = ((latest - yearAgo) / yearAgo) * 100;
        
        return Math.round(inflationRate * 10) / 10;
      }
    } catch (error) {
      console.error('FRED inflation error:', error);
    }
    
    return 3.2;
  }

  // Get Business Formation Statistics
  private async getBusinessFormationRate(): Promise<number> {
    if (!this.fredApiKey) {
      return 450; // Default business applications per 100k
    }

    try {
      const url = `${this.fredBaseUrl}/series/observations?series_id=BABATOTALSAUS&api_key=${this.fredApiKey}&file_type=json&limit=4&sort_order=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        // Get quarterly average
        const sum = data.observations.reduce((total: number, obs: any) => 
          total + parseFloat(obs.value || '0'), 0
        );
        return Math.round(sum / data.observations.length);
      }
    } catch (error) {
      console.error('FRED business formation error:', error);
    }
    
    return 450;
  }

  // BLS API - Get Labor Market Data
  async getMetroLaborData(metroCode: string): Promise<LaborMarketData> {
    try {
      // BLS series IDs for metro employment data
      const seriesIds = [
        `LAUMT${metroCode}0000000000003`, // Employment level
        `LAUMT${metroCode}0000000000004`, // Unemployment level
      ];

      if (!this.blsApiKey) {
        return this.getDefaultLaborData();
      }

      const response = await fetch(this.blsBaseUrl + '/timeseries/data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Registration-Key': this.blsApiKey
        },
        body: JSON.stringify({
          seriesid: seriesIds,
          startyear: new Date().getFullYear() - 1,
          endyear: new Date().getFullYear()
        })
      });

      const data = await response.json();
      
      if (data.Results && data.Results.series) {
        return this.parseBLSData(data.Results.series);
      }
    } catch (error) {
      console.error('BLS API error:', error);
    }

    return this.getDefaultLaborData();
  }

  // Parse BLS response data
  private parseBLSData(series: any[]): LaborMarketData {
    let totalEmployment = 0;
    let employmentGrowthRate = 0;

    series.forEach((s: any) => {
      if (s.data && s.data.length > 0) {
        const latest = parseFloat(s.data[0].value);
        if (s.seriesID.includes('0000000000003')) {
          totalEmployment = latest * 1000; // BLS reports in thousands
          
          // Calculate growth rate if we have previous year data
          if (s.data.length > 12) {
            const yearAgo = parseFloat(s.data[12].value);
            employmentGrowthRate = ((latest - yearAgo) / yearAgo) * 100;
          }
        }
      }
    });

    return {
      totalEmployment,
      employmentGrowthRate: Math.round(employmentGrowthRate * 10) / 10,
      averageWage: 55000, // Would need additional API calls for wage data
      jobOpenings: Math.round(totalEmployment * 0.05), // Estimate 5% job openings
      industryEmployment: [] // Would need additional queries by industry
    };
  }

  // Default values when APIs are unavailable
  private getDefaultEconomicIndicators(): EconomicIndicators {
    return {
      gdpGrowth: 3.2,
      unemploymentRate: 4.5,
      populationGrowth: 2.1,
      medianHouseholdIncome: 65000,
      businessFormationRate: 450,
      interestRate: 5.5,
      inflationRate: 3.2,
      constructionPermits: 10000,
      lastUpdated: new Date().toISOString()
    };
  }

  private getDefaultLaborData(): LaborMarketData {
    return {
      totalEmployment: 500000,
      employmentGrowthRate: 2.5,
      averageWage: 55000,
      jobOpenings: 25000,
      industryEmployment: []
    };
  }
}

export const economicDataAPI = new EconomicDataService();
export type { EconomicIndicators, LaborMarketData };