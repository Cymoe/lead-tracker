// Sample county data for demonstration when Census API is rate-limited
import { CountyMarketMetrics } from './county-data-aggregator';

export const SAMPLE_COUNTIES: CountyMarketMetrics[] = [
  // Florida counties
  {
    fipsCode: '12011',
    countyName: 'Broward',
    state: '12',
    stateAbbr: 'FL',
    opportunityScore: 78,
    marketClassification: 'main',
    demographics: {
      population: 1952778,
      medianAge: 40.7,
      medianIncome: 60922,
    },
    businessMetrics: {
      totalBusinesses: 69421,
      boomerOwnedEstimate: 30545,
      boomerOwnershipPercentage: 0.44,
      avgBusinessSize: 13,
      annualPayroll: 34952000,
      payrollPerEmployee: 38500
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Pool Services', 'Landscaping Services', 'Pest Control'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '12086',
    countyName: 'Miami-Dade',
    state: '12',
    stateAbbr: 'FL',
    opportunityScore: 82,
    marketClassification: 'main',
    demographics: {
      population: 2716940,
      medianAge: 41.2,
      medianIncome: 54284,
    },
    businessMetrics: {
      totalBusinesses: 89234,
      boomerOwnedEstimate: 39263,
      boomerOwnershipPercentage: 0.44,
      avgBusinessSize: 11,
      annualPayroll: 42156000,
      payrollPerEmployee: 36000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['HVAC Services', 'Restaurant', 'Auto Repair'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '12099',
    countyName: 'Palm Beach',
    state: '12',
    stateAbbr: 'FL',
    opportunityScore: 76,
    marketClassification: 'main',
    demographics: {
      population: 1496770,
      medianAge: 45.2,
      medianIncome: 68742,
    },
    businessMetrics: {
      totalBusinesses: 52341,
      boomerOwnedEstimate: 23030,
      boomerOwnershipPercentage: 0.44,
      avgBusinessSize: 14,
      annualPayroll: 29874000,
      payrollPerEmployee: 42000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Golf Course Maintenance', 'Boat Services', 'Property Management'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  
  // Texas counties
  {
    fipsCode: '48201',
    countyName: 'Harris',
    state: '48',
    stateAbbr: 'TX',
    opportunityScore: 85,
    marketClassification: 'main',
    demographics: {
      population: 4731145,
      medianAge: 34.7,
      medianIncome: 65788,
    },
    businessMetrics: {
      totalBusinesses: 135623,
      boomerOwnedEstimate: 55605,
      boomerOwnershipPercentage: 0.41,
      avgBusinessSize: 17,
      annualPayroll: 152847000,
      payrollPerEmployee: 42500
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['HVAC Services', 'Commercial Cleaning', 'Oil Field Services'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '48029',
    countyName: 'Bexar',
    state: '48',
    stateAbbr: 'TX',
    opportunityScore: 79,
    marketClassification: 'main',
    demographics: {
      population: 2009324,
      medianAge: 35.3,
      medianIncome: 58642,
    },
    businessMetrics: {
      totalBusinesses: 51234,
      boomerOwnedEstimate: 21006,
      boomerOwnershipPercentage: 0.41,
      avgBusinessSize: 15,
      annualPayroll: 48562000,
      payrollPerEmployee: 38000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Restaurant', 'Auto Repair', 'Construction'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  
  // Tertiary market examples (high opportunity score)
  {
    fipsCode: '01001',
    countyName: 'Autauga',
    state: '01',
    stateAbbr: 'AL',
    opportunityScore: 88,
    marketClassification: 'tertiary',
    demographics: {
      population: 58805,
      medianAge: 38.2,
      medianIncome: 61902,
    },
    businessMetrics: {
      totalBusinesses: 924,
      boomerOwnedEstimate: 379,
      boomerOwnershipPercentage: 0.41,
      avgBusinessSize: 12,
      annualPayroll: 424826,
      payrollPerEmployee: 37885
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['HVAC Services', 'Plumbing Services', 'Electrical Contractors'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '13001',
    countyName: 'Appling',
    state: '13',
    stateAbbr: 'GA',
    opportunityScore: 82,
    marketClassification: 'tertiary',
    demographics: {
      population: 18444,
      medianAge: 40.1,
      medianIncome: 42467,
    },
    businessMetrics: {
      totalBusinesses: 287,
      boomerOwnedEstimate: 123,
      boomerOwnershipPercentage: 0.43,
      avgBusinessSize: 8,
      annualPayroll: 98234,
      payrollPerEmployee: 32000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Farm Equipment Repair', 'Trucking', 'Feed Store'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '28001',
    countyName: 'Adams',
    state: '28',
    stateAbbr: 'MS',
    opportunityScore: 80,
    marketClassification: 'tertiary',
    demographics: {
      population: 29538,
      medianAge: 42.3,
      medianIncome: 37821,
    },
    businessMetrics: {
      totalBusinesses: 412,
      boomerOwnedEstimate: 181,
      boomerOwnershipPercentage: 0.44,
      avgBusinessSize: 9,
      annualPayroll: 156234,
      payrollPerEmployee: 30000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Funeral Home', 'Auto Parts Store', 'Hardware Store'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '37001',
    countyName: 'Alamance',
    state: '37',
    stateAbbr: 'NC',
    opportunityScore: 77,
    marketClassification: 'tertiary',
    demographics: {
      population: 171415,
      medianAge: 39.2,
      medianIncome: 50540,
    },
    businessMetrics: {
      totalBusinesses: 3421,
      boomerOwnedEstimate: 1368,
      boomerOwnershipPercentage: 0.40,
      avgBusinessSize: 11,
      annualPayroll: 1234567,
      payrollPerEmployee: 35000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Textile Services', 'Machine Shop', 'Trucking'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  
  // Add more secondary markets
  {
    fipsCode: '06059',
    countyName: 'Orange',
    state: '06',
    stateAbbr: 'CA',
    opportunityScore: 74,
    marketClassification: 'main',
    demographics: {
      population: 3175692,
      medianAge: 38.0,
      medianIncome: 90234,
    },
    businessMetrics: {
      totalBusinesses: 98765,
      boomerOwnedEstimate: 37569,
      boomerOwnershipPercentage: 0.38,
      avgBusinessSize: 16,
      annualPayroll: 89234567,
      payrollPerEmployee: 48000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Medical Device Manufacturing', 'Software Consulting', 'Import/Export'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    fipsCode: '04013',
    countyName: 'Maricopa',
    state: '04',
    stateAbbr: 'AZ',
    opportunityScore: 81,
    marketClassification: 'main',
    demographics: {
      population: 4485414,
      medianAge: 37.1,
      medianIncome: 65438,
    },
    businessMetrics: {
      totalBusinesses: 123456,
      boomerOwnedEstimate: 50617,
      boomerOwnershipPercentage: 0.41,
      avgBusinessSize: 14,
      annualPayroll: 76543210,
      payrollPerEmployee: 40000
    },
    industryFocus: {
      topGreyTsunamiIndustries: ['Solar Installation', 'Pool Services', 'Property Management'],
      industryConcentration: new Map()
    },
    dataSource: {
      census: true,
      economic: false,
      industryData: false,
      lastUpdated: new Date().toISOString()
    }
  }
];

// Function to filter sample data based on filter criteria
export function filterSampleCounties(filter: any): CountyMarketMetrics[] {
  console.log('Filtering sample counties with:', filter);
  let filtered = [...SAMPLE_COUNTIES];
  
  // Apply market classification filter
  if (filter.marketClassification && filter.marketClassification.length > 0) {
    console.log('Filtering by market classification:', filter.marketClassification);
    filtered = filtered.filter(c => filter.marketClassification.includes(c.marketClassification));
    console.log('After market filter:', filtered.length, 'counties');
  }
  
  // Apply minimum opportunity score filter
  if (filter.minOpportunityScore && filter.minOpportunityScore > 0) {
    console.log('Filtering by min score:', filter.minOpportunityScore);
    filtered = filtered.filter(c => c.opportunityScore >= filter.minOpportunityScore);
    console.log('After score filter:', filtered.length, 'counties');
  }
  
  // Apply state filter
  if (filter.states && filter.states.length > 0) {
    const stateFipsMap: { [key: string]: string } = {
      'Alabama': '01',
      'Arizona': '04',
      'California': '06',
      'Florida': '12',
      'Georgia': '13',
      'Mississippi': '28',
      'North Carolina': '37',
      'Texas': '48'
    };
    
    const selectedFips = filter.states.map((s: string) => stateFipsMap[s]).filter(Boolean);
    console.log('Filtering by states:', filter.states, '-> FIPS:', selectedFips);
    filtered = filtered.filter(c => selectedFips.includes(c.state));
    console.log('After state filter:', filtered.length, 'counties');
  }
  
  // Apply grey tsunami tiers filter (simulated - in real implementation would filter by business types)
  if (filter.greyTsunamiTiers && filter.greyTsunamiTiers.length > 0) {
    console.log('WARNING: Grey Tsunami Tiers filter requested but not available in sample data');
    console.log('Requested tiers:', filter.greyTsunamiTiers);
    // In real implementation, this would filter based on business types in each tier
    // For now, we'll just log a warning but not filter
  }
  
  console.log('Final filtered result:', filtered.length, 'counties');
  return filtered;
}