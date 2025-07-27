import { MarketMetrics } from '@/types/market-data';
import { GREY_TSUNAMI_CATEGORIES } from './grey-tsunami-business-types';

interface ScoringFactors {
  demographics: number;      // 0-100
  marketDynamics: number;   // 0-100
  growth: number;           // 0-100
  competition: number;      // 0-100
  industryFit: number;      // 0-100
}

interface IndustryScore {
  industry: string;
  score: number;
  factors: {
    retirementRisk: number;
    marketSize: number;
    growthRate: number;
    acquisitionScore: number;
  };
}

export class OpportunityScorer {
  // Weights for different factors
  private static readonly WEIGHTS = {
    demographics: 0.30,    // 30% - Baby boomer concentration
    marketDynamics: 0.25,  // 25% - Multiples, transaction volume
    growth: 0.20,         // 20% - Economic growth indicators
    competition: 0.15,    // 15% - Buyer competition levels
    industryFit: 0.10     // 10% - Grey Tsunami fit
  };

  /**
   * Calculate overall opportunity score for a market
   */
  static calculateMarketScore(metrics: MarketMetrics): number {
    const factors = this.calculateScoringFactors(metrics);
    
    const weightedScore = 
      factors.demographics * this.WEIGHTS.demographics +
      factors.marketDynamics * this.WEIGHTS.marketDynamics +
      factors.growth * this.WEIGHTS.growth +
      factors.competition * this.WEIGHTS.competition +
      factors.industryFit * this.WEIGHTS.industryFit;
    
    return Math.round(weightedScore);
  }

  /**
   * Calculate individual scoring factors
   */
  private static calculateScoringFactors(metrics: MarketMetrics): ScoringFactors {
    return {
      demographics: this.scoreDemographics(metrics),
      marketDynamics: this.scoreMarketDynamics(metrics),
      growth: this.scoreGrowth(metrics),
      competition: this.scoreCompetition(metrics),
      industryFit: this.scoreIndustryFit(metrics)
    };
  }

  /**
   * Score demographics (baby boomer concentration, retirement risk)
   */
  private static scoreDemographics(metrics: MarketMetrics): number {
    const { demographics } = metrics;
    
    // Retirement risk (0-10 scale to 0-40 points)
    const retirementScore = (demographics.retirementRiskScore / 10) * 40;
    
    // Business without succession plan ratio (0-30 points)
    const successionRatio = demographics.businessesWithoutSuccessionPlan / demographics.boomerBusinessOwners;
    const successionScore = successionRatio * 30;
    
    // Average owner age proximity to retirement (0-30 points)
    const ageScore = Math.max(0, (demographics.avgOwnerAge - 55) / 10 * 30);
    
    return Math.min(100, retirementScore + successionScore + ageScore);
  }

  /**
   * Score market dynamics (multiples, transaction volume, days on market)
   */
  private static scoreMarketDynamics(metrics: MarketMetrics): number {
    const { market } = metrics;
    
    // Extract multiple value (e.g., "3.2x EBITDA" -> 3.2)
    const multipleValue = parseFloat(market.avgMultiple.match(/(\d+\.?\d*)/)?.[1] || '0');
    
    // Lower multiples are better for buyers (0-40 points)
    const multipleScore = Math.max(0, 40 - (multipleValue - 2.5) * 10);
    
    // Higher transaction volume is better (0-30 points)
    const volumeScore = Math.min(30, market.yearlyTransactions / 30);
    
    // Shorter days on market indicates liquid market (0-30 points)
    const liquidityScore = Math.max(0, 30 - (market.avgDaysOnMarket - 60) / 4);
    
    return Math.min(100, multipleScore + volumeScore + liquidityScore);
  }

  /**
   * Score growth indicators
   */
  private static scoreGrowth(metrics: MarketMetrics): number {
    const { growth } = metrics;
    
    // Parse growth percentages
    const popGrowth = parseFloat(growth.populationGrowth.match(/([+-]?\d+\.?\d*)/)?.[1] || '0');
    const bizGrowth = parseFloat(growth.businessGrowth.match(/([+-]?\d+\.?\d*)/)?.[1] || '0');
    const gdpGrowth = parseFloat(growth.gdpGrowth.match(/([+-]?\d+\.?\d*)/)?.[1] || '0');
    
    // Score each growth metric (0-33.33 points each)
    const popScore = Math.min(33.33, Math.max(0, popGrowth * 10));
    const bizScore = Math.min(33.33, Math.max(0, bizGrowth * 8));
    const gdpScore = Math.min(33.33, Math.max(0, gdpGrowth * 8));
    
    return Math.round(popScore + bizScore + gdpScore);
  }

  /**
   * Score competition levels (lower is better for buyers)
   */
  private static scoreCompetition(metrics: MarketMetrics): number {
    const { competition, market } = metrics;
    
    // Competition level score (0-40 points)
    const levelScore = market.competitionLevel === 'Low' ? 40 :
                      market.competitionLevel === 'Medium' ? 25 : 10;
    
    // PE presence score (0-30 points)
    const peScore = competition.pePresence === 'None' ? 30 :
                   competition.pePresence === 'Low' ? 20 :
                   competition.pePresence === 'Medium' ? 10 : 0;
    
    // Average bids per deal (0-30 points)
    const bidScore = Math.max(0, 30 - (competition.avgBidsPerDeal - 1) * 10);
    
    return Math.round(levelScore + peScore + bidScore);
  }

