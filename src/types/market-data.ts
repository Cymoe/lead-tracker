export interface MarketMetrics {
  city: string;
  state: string;
  stateCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  
  // Overall score
  opportunityScore: number; // 1-100
  
  // Demographics
  demographics: {
    boomerBusinessOwners: number;
    avgOwnerAge: number;
    retirementRiskScore: number; // 1-10
    businessesWithoutSuccessionPlan: number;
  };
  
  // Market dynamics
  market: {
    avgMultiple: string; // e.g., "3.2x EBITDA"
    medianRevenue: string; // e.g., "$1.2M"
    yearlyTransactions: number;
    competitionLevel: 'Low' | 'Medium' | 'High';
    avgDaysOnMarket: number;
  };
  
  // Top industries
  topIndustries: IndustryMetric[];
  
  // Growth indicators
  growth: {
    populationGrowth: string; // e.g., "+2.1%/yr"
    businessGrowth: string;
    employmentGrowth: string;
    newConstructionPermits: number;
    gdpGrowth: string;
  };
  
  // Competition
  competition: {
    activeBuyers: number;
    pePresence: 'None' | 'Low' | 'Medium' | 'High';
    avgBidsPerDeal: number;
    topBuyers: string[];
  };
  
  // Data source attribution
  dataSource?: {
    census: string;
    economic: string;
    business: string;
    lastUpdated: string;
  };
}

export interface IndustryMetric {
  name: string;
  businessCount: number;
  avgMultiple: string;
  avgRevenue: string;
  retirementRisk: number; // 1-10
  growthRate: string;
}

export interface StateMarketData {
  state: string;
  stateCode: string;
  overallScore: number;
  totalBusinesses: number;
  boomerOwnedPercentage: number;
  topCities: string[];
  businessFriendlyRank: number; // 1-50
}

export interface MarketFilter {
  businessTypes?: string[];
  minRevenue?: number;
  maxRevenue?: number;
  competitionLevel?: ('Low' | 'Medium' | 'High')[];
  minOpportunityScore?: number;
  states?: string[];
}

export interface MarketComparison {
  cities: string[];
  metrics: {
    [key: string]: {
      [city: string]: string | number;
    };
  };
  winner: string;
  analysis: string;
}