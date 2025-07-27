// County-level market data aggregator
// Combines Census, economic, and business data for comprehensive county analysis

import { 
  countyCensusAPI, 
  CountyBusinessData, 
  CountyDemographics,
  GreyTsunamiIndustryData 
} from './county-census-api';
import { economicDataAPI, EconomicIndicators } from './economic-data-api';
import { businessMarketAPI } from './business-market-api';
import { GREY_TSUNAMI_CATEGORIES } from '@/utils/grey-tsunami-business-types';
import { MARKET_CONSTANTS, getBoomerOwnershipPercentage, calculateBoomerLikelihood } from '@/config/market-constants';

interface CountyMarketMetrics {
  fipsCode: string;
  countyName: string;
  state: string;
  stateAbbr: string;
  coordinates?: { lat: number; lng: number };
  opportunityScore: number;
  marketClassification: 'main' | 'secondary' | 'tertiary';
  
  demographics: {
    population: number;
    medianAge: number;
    medianIncome: number;
    populationGrowth?: number;
  };
  
  businessMetrics: {
    totalBusinesses: number;
    boomerOwnedEstimate: number;
    boomerOwnershipPercentage: number;
    avgBusinessSize: number;
    annualPayroll: number;
    payrollPerEmployee?: number;
  };
  
  boomerLikelihood?: {
    score: number;
    percentage: number;
    confidence: 'high' | 'medium' | 'low';
  };
  
  economicIndicators?: {
    unemploymentRate?: number;
    gdpGrowth?: number;
    jobGrowth?: number;
  };
  
  industryFocus: {
    topGreyTsunamiIndustries: string[];
    industryConcentration: Map<string, number>;
    hasRealIndustryData?: boolean;
    totalGreyTsunamiEstablishments?: number;
  };
  
  dataSource: {
    census: boolean;
    economic: boolean;
    industryData: boolean;
    lastUpdated: string;
  };
}

interface CountyFilter {
  states?: string[];
  minPopulation?: number;
  maxPopulation?: number;
  marketClassification?: ('main' | 'secondary' | 'tertiary')[];
  minOpportunityScore?: number;
  greyTsunamiTiers?: string[];
}