  /**
   * Score industry fit with Grey Tsunami opportunities
   */
  private static scoreIndustryFit(metrics: MarketMetrics): number {
    const { topIndustries } = metrics;
    
    let totalScore = 0;
    let industryCount = 0;
    
    topIndustries.forEach(industry => {
      // Find matching Grey Tsunami category
      const greyTsunamiMatch = GREY_TSUNAMI_CATEGORIES.find(cat =>
        cat.businesses.some(biz => 
          industry.name.toLowerCase().includes(biz.toLowerCase()) ||
          biz.toLowerCase().includes(industry.name.toLowerCase())
        )
      );
      
      if (greyTsunamiMatch) {
        // Use the acquisition score from Grey Tsunami data
        const acquisitionScore = greyTsunamiMatch.acquisitionScore * 10;
        const retirementScore = industry.retirementRisk * 10;
        
        totalScore += (acquisitionScore + retirementScore) / 2;
        industryCount++;
      }
    });
    
    return industryCount > 0 ? Math.round(totalScore / industryCount) : 50;
  }

  /**
   * Score individual industries within a market
   */
  static scoreIndustries(metrics: MarketMetrics): IndustryScore[] {
    return metrics.topIndustries.map(industry => {
      const greyTsunamiMatch = GREY_TSUNAMI_CATEGORIES.find(cat =>
        cat.businesses.some(biz => 
          industry.name.toLowerCase().includes(biz.toLowerCase()) ||
          biz.toLowerCase().includes(industry.name.toLowerCase())
        )
      );
      
      const acquisitionScore = greyTsunamiMatch ? greyTsunamiMatch.acquisitionScore : 5;
      const growthRate = parseFloat(industry.growthRate.match(/([+-]?\d+\.?\d*)/)?.[1] || '0');
      
      const factors = {
        retirementRisk: industry.retirementRisk * 10,
        marketSize: Math.min(100, industry.businessCount / 20),
        growthRate: Math.min(100, growthRate * 15),
        acquisitionScore: acquisitionScore * 10
      };
      
      const score = (
        factors.retirementRisk * 0.35 +
        factors.marketSize * 0.25 +
        factors.growthRate * 0.20 +
        factors.acquisitionScore * 0.20
      );
      
      return {
        industry: industry.name,
        score: Math.round(score),
        factors
      };
    });
  }

  /**
   * Get market health indicators
   */
  static getMarketHealth(metrics: MarketMetrics): {
    status: 'Hot' | 'Warm' | 'Cool' | 'Cold';
    color: string;
    description: string;
  } {
    const score = metrics.opportunityScore;
    
    if (score >= 85) {
      return {
        status: 'Hot',
        color: '#DC2626', // red-600
        description: 'Prime acquisition market with excellent opportunities'
      };
    } else if (score >= 75) {
      return {
        status: 'Warm',
        color: '#F59E0B', // amber-500
        description: 'Good market with solid acquisition potential'
      };
    } else if (score >= 65) {
      return {
        status: 'Cool',
        color: '#3B82F6', // blue-500
        description: 'Moderate market with selective opportunities'
      };
    } else {
      return {
        status: 'Cold',
        color: '#6B7280', // gray-500
        description: 'Challenging market with limited opportunities'
      };
    }
  }

  /**
   * Generate market insights and recommendations
   */
  static generateInsights(metrics: MarketMetrics): string[] {
    const insights: string[] = [];
    const factors = this.calculateScoringFactors(metrics);
    
    // Demographics insights
    if (factors.demographics >= 80) {
      insights.push(`🎯 Exceptional retirement risk with ${metrics.demographics.businessesWithoutSuccessionPlan.toLocaleString()} businesses lacking succession plans`);
    } else if (factors.demographics >= 60) {
      insights.push(`👴 Strong boomer concentration with average owner age of ${metrics.demographics.avgOwnerAge}`);
    }
    
    // Market dynamics insights
    if (metrics.market.avgMultiple.includes('2.') || metrics.market.avgMultiple.includes('3.0') || metrics.market.avgMultiple.includes('3.1')) {
      insights.push(`💰 Attractive valuations at ${metrics.market.avgMultiple} vs industry average`);
    }
    
    // Growth insights
    const bizGrowth = parseFloat(metrics.growth.businessGrowth.match(/([+-]?\d+\.?\d*)/)?.[1] || '0');
    if (bizGrowth >= 4) {
      insights.push(`📈 Robust business growth at ${metrics.growth.businessGrowth} annually`);
    }
    
    // Competition insights
    if (metrics.competition.pePresence === 'Low' || metrics.competition.pePresence === 'None') {
      insights.push(`🎪 Limited PE competition creates buyer-friendly environment`);
    } else if (metrics.competition.pePresence === 'High') {
      insights.push(`⚠️ High PE presence may drive up valuations and competition`);
    }
    
    // Industry insights
    const topIndustry = metrics.topIndustries[0];
    if (topIndustry && topIndustry.retirementRisk >= 8) {
      insights.push(`🔥 ${topIndustry.name} shows extreme retirement risk (${topIndustry.retirementRisk}/10)`);
    }
    
    return insights;
  }
}