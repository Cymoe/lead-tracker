// Service type prioritization system for market coverage

import { MarketTier } from './market-size';
import { SaturationMetrics } from './saturation-detection';
import { HIGH_TICKET_SERVICES, HighTicketService } from './high-ticket-services';

export interface ServiceTypePriority {
  serviceType: string;
  priority: number; // 0-100, higher is better
  reasons: string[];
  estimatedLeads: number;
  saturationLevel?: 'low' | 'medium' | 'high' | 'saturated';
  avgProjectValue?: { min: number; max: number };
  visualImpactScore?: 1 | 2 | 3 | 4 | 5;
  instagramPotential?: 'low' | 'medium' | 'high' | 'very-high';
}

// High-value service types by market tier - NOW FOCUSED ON HIGH-TICKET SERVICES
const SERVICE_TYPE_TIERS: Record<MarketTier, { primary: string[], secondary: string[], tertiary: string[] }> = {
  small: {
    primary: [
      'Pool Builders',
      'Turf Installers',
      'Kitchen Remodeling',
      'Bathroom Remodeling',
      'Exterior Contractors',
      'Deck Builders'
    ],
    secondary: [
      'Painting Companies',
      'Concrete Contractors',
      'Hardscape Contractors',
      'Landscaping Design',
      'Window & Door',
      'Roofing Contractors'
    ],
    tertiary: [
      'Fencing Contractors',
      'Solar Installers',
      'Epoxy Flooring',
      'Outdoor Kitchen',
      'Pergola & Gazebo'
    ]
  },
  medium: {
    primary: [
      'Pool Builders',
      'Turf Installers',
      'Kitchen Remodeling',
      'Bathroom Remodeling',
      'Whole Home Remodel',
      'Home Addition'
    ],
    secondary: [
      'Exterior Contractors',
      'Deck Builders',
      'Hardscape Contractors',
      'Concrete Contractors',
      'Landscaping Design',
      'Outdoor Kitchen'
    ],
    tertiary: [
      'Painting Companies',
      'Window & Door',
      'Roofing Contractors',
      'Solar Installers',
      'Smart Home',
      'Epoxy Flooring'
    ]
  },
  large: {
    primary: [
      'Landscaping',
      'Plumbing',
      'HVAC',
      'Electrician',
      'Roofing',
      'General Contractor',
      'Remodeling',
      'Kitchen Remodeling',
      'Commercial Cleaning',
      'Commercial HVAC'
    ],
    secondary: [
      'Bathroom Remodeling',
      'Painting',
      'Flooring',
      'Concrete',
      'Pool Service',
      'Home Automation',
      'Solar Installation',
      'Commercial Plumbing',
      'Commercial Electrician',
      'Property Management'
    ],
    tertiary: [
      'Window Installation',
      'Epoxy Flooring',
      'Smart Home Installation',
      'EV Charger Installation',
      'Commercial Landscaping',
      'Office Cleaning',
      'Luxury Home Builder'
    ]
  },
  mega: {
    primary: [
      'Commercial General Contractor',
      'Commercial HVAC',
      'Commercial Plumbing',
      'Commercial Electrician',
      'Residential General Contractor',
      'Luxury Home Builder',
      'Property Management',
      'Facility Management',
      'Commercial Roofing',
      'Industrial Cleaning'
    ],
    secondary: [
      'High-Rise Window Cleaning',
      'Commercial Landscaping',
      'Data Center Services',
      'Medical Facility Cleaning',
      'Hotel Renovation',
      'Office Build-Out',
      'Retail Construction',
      'Solar Installation',
      'Smart Building Systems',
      'Security Systems'
    ],
    tertiary: [
      'Specialty Construction',
      'Historic Restoration',
      'Green Building Consultant',
      'Energy Management',
      'Building Automation',
      'Parking Lot Maintenance',
      'Stadium Services',
      'Airport Services'
    ]
  }
};

// Estimated leads per service type (baseline) - UPDATED FOR HIGH-TICKET SERVICES
const ESTIMATED_LEADS_BASE: Record<string, number> = {
  // Pool & Outdoor Living
  'Pool Builders': 30,
  'Turf Installers': 25,
  'Deck Builders': 40,
  'Outdoor Kitchen': 20,
  'Pergola & Gazebo': 25,
  
  // Remodeling
  'Kitchen Remodeling': 40,
  'Bathroom Remodeling': 40,
  'Whole Home Remodel': 20,
  'Home Addition': 15,
  
  // Exterior
  'Exterior Contractors': 35,
  'Roofing Contractors': 60,
  'Window & Door': 30,
  'Painting Companies': 60,
  
  // Hardscape & Concrete
  'Concrete Contractors': 35,
  'Hardscape Contractors': 30,
  'Landscaping Design': 45,
  'Fencing Contractors': 35,
  
  // Specialty
  'Solar Installers': 20,
  'Smart Home': 15,
  'Epoxy Flooring': 20
};

