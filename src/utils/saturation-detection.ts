// Saturation detection utilities for market coverage

export interface SaturationMetrics {
  duplicateRate: number;
  newLeadsRate: number;
  saturationLevel: 'low' | 'medium' | 'high' | 'saturated';
  recommendation: string;
}

export interface ImportMetrics {
  totalFound: number;
  duplicates: number;
  imported: number;
  timestamp: Date;
  serviceType?: string;
  searchQuery?: string;
}

/**
 * Calculate saturation metrics from import history
 */
export function calculateSaturation(
  recentImports: ImportMetrics[],
  threshold: number = 5
): SaturationMetrics {
  // Get the most recent imports (up to threshold)
  const imports = recentImports.slice(-threshold);
  
  if (imports.length === 0) {
    return {
      duplicateRate: 0,
      newLeadsRate: 100,
      saturationLevel: 'low',
      recommendation: 'Start searching to build coverage'
    };
  }
  
  // Calculate average duplicate rate
  const totalFound = imports.reduce((sum, imp) => sum + imp.totalFound, 0);
  const totalDuplicates = imports.reduce((sum, imp) => sum + imp.duplicates, 0);
  const totalImported = imports.reduce((sum, imp) => sum + imp.imported, 0);
  
  const duplicateRate = totalFound > 0 ? Math.round((totalDuplicates / totalFound) * 100) : 0;
  const newLeadsRate = 100 - duplicateRate;
  
  // Determine saturation level
  let saturationLevel: SaturationMetrics['saturationLevel'];
  let recommendation: string;
  
  if (duplicateRate >= 80) {
    saturationLevel = 'saturated';
    recommendation = 'Market is saturated. Move to next phase for new leads.';
  } else if (duplicateRate >= 60) {
    saturationLevel = 'high';
    recommendation = 'High saturation detected. Consider exploring different service types or moving to next phase.';
  } else if (duplicateRate >= 40) {
    saturationLevel = 'medium';
    recommendation = 'Moderate saturation. Try variations of service types or different search terms.';
  } else {
    saturationLevel = 'low';
    recommendation = 'Low saturation. Continue current search strategy.';
  }
  
  return {
    duplicateRate,
    newLeadsRate,
    saturationLevel,
    recommendation
  };
}

/**
 * Get saturation trend from import history
 */
export function getSaturationTrend(
  imports: ImportMetrics[],
  windowSize: number = 3
): 'improving' | 'stable' | 'worsening' {
  if (imports.length < windowSize * 2) {
    return 'stable';
  }
  
  // Compare recent window vs previous window
  const recentWindow = imports.slice(-windowSize);
  const previousWindow = imports.slice(-windowSize * 2, -windowSize);
  
  const recentMetrics = calculateSaturation(recentWindow, windowSize);
  const previousMetrics = calculateSaturation(previousWindow, windowSize);
  
  const diff = recentMetrics.duplicateRate - previousMetrics.duplicateRate;
  
  if (diff > 10) return 'worsening';
  if (diff < -10) return 'improving';
  return 'stable';
}

/**
 * Get service type saturation metrics
 */
export function getServiceTypeSaturation(
  imports: ImportMetrics[]
): Record<string, SaturationMetrics> {
  const byServiceType: Record<string, ImportMetrics[]> = {};
  
  // Group imports by service type
  imports.forEach(imp => {
    const type = imp.serviceType || 'unknown';
    if (!byServiceType[type]) {
      byServiceType[type] = [];
    }
    byServiceType[type].push(imp);
  });
  
  // Calculate saturation for each service type
  const results: Record<string, SaturationMetrics> = {};
  
  Object.entries(byServiceType).forEach(([type, typeImports]) => {
    results[type] = calculateSaturation(typeImports);
  });
  
  return results;
}

/**
 * Get recommended service types based on saturation levels
 */
export function getRecommendedServiceTypes(
  serviceTypeSaturation: Record<string, SaturationMetrics>,
  allServiceTypes: string[]
): string[] {
  // Find service types that haven't been searched or have low saturation
  const recommended = allServiceTypes.filter(type => {
    const saturation = serviceTypeSaturation[type];
    return !saturation || saturation.saturationLevel === 'low';
  });
  
  // Sort by saturation level (unsearched first, then by newLeadsRate)
  return recommended.sort((a, b) => {
    const satA = serviceTypeSaturation[a];
    const satB = serviceTypeSaturation[b];
    
    if (!satA && !satB) return 0;
    if (!satA) return -1;
    if (!satB) return 1;
    
    return satB.newLeadsRate - satA.newLeadsRate;
  });
}

/**
 * Check if a phase should be considered complete based on saturation
 */
export function isPhaseComplete(
  phaseImports: ImportMetrics[],
  minServiceTypes: number,
  serviceTypesSearched: number
): { complete: boolean; reason: string } {
  if (serviceTypesSearched < minServiceTypes) {
    return {
      complete: false,
      reason: `Need to search at least ${minServiceTypes} service types (current: ${serviceTypesSearched})`
    };
  }
  
  const saturation = calculateSaturation(phaseImports);
  
  if (saturation.saturationLevel === 'saturated') {
    return {
      complete: true,
      reason: 'Phase is saturated - time to move to next phase'
    };
  }
  
  if (saturation.saturationLevel === 'high' && serviceTypesSearched >= minServiceTypes * 1.5) {
    return {
      complete: true,
      reason: 'High saturation reached with sufficient service type coverage'
    };
  }
  
  return {
    complete: false,
    reason: 'Continue searching for more coverage'
  };
}