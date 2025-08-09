// Market size definitions and utilities

export type MarketTier = 'small' | 'medium' | 'large' | 'mega';

export interface MarketSizeConfig {
  tier: MarketTier;
  minServiceTypes: number;
  targetServiceTypes: number;
  maxServiceTypes: number;
  description: string;
}

// Population data for major US cities (rough estimates)
export const CITY_POPULATIONS: Record<string, number> = {
  // Texas
  'Houston': 2300000,
  'San Antonio': 1500000,
  'Dallas': 1300000,
  'Austin': 1000000,
  'Fort Worth': 950000,
  'El Paso': 680000,
  'Arlington': 400000,
  'Corpus Christi': 330000,
  'Plano': 290000,
  'Laredo': 260000,
  'Lubbock': 260000,
  'Garland': 240000,
  'Irving': 240000,
  'Amarillo': 200000,
  'Grand Prairie': 200000,
  'Brownsville': 190000,
  'McKinney': 190000,
  'Frisco': 190000,
  'Pasadena': 150000,
  'Mesquite': 150000,
  'Killeen': 150000,
  'McAllen': 145000,
  'Waco': 140000,
  'Carrollton': 140000,
  'Denton': 140000,
  'Midland': 135000,
  'Abilene': 125000,
  'Beaumont': 120000,
  'Round Rock': 120000,
  'Odessa': 120000,
  'Richardson': 120000,
  'Wichita Falls': 105000,
  'Tyler': 105000,
  'Lewisville': 105000,
  'College Station': 115000,
  'San Angelo': 100000,
  'Allen': 100000,
  'League City': 100000,
  'Sugar Land': 95000,
  'Mission': 85000,
  'Longview': 82000,
  'Bryan': 85000,
  'Pharr': 80000,
  'Baytown': 80000,
  'Missouri City': 75000,
  'Temple': 75000,
  'Flower Mound': 75000,
  
  // Add more cities as needed
};

// Market tier configurations
export const MARKET_TIERS: Record<MarketTier, MarketSizeConfig> = {
  small: {
    tier: 'small',
    minServiceTypes: 2,
    targetServiceTypes: 3,
    maxServiceTypes: 4,
    description: 'Small markets (< 100k population)'
  },
  medium: {
    tier: 'medium',
    minServiceTypes: 4,
    targetServiceTypes: 5,
    maxServiceTypes: 7,
    description: 'Medium markets (100k-500k population)'
  },
  large: {
    tier: 'large',
    minServiceTypes: 6,
    targetServiceTypes: 8,
    maxServiceTypes: 12,
    description: 'Large markets (500k-1M population)'
  },
  mega: {
    tier: 'mega',
    minServiceTypes: 8,
    targetServiceTypes: 12,
    maxServiceTypes: 15,
    description: 'Mega markets (1M+ population)'
  }
};

/**
 * Get market tier based on city population
 */
export function getMarketTier(city: string, state?: string): MarketTier {
  const population = CITY_POPULATIONS[city] || 0;
  
  if (population >= 1000000) return 'mega';
  if (population >= 500000) return 'large';
  if (population >= 100000) return 'medium';
  return 'small';
}

/**
 * Get market size configuration for a city
 */
export function getMarketSizeConfig(city: string, state?: string): MarketSizeConfig {
  const tier = getMarketTier(city, state);
  return MARKET_TIERS[tier];
}

/**
 * Calculate adjusted coverage percentage based on market size
 */
export function calculateAdjustedCoverage(
  serviceTypesFound: number,
  city: string,
  state?: string
): number {
  const config = getMarketSizeConfig(city, state);
  
  // Calculate percentage based on target for this market size
  const percentage = (serviceTypesFound / config.targetServiceTypes) * 100;
  
  // Cap at 100%
  return Math.min(Math.round(percentage), 100);
}

/**
 * Get recommended number of service types for a market
 */
export function getRecommendedServiceTypes(city: string, state?: string): {
  minimum: number;
  target: number;
  maximum: number;
} {
  const config = getMarketSizeConfig(city, state);
  return {
    minimum: config.minServiceTypes,
    target: config.targetServiceTypes,
    maximum: config.maxServiceTypes
  };
}