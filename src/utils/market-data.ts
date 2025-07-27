import { MarketMetrics, StateMarketData, MarketFilter, MarketComparison } from '@/types/market-data';
import { marketDataAggregator } from '@/services/market-data-aggregator';

// Note: This data is now fetched from real APIs via marketDataAggregator
// Keeping sample data as fallback for demo/development
export const SAMPLE_MARKET_DATA: MarketMetrics[] = [
  {
    city: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    coordinates: { lat: 33.4484, lng: -112.0740 },
    opportunityScore: 87,
    demographics: {
      boomerBusinessOwners: 42000,
      avgOwnerAge: 61,
      retirementRiskScore: 8.5,
      businessesWithoutSuccessionPlan: 28000
    },
    market: {
      avgMultiple: "3.2x EBITDA",
      medianRevenue: "$1.2M",
      yearlyTransactions: 850,
      competitionLevel: 'Medium',
      avgDaysOnMarket: 120
    },
    topIndustries: [
      {
        name: "HVAC Services",
        businessCount: 2100,
        avgMultiple: "3.5x",
        avgRevenue: "$1.5M",
        retirementRisk: 9,
        growthRate: "+4.2%"
      },
      {
        name: "Plumbing Services",
        businessCount: 1800,
        avgMultiple: "3.3x",
        avgRevenue: "$1.3M",
        retirementRisk: 8.5,
        growthRate: "+3.8%"
      },
      {
        name: "Landscaping Services",
        businessCount: 1500,
        avgMultiple: "2.8x",
        avgRevenue: "$900K",
        retirementRisk: 7.5,
        growthRate: "+5.1%"
      }
    ],
    growth: {
      populationGrowth: "+2.1%/yr",
      businessGrowth: "+3.5%/yr",
      employmentGrowth: "+2.8%/yr",
      newConstructionPermits: 15000,
      gdpGrowth: "+3.2%"
    },
    competition: {
      activeBuyers: 125,
      pePresence: 'Medium',
      avgBidsPerDeal: 3.2,
      topBuyers: ["Sunbelt Holdings", "Desert Capital", "Southwest Partners"]
    }
  },
  {
    city: "Tampa",
    state: "Florida",
    stateCode: "FL",
    coordinates: { lat: 27.9506, lng: -82.4572 },
    opportunityScore: 85,
    demographics: {
      boomerBusinessOwners: 38000,
      avgOwnerAge: 62,
      retirementRiskScore: 8.8,
      businessesWithoutSuccessionPlan: 26000
    },
    market: {
      avgMultiple: "3.0x EBITDA",
      medianRevenue: "$1.1M",
      yearlyTransactions: 780,
      competitionLevel: 'High',
      avgDaysOnMarket: 95
    },
    topIndustries: [
      {
        name: "Pool Service",
        businessCount: 1200,
        avgMultiple: "3.2x",
        avgRevenue: "$1.2M",
        retirementRisk: 8.5,
        growthRate: "+5.5%"
      },
      {
        name: "Marine Services",
        businessCount: 800,
        avgMultiple: "3.8x",
        avgRevenue: "$1.8M",
        retirementRisk: 9,
        growthRate: "+4.2%"
      },
      {
        name: "Pest Control",
        businessCount: 950,
        avgMultiple: "3.5x",
        avgRevenue: "$1.4M",
        retirementRisk: 8,
        growthRate: "+3.9%"
      }
    ],
    growth: {
      populationGrowth: "+1.8%/yr",
      businessGrowth: "+3.2%/yr",
      employmentGrowth: "+2.5%/yr",
      newConstructionPermits: 12000,
      gdpGrowth: "+2.9%"
    },
    competition: {
      activeBuyers: 150,
      pePresence: 'High',
      avgBidsPerDeal: 4.1,
      topBuyers: ["Gulf Coast Equity", "Sunshine Capital", "Bay Area Holdings"]
    }
  },
  {
    city: "Austin",
    state: "Texas",
    stateCode: "TX",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    opportunityScore: 84,
    demographics: {
      boomerBusinessOwners: 35000,
      avgOwnerAge: 59,
      retirementRiskScore: 7.5,
      businessesWithoutSuccessionPlan: 22000
    },
    market: {
      avgMultiple: "3.5x EBITDA",
      medianRevenue: "$1.4M",
      yearlyTransactions: 920,
      competitionLevel: 'High',
      avgDaysOnMarket: 85
    },
    topIndustries: [
      {
        name: "Tech Services",
        businessCount: 1500,
        avgMultiple: "4.2x",
        avgRevenue: "$2.1M",
        retirementRisk: 6.5,
        growthRate: "+8.2%"
      },
      {
        name: "Construction",
        businessCount: 2200,
        avgMultiple: "3.0x",
        avgRevenue: "$1.5M",
        retirementRisk: 8,
        growthRate: "+6.5%"
      },
      {
        name: "Food Service",
        businessCount: 1800,
        avgMultiple: "2.5x",
        avgRevenue: "$800K",
        retirementRisk: 7,
        growthRate: "+4.8%"
      }
    ],
    growth: {
      populationGrowth: "+3.2%/yr",
      businessGrowth: "+5.1%/yr",
      employmentGrowth: "+4.2%/yr",
      newConstructionPermits: 22000,
      gdpGrowth: "+4.5%"
    },
    competition: {
      activeBuyers: 175,
      pePresence: 'High',
      avgBidsPerDeal: 4.5,
      topBuyers: ["Lone Star Capital", "Austin Ventures", "Hill Country Partners"]
    }
  },
  {
    city: "Nashville",
    state: "Tennessee",
    stateCode: "TN",
    coordinates: { lat: 36.1627, lng: -86.7816 },
    opportunityScore: 82,
    demographics: {
      boomerBusinessOwners: 28000,
      avgOwnerAge: 60,
      retirementRiskScore: 8.0,
      businessesWithoutSuccessionPlan: 19000
    },
    market: {
      avgMultiple: "2.9x EBITDA",
      medianRevenue: "$950K",
      yearlyTransactions: 620,
      competitionLevel: 'Medium',
      avgDaysOnMarket: 110
    },
    topIndustries: [
      {
        name: "Healthcare Services",
        businessCount: 1100,
        avgMultiple: "3.8x",
        avgRevenue: "$1.6M",
        retirementRisk: 7.5,
        growthRate: "+4.5%"
      },
      {
        name: "Music & Entertainment",
        businessCount: 600,
        avgMultiple: "2.5x",
        avgRevenue: "$700K",
        retirementRisk: 6,
        growthRate: "+5.2%"
      },
      {
        name: "Construction",
        businessCount: 1400,
        avgMultiple: "2.8x",
        avgRevenue: "$1.1M",
        retirementRisk: 8.5,
        growthRate: "+6.1%"
      }
    ],
    growth: {
      populationGrowth: "+2.5%/yr",
      businessGrowth: "+4.2%/yr",
      employmentGrowth: "+3.5%/yr",
      newConstructionPermits: 14000,
      gdpGrowth: "+3.8%"
    },
    competition: {
      activeBuyers: 95,
      pePresence: 'Medium',
      avgBidsPerDeal: 2.8,
      topBuyers: ["Music City Capital", "Cumberland Partners", "Tennessee Growth"]
    }
  },
  {
    city: "Raleigh",
    state: "North Carolina",
    stateCode: "NC",
    coordinates: { lat: 35.7796, lng: -78.6382 },
    opportunityScore: 81,
    demographics: {
      boomerBusinessOwners: 32000,
      avgOwnerAge: 59,
      retirementRiskScore: 7.8,
      businessesWithoutSuccessionPlan: 21000
    },
    market: {
      avgMultiple: "3.1x EBITDA",
      medianRevenue: "$1.0M",
      yearlyTransactions: 680,
      competitionLevel: 'Medium',
      avgDaysOnMarket: 105
    },
    topIndustries: [
      {
        name: "Tech Services",
        businessCount: 1600,
        avgMultiple: "4.0x",
        avgRevenue: "$1.8M",
        retirementRisk: 6,
        growthRate: "+7.5%"
      },
      {
        name: "Healthcare Services",
        businessCount: 1200,
        avgMultiple: "3.5x",
        avgRevenue: "$1.4M",
        retirementRisk: 7.5,
        growthRate: "+4.8%"
      },
      {
        name: "Professional Services",
        businessCount: 1800,
        avgMultiple: "2.8x",
        avgRevenue: "$900K",
        retirementRisk: 8,
        growthRate: "+3.9%"
      }
    ],
    growth: {
      populationGrowth: "+2.2%/yr",
      businessGrowth: "+3.8%/yr",
      employmentGrowth: "+3.1%/yr",
      newConstructionPermits: 11000,
      gdpGrowth: "+3.5%"
    },
    competition: {
      activeBuyers: 110,
      pePresence: 'Medium',
      avgBidsPerDeal: 3.0,
      topBuyers: ["Triangle Capital", "Carolina Partners", "Research Park Ventures"]
    }
  },
  {
    city: "Charlotte",
    state: "North Carolina",
    stateCode: "NC",
    coordinates: { lat: 35.2271, lng: -80.8431 },
    opportunityScore: 79,
    demographics: {
      boomerBusinessOwners: 29000,
      avgOwnerAge: 60,
      retirementRiskScore: 7.6,
      businessesWithoutSuccessionPlan: 19500
    },
    market: {
      avgMultiple: "3.0x EBITDA",
      medianRevenue: "$1.1M",
      yearlyTransactions: 710,
      competitionLevel: 'Medium',
      avgDaysOnMarket: 100
    },
    topIndustries: [
      {
        name: "Financial Services",
        businessCount: 1400,
        avgMultiple: "3.8x",
        avgRevenue: "$2.0M",
        retirementRisk: 7,
        growthRate: "+4.5%"
      }
    ],
    growth: {
      populationGrowth: "+2.0%/yr",
      businessGrowth: "+3.5%/yr",
      employmentGrowth: "+2.8%/yr",
      newConstructionPermits: 13000,
      gdpGrowth: "+3.2%"
    },
    competition: {
      activeBuyers: 120,
      pePresence: 'Medium',
      avgBidsPerDeal: 3.3,
      topBuyers: ["Queen City Capital", "Bank Town Partners", "Carolina Equity"]
    }
  },
  {
    city: "Denver",
    state: "Colorado",
    stateCode: "CO",
    coordinates: { lat: 39.7392, lng: -104.9903 },
    opportunityScore: 78,
    demographics: {
      boomerBusinessOwners: 31000,
      avgOwnerAge: 58,
      retirementRiskScore: 7.2,
      businessesWithoutSuccessionPlan: 20000
    },
    market: {
      avgMultiple: "3.3x EBITDA",
      medianRevenue: "$1.3M",
      yearlyTransactions: 650,
      competitionLevel: 'High',
      avgDaysOnMarket: 90
    },
    topIndustries: [
      {
        name: "Outdoor Recreation",
        businessCount: 800,
        avgMultiple: "3.5x",
        avgRevenue: "$1.2M",
        retirementRisk: 6.5,
        growthRate: "+6.0%"
      }
    ],
    growth: {
      populationGrowth: "+1.5%/yr",
      businessGrowth: "+3.0%/yr",
      employmentGrowth: "+2.5%/yr",
      newConstructionPermits: 10000,
      gdpGrowth: "+2.8%"
    },
    competition: {
      activeBuyers: 140,
      pePresence: 'High',
      avgBidsPerDeal: 3.8,
      topBuyers: ["Rocky Mountain Equity", "Mile High Capital", "Front Range Partners"]
    }
  },
  {
    city: "Atlanta",
    state: "Georgia",
    stateCode: "GA",
    coordinates: { lat: 33.7490, lng: -84.3880 },
    opportunityScore: 77,
    demographics: {
      boomerBusinessOwners: 41000,
      avgOwnerAge: 61,
      retirementRiskScore: 8.0,
      businessesWithoutSuccessionPlan: 27000
    },
    market: {
      avgMultiple: "2.9x EBITDA",
      medianRevenue: "$1.0M",
      yearlyTransactions: 890,
      competitionLevel: 'High',
      avgDaysOnMarket: 85
    },
    topIndustries: [
      {
        name: "Transportation & Logistics",
        businessCount: 2100,
        avgMultiple: "3.2x",
        avgRevenue: "$1.8M",
        retirementRisk: 8.5,
        growthRate: "+4.2%"
      }
    ],
    growth: {
      populationGrowth: "+1.8%/yr",
      businessGrowth: "+3.2%/yr",
      employmentGrowth: "+2.7%/yr",
      newConstructionPermits: 16000,
      gdpGrowth: "+3.0%"
    },
    competition: {
      activeBuyers: 160,
      pePresence: 'High',
      avgBidsPerDeal: 4.2,
      topBuyers: ["Peachtree Equity", "Southern Capital", "Atlanta Growth Partners"]
    }
  },
  {
    city: "Orlando",
    state: "Florida",
    stateCode: "FL",
    coordinates: { lat: 28.5383, lng: -81.3792 },
    opportunityScore: 76,
    demographics: {
      boomerBusinessOwners: 26000,
      avgOwnerAge: 60,
      retirementRiskScore: 7.8,
      businessesWithoutSuccessionPlan: 17500
    },
    market: {
      avgMultiple: "2.8x EBITDA",
      medianRevenue: "$950K",
      yearlyTransactions: 580,
      competitionLevel: 'Medium',
      avgDaysOnMarket: 105
    },
    topIndustries: [
      {
        name: "Tourism & Hospitality",
        businessCount: 1800,
        avgMultiple: "2.5x",
        avgRevenue: "$1.1M",
        retirementRisk: 7.5,
        growthRate: "+5.5%"
      }
    ],
    growth: {
      populationGrowth: "+2.3%/yr",
      businessGrowth: "+3.8%/yr",
      employmentGrowth: "+3.2%/yr",
      newConstructionPermits: 11000,
      gdpGrowth: "+3.5%"
    },
    competition: {
      activeBuyers: 95,
      pePresence: 'Medium',
      avgBidsPerDeal: 2.8,
      topBuyers: ["Theme Park Capital", "Central Florida Partners", "Magic City Equity"]
    }
  },
  {
    city: "San Antonio",
    state: "Texas",
    stateCode: "TX",
    coordinates: { lat: 29.4241, lng: -98.4936 },
    opportunityScore: 75,
    demographics: {
      boomerBusinessOwners: 30000,
      avgOwnerAge: 61,
      retirementRiskScore: 8.2,
      businessesWithoutSuccessionPlan: 21000
    },
    market: {
      avgMultiple: "2.7x EBITDA",
      medianRevenue: "$900K",
      yearlyTransactions: 520,
      competitionLevel: 'Low',
      avgDaysOnMarket: 125
    },
    topIndustries: [
      {
        name: "Military Contracting",
        businessCount: 600,
        avgMultiple: "3.5x",
        avgRevenue: "$2.2M",
        retirementRisk: 8,
        growthRate: "+3.5%"
      }
    ],
    growth: {
      populationGrowth: "+1.9%/yr",
      businessGrowth: "+2.8%/yr",
      employmentGrowth: "+2.3%/yr",
      newConstructionPermits: 9000,
      gdpGrowth: "+2.5%"
    },
    competition: {
      activeBuyers: 85,
      pePresence: 'Low',
      avgBidsPerDeal: 2.5,
      topBuyers: ["Alamo Capital", "River City Partners", "South Texas Equity"]
    }
  }
];