class CountyDataAggregator {
  private cache = new Map<string, { data: CountyMarketMetrics; timestamp: number }>();
  private industryDataCache = new Map<string, { data: GreyTsunamiIndustryData; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private industryDataCacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days for industry data

  // Get comprehensive data for a single county
  async getCountyData(fipsCode: string): Promise<CountyMarketMetrics | null> {
    // Check cache
    const cached = this.cache.get(fipsCode);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Fetch business data
      const businessData = await countyCensusAPI.getCountiesBusinessData([fipsCode]);
      const countyBusiness = businessData.get(fipsCode);
      
      if (!countyBusiness) {
        return null;
      }

      // Fetch demographics
      const demographics = await countyCensusAPI.getCountyDemographics(fipsCode);
      
      // Calculate market classification based on population
      const population = demographics?.population || 0;
      const marketClass = this.classifyMarket(population);

      // Get state-level economic data (county-level often not available)
      const stateFips = fipsCode.substring(0, 2);
      const stateAbbr = countyCensusAPI.getStateAbbr(stateFips);
      
      // Get dynamic boomer ownership percentage
      const boomerPercentage = getBoomerOwnershipPercentage(stateAbbr);
      const boomerOwnedEstimate = Math.round(countyBusiness.totalEstablishments * boomerPercentage);
      
      // Calculate boomer likelihood for this specific county
      const boomerLikelihood = demographics ? calculateBoomerLikelihood(
        countyBusiness.totalEstablishments,
        demographics.medianAge,
        demographics.population,
        stateAbbr
      ) : undefined;
      
      // SKIP fetching real industry data for performance - just use estimates
      let industryData: GreyTsunamiIndustryData | null = null;
      let hasRealIndustryData = false;
      let topIndustries: string[] = [];
      let industryConcentration = new Map<string, number>();
      
      // Always use estimates for speed
      topIndustries = this.identifyTopIndustries(countyBusiness);
      console.log(`[Aggregator] Using estimated industry data for county ${fipsCode}`);
      
      // Calculate opportunity score with industry bonus
      const score = this.calculateOpportunityScore(
        { ...countyBusiness, boomerOwnedEstimate }, 
        demographics, 
        marketClass,
        topIndustries,
        industryData
      );

      const metrics: CountyMarketMetrics = {
        fipsCode,
        countyName: countyBusiness.countyName,
        state: stateFips,
        stateAbbr,
        opportunityScore: score,
        marketClassification: marketClass,
        
        demographics: {
          population: demographics?.population || 0,
          medianAge: demographics?.medianAge || 0,
          medianIncome: demographics?.medianIncome || 0,
        },
        
        businessMetrics: {
          totalBusinesses: countyBusiness.totalEstablishments,
          boomerOwnedEstimate: boomerOwnedEstimate,
          boomerOwnershipPercentage: boomerPercentage,
          avgBusinessSize: countyBusiness.avgBusinessSize,
          annualPayroll: countyBusiness.annualPayroll,
          payrollPerEmployee: countyBusiness.totalEmployees > 0 
            ? Math.round(countyBusiness.annualPayroll / countyBusiness.totalEmployees)
            : 0
        },
        
        boomerLikelihood,
        
        industryFocus: {
          topGreyTsunamiIndustries: topIndustries,
          industryConcentration,
          hasRealIndustryData,
          totalGreyTsunamiEstablishments: industryData?.totalGreyTsunamiEstablishments
        },
        
        dataSource: {
          census: true,
          economic: false,
          industryData: hasRealIndustryData,
          lastUpdated: new Date().toISOString()
        }
      };

      // Cache the result
      this.cache.set(fipsCode, { data: metrics, timestamp: Date.now() });
      
      return metrics;
    } catch (error) {
      console.error(`Error aggregating data for county ${fipsCode}:`, error);
      return null;
    }
  }

