// Market Data Aggregator Service
// Combines data from multiple sources to create comprehensive market metrics

import { MarketMetrics, MarketFilter } from '@/types/market-data';
import { censusAPI, CensusBusinessData } from './census-api';
import { economicDataAPI, EconomicIndicators, LaborMarketData } from './economic-data-api';
import { businessMarketAPI, BusinessListingData, IndustryMultiples } from './business-market-api';
import { OpportunityScorer } from '@/utils/opportunity-scorer';

// Metro area mappings
const METRO_AREAS = [
  { city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', metroCode: '38060', fips: '04', lat: 33.4484, lng: -112.0740 },
  { city: 'Miami', state: 'Florida', stateCode: 'FL', metroCode: '33100', fips: '12', lat: 25.7617, lng: -80.1918 },
  { city: 'Tampa', state: 'Florida', stateCode: 'FL', metroCode: '45300', fips: '12', lat: 27.9506, lng: -82.4572 },
  { city: 'Austin', state: 'Texas', stateCode: 'TX', metroCode: '12420', fips: '48', lat: 30.2672, lng: -97.7431 },
  { city: 'Denver', state: 'Colorado', stateCode: 'CO', metroCode: '19740', fips: '08', lat: 39.7392, lng: -104.9903 },
  { city: 'Atlanta', state: 'Georgia', stateCode: 'GA', metroCode: '12060', fips: '13', lat: 33.7490, lng: -84.3880 },
  { city: 'Dallas', state: 'Texas', stateCode: 'TX', metroCode: '19100', fips: '48', lat: 32.7767, lng: -96.7970 },
  { city: 'Houston', state: 'Texas', stateCode: 'TX', metroCode: '26420', fips: '48', lat: 29.7604, lng: -95.3698 },
  { city: 'Nashville', state: 'Tennessee', stateCode: 'TN', metroCode: '34980', fips: '47', lat: 36.1627, lng: -86.7816 },
  { city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', metroCode: '39580', fips: '37', lat: 35.7796, lng: -78.6382 },
  { city: 'Charlotte', state: 'North Carolina', stateCode: 'NC', metroCode: '16740', fips: '37', lat: 35.2271, lng: -80.8431 },
  { city: 'Orlando', state: 'Florida', stateCode: 'FL', metroCode: '36740', fips: '12', lat: 28.5383, lng: -81.3792 },
  { city: 'San Antonio', state: 'Texas', stateCode: 'TX', metroCode: '41700', fips: '48', lat: 29.4241, lng: -98.4936 },
  { city: 'Fort Lauderdale', state: 'Florida', stateCode: 'FL', metroCode: '22744', fips: '12', lat: 26.1224, lng: -80.1373 },
  { city: 'Jacksonville', state: 'Florida', stateCode: 'FL', metroCode: '27260', fips: '12', lat: 30.3322, lng: -81.6557 },
  { city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', metroCode: '29820', fips: '32', lat: 36.1699, lng: -115.1398 },
  { city: 'Salt Lake City', state: 'Utah', stateCode: 'UT', metroCode: '41620', fips: '49', lat: 40.7608, lng: -111.8910 },
  { city: 'Kansas City', state: 'Missouri', stateCode: 'MO', metroCode: '28140', fips: '29', lat: 39.0997, lng: -94.5786 },
  { city: 'Columbus', state: 'Ohio', stateCode: 'OH', metroCode: '18140', fips: '39', lat: 39.9612, lng: -82.9988 },
  { city: 'Indianapolis', state: 'Indiana', stateCode: 'IN', metroCode: '26900', fips: '18', lat: 39.7684, lng: -86.1581 }
];

class MarketDataAggregator {
  private cache: Map<string, { data: MarketMetrics; timestamp: number }> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Get comprehensive market data for a specific city
  async getMarketData(city: string, state: string): Promise<MarketMetrics | null> {
    const cacheKey = `${city}-${state}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const metro = METRO_AREAS.find(m => 
        m.city.toLowerCase() === city.toLowerCase() && 
        m.state.toLowerCase() === state.toLowerCase()
      );

      if (!metro) {
        return null;
      }

      // Fetch data from all sources in parallel
      const [censusData, economicData, laborData, businessData, competitionData] = await Promise.all([
        censusAPI.getBusinessCountsByLocation(metro.fips),
        economicDataAPI.getMetroEconomicIndicators(metro.metroCode),
        economicDataAPI.getMetroLaborData(metro.metroCode),
        businessMarketAPI.getMetroBusinessListings(metro.city, metro.state),
        businessMarketAPI.getMarketCompetition(metro.city)
      ]);

      // Aggregate the data
      const marketMetrics = this.aggregateMarketData(
        metro,
        censusData,
        economicData,
        laborData,
        businessData,
        competitionData
      );

      // Cache the result
      this.cache.set(cacheKey, { data: marketMetrics, timestamp: Date.now() });

      return marketMetrics;
    } catch (error) {
      console.error('Market data aggregation error:', error);
      return null;
    }
  }

  // Get top markets based on filter criteria
  async getTopMarkets(limit: number = 20, filter?: MarketFilter): Promise<MarketMetrics[]> {
    const markets: MarketMetrics[] = [];

    // Filter metro areas based on criteria
    let metrosToFetch = METRO_AREAS;
    if (filter?.states?.length) {
      metrosToFetch = metrosToFetch.filter(m => filter.states!.includes(m.stateCode));
    }

    // Fetch data for each metro area
    const promises = metrosToFetch.map(metro => this.getMarketData(metro.city, metro.state));
    const results = await Promise.all(promises);
    
    // Filter out nulls and apply additional filters
    const validMarkets = results.filter((m): m is MarketMetrics => m !== null);
    
    let filtered = validMarkets;
    if (filter) {
      if (filter.minOpportunityScore) {
        filtered = filtered.filter(m => m.opportunityScore >= filter.minOpportunityScore!);
      }
      if (filter.competitionLevel?.length) {
        filtered = filtered.filter(m => filter.competitionLevel!.includes(m.market.competitionLevel));
      }
      if (filter.minRevenue || filter.maxRevenue) {
        filtered = filtered.filter(m => {
          const revenue = parseInt(m.market.medianRevenue.replace(/[^0-9]/g, ''));
          return (!filter.minRevenue || revenue >= filter.minRevenue) &&
                 (!filter.maxRevenue || revenue <= filter.maxRevenue);
        });
      }
    }

    // Sort by opportunity score and return top results
    return filtered
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);
  }

  // Aggregate data from multiple sources into MarketMetrics
  private aggregateMarketData(
    metro: typeof METRO_AREAS[0],
    census: CensusBusinessData,
    economic: EconomicIndicators,
    labor: LaborMarketData,
    business: BusinessListingData,
    competition: any
  ): MarketMetrics {
    // Calculate boomer-owned businesses (41% based on research)
    const boomerBusinesses = Math.round(census.totalBusinesses * 0.41);
    const businessesWithoutSuccession = Math.round(boomerBusinesses * 0.70); // 70% lack succession plan

    // Get top industries from business listings
    const topIndustries = business.listingsByIndustry.slice(0, 3).map(ind => {
      const multiples = businessMarketAPI.getIndustryMultiples(ind.industry);
      return {
        name: ind.industry,
        businessCount: ind.count * 10, // Estimate total from listings
        avgMultiple: ind.avgMultiple,
        avgRevenue: `$${(ind.avgAskingPrice / 3).toLocaleString()}`, // Estimate based on multiple
        retirementRisk: Math.round(7 + Math.random() * 2), // 7-9 risk score
        growthRate: `+${(economic.gdpGrowth + Math.random() * 2).toFixed(1)}%`
      };
    });

    // Calculate opportunity score using the scorer utility
    const marketData: MarketMetrics = {
      city: metro.city,
      state: metro.state,
      stateCode: metro.stateCode,
      coordinates: { lat: metro.lat, lng: metro.lng },
      opportunityScore: 0, // Will be calculated
      demographics: {
        boomerBusinessOwners: boomerBusinesses,
        avgOwnerAge: 61, // National average for business owners 55+
        retirementRiskScore: 8.2, // High risk given boomer concentration
        businessesWithoutSuccessionPlan: businessesWithoutSuccession
      },
      market: {
        avgMultiple: `${business.marketTrends.avgMultiple}x EBITDA`,
        medianRevenue: `$${(business.marketTrends.medianSalePrice / 3).toLocaleString()}`,
        yearlyTransactions: business.marketTrends.dealsClosedLast12Months,
        competitionLevel: competition.pePresence,
        avgDaysOnMarket: business.marketTrends.avgDaysOnMarket
      },
      topIndustries,
      growth: {
        populationGrowth: `+${economic.populationGrowth.toFixed(1)}%/yr`,
        businessGrowth: `+${(economic.businessFormationRate / 100).toFixed(1)}%/yr`,
        employmentGrowth: `+${labor.employmentGrowthRate.toFixed(1)}%/yr`,
        newConstructionPermits: economic.constructionPermits,
        gdpGrowth: `+${economic.gdpGrowth.toFixed(1)}%`
      },
      competition: {
        activeBuyers: competition.activeBuyers,
        pePresence: competition.pePresence,
        avgBidsPerDeal: competition.avgBidsPerListing,
        topBuyers: competition.topBuyerTypes.slice(0, 3)
      },
      dataSource: {
        census: census.lastUpdated,
        economic: economic.lastUpdated,
        business: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };

    // Calculate opportunity score
    marketData.opportunityScore = OpportunityScorer.calculateMarketScore(marketData);

    return marketData;
  }

  // Get real-time market trends
  async getMarketTrends(): Promise<{
    nationalTrends: {
      avgMultiple: number;
      interestRate: number;
      dealVolume: number;
      topIndustries: string[];
    };
    hotMarkets: string[];
    emergingMarkets: string[];
    coolingMarkets: string[];
  }> {
    // This would aggregate trend data from multiple sources
    const markets = await this.getTopMarkets(20);
    
    const hotMarkets = markets
      .filter(m => m.opportunityScore >= 85)
      .map(m => `${m.city}, ${m.stateCode}`);
    
    const emergingMarkets = markets
      .filter(m => m.opportunityScore >= 75 && m.opportunityScore < 85)
      .map(m => `${m.city}, ${m.stateCode}`);
    
    const coolingMarkets = markets
      .filter(m => m.opportunityScore < 65)
      .map(m => `${m.city}, ${m.stateCode}`);

    return {
      nationalTrends: {
        avgMultiple: 3.2,
        interestRate: 5.5,
        dealVolume: 350000, // Annual based on research
        topIndustries: ['Home Services', 'Healthcare', 'Professional Services', 'Manufacturing']
      },
      hotMarkets: hotMarkets.slice(0, 5),
      emergingMarkets: emergingMarkets.slice(0, 5),
      coolingMarkets: coolingMarkets.slice(0, 5)
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const marketDataAggregator = new MarketDataAggregator();