// State-level data
export const STATE_MARKET_DATA: StateMarketData[] = [
  {
    state: "Florida",
    stateCode: "FL",
    overallScore: 88,
    totalBusinesses: 680000,
    boomerOwnedPercentage: 42,
    topCities: ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale"],
    businessFriendlyRank: 4
  },
  {
    state: "Texas",
    stateCode: "TX",
    overallScore: 86,
    totalBusinesses: 920000,
    boomerOwnedPercentage: 38,
    topCities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
    businessFriendlyRank: 2
  },
  {
    state: "Arizona",
    stateCode: "AZ",
    overallScore: 85,
    totalBusinesses: 280000,
    boomerOwnedPercentage: 45,
    topCities: ["Phoenix", "Tucson", "Scottsdale", "Mesa", "Chandler"],
    businessFriendlyRank: 8
  },
  {
    state: "North Carolina",
    stateCode: "NC",
    overallScore: 82,
    totalBusinesses: 420000,
    boomerOwnedPercentage: 40,
    topCities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
    businessFriendlyRank: 5
  },
  {
    state: "Tennessee",
    stateCode: "TN",
    overallScore: 81,
    totalBusinesses: 320000,
    boomerOwnedPercentage: 41,
    topCities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Franklin"],
    businessFriendlyRank: 10
  }
];