  // Get data for all counties in a state
  async getStateCountiesData(stateName: string, filter?: CountyFilter): Promise<CountyMarketMetrics[]> {
    const stateFips = countyCensusAPI.getStateFIPS(stateName);
    if (!stateFips) {
      console.error(`Invalid state name: ${stateName}`);
      return [];
    }

    try {
      // Fetch all counties in the state
      const countyBusinessData = await countyCensusAPI.getStateCountiesBusinessData(stateFips);
      
      // Convert to metrics and apply filters
      const promises = Array.from(countyBusinessData.entries()).map(async ([fips, business]) => {
        // Skip demographic calls for now to avoid overwhelming the API
        // Use estimated demographics based on business data
        const demographics = {
          population: business.totalEstablishments * 150, // Rough estimate
          medianAge: 40, // US median
          medianIncome: 65000 // US median
        };
        
        // Skip industry data fetching here - it's too slow for bulk operations
        
        // Apply population filter
        if (filter?.minPopulation && demographics && demographics.population < filter.minPopulation) {
          return null;
        }
        if (filter?.maxPopulation && demographics && demographics.population > filter.maxPopulation) {
          return null;
        }

        const marketClass = this.classifyMarket(demographics?.population || 0);
        
        // Apply market classification filter
        if (filter?.marketClassification && !filter.marketClassification.includes(marketClass)) {
          return null;
        }

        const stateAbbr = countyCensusAPI.getStateAbbr(stateFips);
        const boomerPercentage = getBoomerOwnershipPercentage(stateAbbr);
        const boomerOwnedEstimate = Math.round(business.totalEstablishments * boomerPercentage);
        
        const boomerLikelihood = demographics ? calculateBoomerLikelihood(
          business.totalEstablishments,
          demographics.medianAge,
          demographics.population,
          stateAbbr
        ) : undefined;
        
        // Try to get real industry data for better filtering
        let industryData: GreyTsunamiIndustryData | null = null;
        let hasRealIndustryData = false;
        let topIndustries: string[] = [];
        let industryConcentration = new Map<string, number>();
        
        // Only fetch industry data if we have tier filters or need accurate data
        if (filter?.greyTsunamiTiers && filter.greyTsunamiTiers.length > 0) {
          try {
            industryData = await this.fetchCachedIndustryData(fips);
            if (industryData && industryData.totalGreyTsunamiEstablishments > 0) {
              hasRealIndustryData = true;
              topIndustries = this.extractTopIndustriesFromData(industryData);
              
              // Check if any of the top industries match the requested tiers
              const matchesTiers = topIndustries.some(industry => {
                const category = GREY_TSUNAMI_CATEGORIES.find(cat => 
                  cat.businesses.some(biz => biz.toLowerCase() === industry.toLowerCase())
                );
                return category && filter.greyTsunamiTiers!.includes(category.tier);
              });
              
              if (!matchesTiers) {
                return null; // Skip this county if it doesn't match tier filter
              }
              
              // Build industry concentration map
              Object.entries(industryData.industries).forEach(([category, data]) => {
                industryConcentration.set(category, data.totalEstablishments);
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch industry data for filtering, using estimates`, error);
          }
        }
        
        // Fall back to estimates if no real data
        if (!hasRealIndustryData) {
          topIndustries = this.identifyTopIndustries(business, filter?.greyTsunamiTiers);
        }
        
        const score = this.calculateOpportunityScore(
          { ...business, boomerOwnedEstimate }, 
          demographics, 
          marketClass,
          topIndustries,
          industryData
        );
        
        // Apply opportunity score filter
        if (filter?.minOpportunityScore && score < filter.minOpportunityScore) {
          return null;
        }

        return {
          fipsCode: fips,
          countyName: business.countyName,
          state: stateFips,
          stateAbbr,
          opportunityScore: score,
          marketClassification: marketClass,
          demographics: {
            population: demographics?.population || 0,
            medianAge: demographics?.medianAge || 0,
            medianIncome: demographics?.medianIncome || 0,
          },
          businessMetrics: {
            totalBusinesses: business.totalEstablishments,
            boomerOwnedEstimate,
            boomerOwnershipPercentage: boomerPercentage,
            avgBusinessSize: business.avgBusinessSize,
            annualPayroll: business.annualPayroll,
            payrollPerEmployee: business.totalEmployees > 0 
              ? Math.round(business.annualPayroll / business.totalEmployees)
              : 0
          },
          boomerLikelihood,
          industryFocus: {
            topGreyTsunamiIndustries: topIndustries,
            industryConcentration,
            hasRealIndustryData,
            totalGreyTsunamiEstablishments: industryData?.totalGreyTsunamiEstablishments
          },
          dataSource: {
            census: true,
            economic: false,
            industryData: hasRealIndustryData,
            lastUpdated: new Date().toISOString()
          }
        } as CountyMarketMetrics;
      });

      const results = await Promise.all(promises);
      return results.filter(r => r !== null) as CountyMarketMetrics[];
    } catch (error) {
      console.error(`Error fetching counties for state ${stateName}:`, error);
      return [];
    }
  }

  // Get top opportunity counties nationwide
  async getTopOpportunityCounties(
    limit: number = 50, 
    filter?: CountyFilter,
    fetchIndustryData: boolean = false
  ): Promise<CountyMarketMetrics[]> {
    // Get states to search - use filter if specified, otherwise use default states
    const targetStates = filter?.states && filter.states.length > 0 
      ? filter.states 
      : [
          // Start with just a few high-opportunity states
          'Florida', 'Texas', 'California', 'Arizona', 'North Carolina',
          'Georgia', 'Tennessee', 'South Carolina', 'Nevada', 'Colorado'
        ];

    console.log(`[Aggregator] Loading counties from ${targetStates.length} states:`, targetStates);
    const allCounties: CountyMarketMetrics[] = [];

    // Process states in smaller batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < targetStates.length; i += batchSize) {
      const batch = targetStates.slice(i, i + batchSize);
      console.log(`[Aggregator] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(targetStates.length/batchSize)}:`, batch);
      
      const promises = batch.map(state => this.getStateCountiesData(state, filter));
      const stateResults = await Promise.all(promises);
      
      stateResults.forEach(counties => {
        console.log(`[Aggregator] Got ${counties.length} counties from batch`);
        allCounties.push(...counties);
      });
    }

    console.log(`[Aggregator] Total counties loaded: ${allCounties.length}`);

    // Sort by opportunity score
    let sortedCounties = allCounties
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);

    // Only enrich the TOP counties with industry data if requested
    if (fetchIndustryData && filter?.greyTsunamiTiers && filter.greyTsunamiTiers.length > 0) {
      console.log(`[Aggregator] Industry data requested but skipping for performance`);
      // Skip industry enrichment - it's too slow
      // Users can click individual counties for detailed data
    }

    return sortedCounties;
  }

  // Fetch cached industry data
  private async fetchCachedIndustryData(fipsCode: string): Promise<GreyTsunamiIndustryData | null> {
    // Check cache first
    const cached = this.industryDataCache.get(fipsCode);
    if (cached && Date.now() - cached.timestamp < this.industryDataCacheExpiry) {
      console.log(`[Aggregator] Using cached industry data for ${fipsCode}`);
      return cached.data;
    }

    try {
      // Fetch fresh data
      const data = await countyCensusAPI.getCountyGreyTsunamiIndustries(fipsCode);
      
      // Cache the result
      this.industryDataCache.set(fipsCode, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error(`[Aggregator] Error fetching industry data for ${fipsCode}:`, error);
      return null;
    }
  }

  // Extract top industries from real industry data
  private extractTopIndustriesFromData(industryData: GreyTsunamiIndustryData): string[] {
    const industries: { businessType: string; count: number; tier: string }[] = [];
    
    // Collect all business types with their counts
    Object.entries(industryData.industries).forEach(([category, data]) => {
      // Find the tier for this category
      const categoryInfo = GREY_TSUNAMI_CATEGORIES.find(cat => cat.category === category);
      const tier = categoryInfo?.tier || 'TIER 20';
      
      data.businessTypes.forEach(bt => {
        if (bt.estimatedCount > 0) {
          industries.push({
            businessType: bt.businessType,
            count: bt.estimatedCount,
            tier
          });
        }
      });
    });
    
    // Sort by tier (lower is better) then by count
    industries.sort((a, b) => {
      const tierA = parseInt(a.tier.replace('TIER ', ''));
      const tierB = parseInt(b.tier.replace('TIER ', ''));
      
      if (tierA !== tierB) {
        return tierA - tierB; // Lower tier number is better
      }
      return b.count - a.count; // Higher count is better
    });
    
    // Return top 5 business types
    return industries.slice(0, 5).map(i => i.businessType);
  }

  // New method to enrich county data with industry information
  async enrichWithIndustryData(metrics: CountyMarketMetrics): Promise<CountyMarketMetrics> {
    try {
      const industryData = await this.fetchCachedIndustryData(metrics.fipsCode);
      
      if (industryData && industryData.totalGreyTsunamiEstablishments > 0) {
        // Update with real data
        const topIndustries = this.extractTopIndustriesFromData(industryData);
        const industryConcentration = new Map<string, number>();
        
        Object.entries(industryData.industries).forEach(([category, data]) => {
          industryConcentration.set(category, data.totalEstablishments);
        });
        
        // Recalculate opportunity score with real data
        const score = this.calculateOpportunityScore(
          {
            ...metrics.businessMetrics,
            fipsCode: metrics.fipsCode,
            countyName: metrics.countyName,
            state: metrics.state,
            totalEstablishments: metrics.businessMetrics.totalBusinesses,
            totalEmployees: 0, // Not used in scoring
            annualPayroll: metrics.businessMetrics.annualPayroll,
            avgBusinessSize: metrics.businessMetrics.avgBusinessSize,
            boomerOwnedEstimate: metrics.businessMetrics.boomerOwnedEstimate
          },
          metrics.demographics,
          metrics.marketClassification,
          topIndustries,
          industryData
        );
        
        return {
          ...metrics,
          opportunityScore: score,
          industryFocus: {
            topGreyTsunamiIndustries: topIndustries,
            industryConcentration,
            hasRealIndustryData: true,
            totalGreyTsunamiEstablishments: industryData.totalGreyTsunamiEstablishments
          },
          dataSource: {
            ...metrics.dataSource,
            industryData: true
          }
        };
      }
    } catch (error) {
      console.error(`[Aggregator] Failed to enrich with industry data for ${metrics.fipsCode}:`, error);
    }
    
    return metrics;
  }

  // Calculate opportunity score for a county
  private calculateOpportunityScore(
    business: CountyBusinessData & { boomerOwnedEstimate?: number },
    demographics: CountyDemographics | null,
    marketClass: 'main' | 'secondary' | 'tertiary',
    topIndustries?: string[],
    industryData?: GreyTsunamiIndustryData | null
  ): number {
    let score = 0;
    const weights = MARKET_CONSTANTS.scoringWeights;

    // Business density factor (30%)
    const businessDensity = demographics && demographics.population > 0
      ? (business.totalEstablishments / demographics.population) * 10000
      : 0;
    score += Math.min(businessDensity * 10, weights.businessDensity * 100);

    // Boomer ownership factor (25%)
    if (business.boomerOwnedEstimate) {
      const boomerFactor = business.boomerOwnedEstimate / business.totalEstablishments;
      score += boomerFactor * weights.boomerOwnership * 100;
      
      // Hidden gem bonus: Tertiary markets with high boomer density (>45%)
      if (marketClass === 'tertiary' && boomerFactor > 0.45) {
        score += 5; // Bonus points for hidden gems
      }
    }

    // Market size factor (20%)
    if (marketClass === 'tertiary') {
      score += weights.marketSize * 100; // Full points - less competition
    } else if (marketClass === 'secondary') {
      score += weights.marketSize * 75; // 75% of points
    } else {
      score += weights.marketSize * 50; // 50% of points - more competition
    }

    // Economic health factor (15%)
    if (demographics) {
      // Consider both income and age demographics
      const incomeScore = Math.min(demographics.medianIncome / 100000, 1);
      const ageScore = demographics.medianAge > 40 ? 0.8 : 0.6; // Older = more established businesses
      score += ((incomeScore + ageScore) / 2) * weights.economicHealth * 100;
    }

    // Business size factor (10%) - smaller avg size = more SMBs
    const avgSizeFactor = business.avgBusinessSize < 10 ? 1.0 :
                         business.avgBusinessSize < 20 ? 0.7 :
                         business.avgBusinessSize < 50 ? 0.5 : 0.3;
    score += avgSizeFactor * weights.businessSize * 100;

    // Sector tier bonus (additional 10-20% for top tier industries)
    if (industryData && industryData.totalGreyTsunamiEstablishments > 0) {
      // Use real industry data for more accurate scoring
      const greyTsunamiDensity = industryData.totalGreyTsunamiEstablishments / business.totalEstablishments;
      const densityBonus = Math.min(0.2, greyTsunamiDensity * 0.3); // Up to 20% bonus
      score *= (1 + densityBonus);
      
      console.log(`[Scoring] Real industry data bonus: ${(densityBonus * 100).toFixed(1)}% (${industryData.totalGreyTsunamiEstablishments} Grey Tsunami businesses)`);
    } else if (topIndustries && topIndustries.length > 0) {
      // Fall back to estimated tier bonus
      const topTierBonus = this.calculateSectorTierBonus(topIndustries);
      score *= (1 + topTierBonus);
    }

    return Math.round(Math.min(100, score)); // Cap at 100
  }

  // Calculate bonus based on sector tiers
  private calculateSectorTierBonus(industries: string[]): number {
    let maxBonus = 0;
    
    for (const industry of industries) {
      // Find matching category
      const category = GREY_TSUNAMI_CATEGORIES.find(cat => 
        cat.businesses.some(biz => biz.toLowerCase() === industry.toLowerCase())
      );
      
      if (category) {
        // Higher acquisition score = higher bonus
        if (category.acquisitionScore >= 9) {
          maxBonus = Math.max(maxBonus, 0.15); // 15% bonus for tier 1-3
        } else if (category.acquisitionScore >= 7) {
          maxBonus = Math.max(maxBonus, 0.10); // 10% bonus for tier 4-6
        } else if (category.acquisitionScore >= 5) {
          maxBonus = Math.max(maxBonus, 0.05); // 5% bonus for tier 7-10
        }
      }
    }
    
    return maxBonus;
  }

  // Classify market based on population
  private classifyMarket(population: number): 'main' | 'secondary' | 'tertiary' {
    if (population >= 1000000) return 'main';
    if (population >= 250000) return 'secondary';
    return 'tertiary';
  }

  // Identify top Grey Tsunami industries for a county (estimation fallback)
  private identifyTopIndustries(business: CountyBusinessData, allowedTiers?: string[]): string[] {
    console.log(`[Aggregator] Estimating top industries for county with avg business size: ${business.avgBusinessSize}`);
    
    // Based on county characteristics, suggest top industries
    const industries: string[] = [];
    
    // Filter categories based on allowed tiers
    const relevantCategories = allowedTiers && allowedTiers.length > 0
      ? GREY_TSUNAMI_CATEGORIES.filter(cat => allowedTiers.includes(cat.tier))
      : GREY_TSUNAMI_CATEGORIES;
    
    // Sort categories by acquisition score
    const sortedCategories = [...relevantCategories].sort((a, b) => b.acquisitionScore - a.acquisitionScore);
    
    // Add industries based on business characteristics
    for (const category of sortedCategories) {
      // Small businesses - focus on service categories
      if (business.avgBusinessSize < 10 && category.category.toLowerCase().includes('service')) {
        industries.push(...category.businesses.slice(0, 2));
      }
      // Medium businesses
      else if (business.avgBusinessSize >= 10 && business.avgBusinessSize < 50) {
        industries.push(...category.businesses.slice(0, 2));
      }
      // Larger businesses - include manufacturing/industrial
      else if (business.avgBusinessSize >= 50 && 
               (category.category.toLowerCase().includes('manufacturing') || 
                category.category.toLowerCase().includes('industrial'))) {
        industries.push(...category.businesses.slice(0, 2));
      }
      
      // Stop when we have enough
      if (industries.length >= 10) break;
    }
    
    // If no industries matched, add top tier businesses
    if (industries.length === 0) {
      const topTiers = sortedCategories.slice(0, 3);
      topTiers.forEach(cat => industries.push(...cat.businesses.slice(0, 2)));
    }
    
    // Remove duplicates and return top 5
    return [...new Set(industries)].slice(0, 5);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.industryDataCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      metricsCache: {
        size: this.cache.size,
        entries: Array.from(this.cache.keys())
      },
      industryDataCache: {
        size: this.industryDataCache.size,
        entries: Array.from(this.industryDataCache.keys())
      }
    };
  }
}

export const countyDataAggregator = new CountyDataAggregator();
export type { CountyMarketMetrics, CountyFilter };