/**
 * Get prioritized service types for a market
 */
export function getPrioritizedServiceTypes(
  marketTier: MarketTier,
  searchedTypes: string[],
  saturationData?: Record<string, SaturationMetrics>
): ServiceTypePriority[] {
  const tierConfig = SERVICE_TYPE_TIERS[marketTier];
  const allTypes = [
    ...tierConfig.primary,
    ...tierConfig.secondary,
    ...tierConfig.tertiary
  ];
  
  // Remove duplicates
  const uniqueTypes = Array.from(new Set(allTypes));
  
  // Calculate priorities
  const priorities: ServiceTypePriority[] = uniqueTypes.map(serviceType => {
    let priority = 50; // Base priority
    const reasons: string[] = [];
    
    // Find matching high-ticket service data
    const highTicketService = HIGH_TICKET_SERVICES.find(hts => 
      hts.name === serviceType || 
      hts.searchTerms.some(term => term.toLowerCase() === serviceType.toLowerCase())
    );
    
    // Add high-ticket service data if found
    let avgProjectValue = highTicketService?.avgProjectValue;
    let visualImpactScore = highTicketService?.visualImpactScore;
    let instagramPotential = highTicketService?.instagramPotential;
    
    // Tier-based priority
    if (tierConfig.primary.includes(serviceType)) {
      priority += 30;
      reasons.push('Top priority high-ticket service');
    } else if (tierConfig.secondary.includes(serviceType)) {
      priority += 15;
      reasons.push('Secondary high-ticket service');
    }
    
    // High-ticket value bonus
    if (highTicketService) {
      const avgValue = (highTicketService.avgProjectValue.min + highTicketService.avgProjectValue.max) / 2;
      if (avgValue >= 50000) {
        priority += 15;
        reasons.push(`Ultra high-ticket ($${(avgValue/1000).toFixed(0)}K avg)`);
      } else if (avgValue >= 25000) {
        priority += 10;
        reasons.push(`High-ticket ($${(avgValue/1000).toFixed(0)}K avg)`);
      }
      
      // Visual impact bonus
      if (highTicketService.visualImpactScore >= 4) {
        priority += 10;
        reasons.push('Excellent visual transformation potential');
      }
      
      // Instagram bonus
      if (highTicketService.instagramPotential === 'very-high') {
        priority += 5;
        reasons.push('Perfect for Instagram marketing');
      }
    }
    
    // Unsearched bonus
    if (!searchedTypes.includes(serviceType)) {
      priority += 20;
      reasons.push('Not yet searched');
    }
    
    // Saturation penalty
    const saturation = saturationData?.[serviceType];
    if (saturation) {
      if (saturation.saturationLevel === 'saturated') {
        priority -= 40;
        reasons.push('Market is saturated for this type');
      } else if (saturation.saturationLevel === 'high') {
        priority -= 20;
        reasons.push('High saturation detected');
      } else if (saturation.saturationLevel === 'medium') {
        priority -= 10;
        reasons.push('Moderate saturation');
      }
    }
    
    // Estimated leads calculation
    const baseLeads = ESTIMATED_LEADS_BASE[serviceType] || 30;
    const tierMultiplier = {
      small: 0.5,
      medium: 1.0,
      large: 1.5,
      mega: 2.0
    };
    const estimatedLeads = Math.round(baseLeads * tierMultiplier[marketTier]);
    
    return {
      serviceType,
      priority: Math.max(0, Math.min(100, priority)), // Clamp to 0-100
      reasons,
      estimatedLeads,
      saturationLevel: saturation?.saturationLevel,
      avgProjectValue,
      visualImpactScore,
      instagramPotential
    };
  });
  
  // Sort by priority descending
  return priorities.sort((a, b) => b.priority - a.priority);
}

/**
 * Get recommended service types to search next
 */
export function getNextServiceTypes(
  marketTier: MarketTier,
  searchedTypes: string[],
  saturationData?: Record<string, SaturationMetrics>,
  limit: number = 5
): string[] {
  const prioritized = getPrioritizedServiceTypes(marketTier, searchedTypes, saturationData);
  
  // Filter out saturated types and already searched
  const available = prioritized.filter(p => 
    p.priority > 30 && // Minimum priority threshold
    (!p.saturationLevel || p.saturationLevel === 'low')
  );
  
  return available.slice(0, limit).map(p => p.serviceType);
}

/**
 * Get service type search strategy
 */