// Utility functions
export async function getMarketDataByCity(city: string, state?: string): Promise<MarketMetrics | undefined> {
  try {
    // Try to get real data first
    if (state) {
      const realData = await marketDataAggregator.getMarketData(city, state);
      if (realData) return realData;
    }
    
    // Fallback to sample data
    return SAMPLE_MARKET_DATA.find(m => 
      m.city.toLowerCase() === city.toLowerCase() &&
      (!state || m.state.toLowerCase() === state.toLowerCase() || m.stateCode.toLowerCase() === state.toLowerCase())
    );
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Fallback to sample data
    return SAMPLE_MARKET_DATA.find(m => 
      m.city.toLowerCase() === city.toLowerCase() &&
      (!state || m.state.toLowerCase() === state.toLowerCase() || m.stateCode.toLowerCase() === state.toLowerCase())
    );
  }
}

export async function getTopMarkets(limit: number = 10, filter?: MarketFilter): Promise<MarketMetrics[]> {
  try {
    // Try to get real data first
    const realData = await marketDataAggregator.getTopMarkets(limit, filter);
    if (realData && realData.length > 0) {
      return realData;
    }
  } catch (error) {
    console.error('Error fetching top markets:', error);
  }
  
  // Fallback to sample data
  let filtered = [...SAMPLE_MARKET_DATA];
  
  if (filter) {
    if (filter.minOpportunityScore) {
      filtered = filtered.filter(m => m.opportunityScore >= filter.minOpportunityScore!);
    }
    if (filter.competitionLevel?.length) {
      filtered = filtered.filter(m => filter.competitionLevel!.includes(m.market.competitionLevel));
    }
    if (filter.states?.length) {
      filtered = filtered.filter(m => filter.states!.includes(m.stateCode));
    }
  }
  
  return filtered
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}

export function calculateOpportunityScore(metrics: Partial<MarketMetrics>): number {
  let score = 0;
  let factors = 0;
  
  // Demographics (40% weight)
  if (metrics.demographics) {
    const demo = metrics.demographics;
    score += (demo.retirementRiskScore / 10) * 40;
    factors++;
  }
  
  // Growth (30% weight)
  if (metrics.growth) {
    const growthScore = parseFloat(metrics.growth.populationGrowth) * 5;
    score += Math.min(growthScore, 30);
    factors++;
  }
  
  // Competition (20% weight)
  if (metrics.competition) {
    const competitionScore = metrics.competition.pePresence === 'Low' ? 20 :
                           metrics.competition.pePresence === 'Medium' ? 15 : 5;
    score += competitionScore;
    factors++;
  }
  
  // Market dynamics (10% weight)
  if (metrics.market) {
    const marketScore = metrics.market.competitionLevel === 'Low' ? 10 :
                       metrics.market.competitionLevel === 'Medium' ? 7 : 3;
    score += marketScore;
    factors++;
  }
  
  return factors > 0 ? Math.round(score / factors * 4) : 0;
}

export function getStateData(stateCode: string): StateMarketData | undefined {
  return STATE_MARKET_DATA.find(s => s.stateCode === stateCode);
}