export function getSearchStrategy(
  marketTier: MarketTier,
  currentPhase: 1 | 2 | 3
): { strategy: string; tips: string[] } {
  const strategies = {
    1: { // Google Maps
      small: {
        strategy: 'Focus on high-ticket visual transformation services',
        tips: [
          'Start with Pool Builders, Turf Installers, and Kitchen/Bath Remodeling',
          'These services have $25K+ average projects with dramatic before/after potential',
          'Expect 15-30 leads per service type but much higher quality'
        ]
      },
      medium: {
        strategy: 'Balance essentials with specialty services',
        tips: [
          'Cover all primary services first',
          'Add remodeling and specialty trades',
          'Look for commercial opportunities in downtown areas'
        ]
      },
      large: {
        strategy: 'Segment residential and commercial',
        tips: [
          'Search commercial variants separately (e.g., "Commercial HVAC")',
          'Include property management and facility services',
          'Focus on business districts for B2B services'
        ]
      },
      mega: {
        strategy: 'Prioritize commercial and enterprise services',
        tips: [
          'Lead with commercial general contractors',
          'Include specialized industrial services',
          'Search luxury and high-end residential separately'
        ]
      }
    },
    2: { // Facebook Ads
      small: {
        strategy: 'Target seasonal and emergency services',
        tips: [
          'Focus on services that advertise seasonally',
          'HVAC and roofing often run Facebook ads',
          'Look for "near me" and emergency service ads'
        ]
      },
      medium: {
        strategy: 'Find growth-oriented businesses',
        tips: [
          'Remodelers and contractors often advertise projects',
          'Solar and home improvement companies are active',
          'Check for before/after showcase ads'
        ]
      },
      large: {
        strategy: 'Identify market leaders and franchises',
        tips: [
          'Large companies run brand awareness campaigns',
          'Franchises often have coordinated ad campaigns',
          'Look for companies advertising multiple locations'
        ]
      },
      mega: {
        strategy: 'Focus on enterprise and specialty services',
        tips: [
          'Commercial contractors showcase major projects',
          'Property management advertises to property owners',
          'B2B services target other businesses'
        ]
      }
    },
    3: { // Instagram
      small: {
        strategy: 'Target high-ticket transformation specialists',
        tips: [
          'Pool builders and outdoor living contractors showcase amazing transformations',
          'Search hashtags like #poolbuilder #outdoorkitchen #turfinstallation',
          'Look for before/after posts with high engagement'
        ]
      },
      medium: {
        strategy: 'Target design-focused trades',
        tips: [
          'Kitchen and bathroom remodelers are very active',
          'Interior designers and decorators',
          'High-end landscaping and outdoor living'
        ]
      },
      large: {
        strategy: 'Leverage influencer partnerships',
        tips: [
          'Companies partner with local home influencers',
          'Luxury services showcase high-end projects',
          'Commercial projects for social proof'
        ]
      },
      mega: {
        strategy: 'Focus on prestige and showcase projects',
        tips: [
          'Major commercial projects and developments',
          'Luxury residential showcases',
          'Award-winning and featured projects'
        ]
      }
    }
  };
  
  return strategies[currentPhase][marketTier];
}

/**
 * Get service type combinations that work well together
 */
export function getServiceTypeCombos(marketTier: MarketTier): Array<{
  combo: string[];
  reason: string;
}> {
  const combos = [
    {
      combo: ['Pool Builders', 'Outdoor Kitchen', 'Hardscape Contractors'],
      reason: 'Complete backyard transformation specialists'
    },
    {
      combo: ['Kitchen Remodeling', 'Bathroom Remodeling', 'Whole Home Remodel'],
      reason: 'Full interior renovation services'
    },
    {
      combo: ['Turf Installers', 'Landscaping Design', 'Concrete Contractors'],
      reason: 'Complete yard makeover services'
    },
    {
      combo: ['Exterior Contractors', 'Window & Door', 'Roofing Contractors'],
      reason: 'Complete exterior transformation'
    },
    {
      combo: ['Deck Builders', 'Pergola & Gazebo', 'Outdoor Living'],
      reason: 'Outdoor entertainment space specialists'
    }
  ];
  
  // Add market-specific combos
  if (marketTier === 'large' || marketTier === 'mega') {
    combos.push({
      combo: ['Commercial HVAC', 'Commercial Plumbing', 'Commercial Electrician'],
      reason: 'Commercial building systems'
    });
    combos.push({
      combo: ['Property Management', 'Facility Management', 'Commercial Cleaning'],
      reason: 'Building management services'
    });
  }
  
  if (marketTier === 'mega') {
    combos.push({
      combo: ['Luxury Home Builder', 'High-End Remodeling', 'Custom Homes'],
      reason: 'Luxury residential market'
    });
  }
  
  return combos;
}