export async function compareMarkets(cities: string[]): Promise<MarketComparison> {
  const cityDataPromises = cities.map(city => getMarketDataByCity(city));
  const cityDataResults = await Promise.all(cityDataPromises);
  const cityData = cityDataResults.filter(Boolean) as MarketMetrics[];
  
  const comparison: MarketComparison = {
    cities,
    metrics: {
      'Opportunity Score': {},
      'Avg Owner Age': {},
      'Avg Multiple': {},
      'Competition': {},
      'Growth Rate': {}
    },
    winner: '',
    analysis: ''
  };
  
  cityData.forEach(data => {
    comparison.metrics['Opportunity Score'][data.city] = data.opportunityScore;
    comparison.metrics['Avg Owner Age'][data.city] = data.demographics.avgOwnerAge;
    comparison.metrics['Avg Multiple'][data.city] = data.market.avgMultiple;
    comparison.metrics['Competition'][data.city] = data.market.competitionLevel;
    comparison.metrics['Growth Rate'][data.city] = data.growth.businessGrowth;
  });
  
  // Determine winner
  const highestScore = Math.max(...cityData.map(d => d.opportunityScore));
  comparison.winner = cityData.find(d => d.opportunityScore === highestScore)?.city || '';
  
  comparison.analysis = `${comparison.winner} offers the best opportunity with a score of ${highestScore}/100. ` +
    `Key advantages include strong demographics and favorable market conditions.`;
  
  return comparison;
}