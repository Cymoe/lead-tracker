export const SERVICE_TYPES = [
  'Turf',
  'Painting',
  'Remodeling',
  'Landscaping',
  'Roofing',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Concrete',
  'Fencing',
  'Pool Service',
  'Pest Control',
  'Cleaning Service',
  'Tree Service'
] as const;

export const COMMON_CITIES = [
  // Arizona
  "Phoenix, AZ", "Tucson, AZ", "Mesa, AZ", "Chandler, AZ", "Scottsdale, AZ", 
  "Gilbert, AZ", "Tempe, AZ", "Peoria, AZ", "Surprise, AZ", "Glendale, AZ",
  
  // California
  "Los Angeles, CA", "San Diego, CA", "San Jose, CA", "San Francisco, CA", 
  "Fresno, CA", "Sacramento, CA", "Oakland, CA", "Bakersfield, CA", 
  "Anaheim, CA", "Riverside, CA",
  
  // Texas
  "Houston, TX", "San Antonio, TX", "Dallas, TX", "Austin, TX", "Fort Worth, TX",
  "El Paso, TX", "Arlington, TX", "Plano, TX", "Laredo, TX", "Irving, TX",
  
  // Florida
  "Jacksonville, FL", "Miami, FL", "Tampa, FL", "Orlando, FL", "St. Petersburg, FL",
  "Hialeah, FL", "Tallahassee, FL", "Fort Lauderdale, FL", "Pembroke Pines, FL",
  
  // New York
  "New York, NY", "Buffalo, NY", "Rochester, NY", "Syracuse, NY", "Albany, NY",
  
  // Other major cities
  "Chicago, IL", "Las Vegas, NV", "Atlanta, GA", "Denver, CO", "Seattle, WA",
  "Boston, MA", "Detroit, MI", "Nashville, TN", "Portland, OR", "Memphis, TN",
  "Louisville, KY", "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM",
  "Kansas City, MO", "Omaha, NE", "Raleigh, NC", "Cleveland, OH", "Pittsburgh, PA"
];

export interface KeywordCategory {
  primary: string[];
  businessTypes: string[];
  commercial?: string[];
  local?: string[];
}

export const KEYWORD_TEMPLATES: Record<string, KeywordCategory> = {
  turf: {
    primary: [
      'turf installers',
      'artificial grass',
      'synthetic turf',
      'astroturf'
    ],
    businessTypes: [
      'turf companies',
      'turf contractors',
      'artificial grass installation',
      'synthetic lawn service',
      'turf professionals'
    ],
    commercial: [
      'commercial turf',
      'sports turf',
      'playground turf',
      'pet turf'
    ],
    local: [
      'turf near me'
    ]
  },
  landscaping: {
    primary: [
      'landscaping',
      'landscapers',
      'landscape design',
      'hardscaping'
    ],
    businessTypes: [
      'landscaping companies',
      'landscaping contractors',
      'landscape installation',
      'landscaping service'
    ],
    commercial: [
      'commercial landscaping',
      'landscape maintenance',
      'paver installation',
      'outdoor kitchen'
    ],
    local: [
      'landscapers near me'
    ]
  },
  remodeling: {
    primary: [
      'home remodeling',
      'kitchen remodeling',
      'bathroom remodeling',
      'general contractor'
    ],
    businessTypes: [
      'remodeling contractors',
      'remodeling companies',
      'renovation contractor',
      'home improvement'
    ],
    commercial: [
      'commercial remodeling',
      'kitchen renovation',
      'bathroom renovation'
    ],
    local: [
      'remodeling near me'
    ]
  },
  painting: {
    primary: [
      'painters',
      'house painting',
      'painting contractors'
    ],
    businessTypes: [
      'painting companies',
      'painting service',
      'professional painters',
      'residential painting'
    ],
    commercial: [
      'commercial painting',
      'interior painting',
      'exterior painting'
    ],
    local: [
      'painters near me'
    ]
  },
  roofing: {
    primary: [
      'roofers',
      'roofing contractors',
      'roof repair'
    ],
    businessTypes: [
      'roofing companies',
      'roof replacement',
      'roofing service',
      'roof installation'
    ],
    commercial: [
      'commercial roofing',
      'metal roofing',
      'flat roof',
      'shingle repair'
    ],
    local: [
      'roofers near me'
    ]
  },
  plumbing: {
    primary: [
      'plumbers',
      'plumbing repair',
      'plumbing service'
    ],
    businessTypes: [
      'plumbing companies',
      'plumbing contractors',
      'emergency plumber',
      'plumbing installation'
    ],
    commercial: [
      'commercial plumbing',
      'drain cleaning',
      'water heater repair',
      'sewer repair'
    ],
    local: [
      'plumbers near me'
    ]
  },
  electrical: {
    primary: [
      'electricians',
      'electrical contractors',
      'electrical repair'
    ],
    businessTypes: [
      'electrical companies',
      'electrical service',
      'emergency electrician',
      'licensed electrician'
    ],
    commercial: [
      'commercial electrical',
      'panel upgrade',
      'lighting installation',
      'wiring repair'
    ],
    local: [
      'electricians near me'
    ]
  },
  hvac: {
    primary: [
      'hvac contractors',
      'ac repair',
      'heating repair'
    ],
    businessTypes: [
      'hvac companies',
      'hvac service',
      'air conditioning',
      'hvac installation'
    ],
    commercial: [
      'commercial hvac',
      'hvac maintenance',
      'furnace repair',
      'air duct cleaning'
    ],
    local: [
      'hvac near me'
    ]
  },
  concrete: {
    primary: [
      'concrete contractors',
      'concrete companies',
      'concrete installation'
    ],
    businessTypes: [
      'concrete service',
      'concrete driveway',
      'concrete patio',
      'concrete repair'
    ],
    commercial: [
      'commercial concrete',
      'stamped concrete',
      'decorative concrete',
      'concrete foundation'
    ],
    local: [
      'concrete near me'
    ]
  },
  fencing: {
    primary: [
      'fence contractors',
      'fence companies',
      'fence installation'
    ],
    businessTypes: [
      'fencing service',
      'fence repair',
      'fence replacement',
      'gate installation'
    ],
    commercial: [
      'commercial fencing',
      'wood fence',
      'vinyl fence',
      'chain link fence'
    ],
    local: [
      'fence contractors near me'
    ]
  },
  pool: {
    primary: [
      'pool service',
      'pool companies',
      'pool maintenance'
    ],
    businessTypes: [
      'pool contractors',
      'pool cleaning',
      'pool repair',
      'swimming pool service'
    ],
    commercial: [
      'commercial pool service',
      'weekly pool service',
      'pool equipment repair',
      'pool chemical service'
    ],
    local: [
      'pool service near me'
    ]
  },
  pest: {
    primary: [
      'pest control',
      'exterminators',
      'pest control companies'
    ],
    businessTypes: [
      'pest control service',
      'pest removal',
      'pest management',
      'extermination service'
    ],
    commercial: [
      'commercial pest control',
      'termite control',
      'rodent control',
      'ant control'
    ],
    local: [
      'pest control near me'
    ]
  },
  cleaning: {
    primary: [
      'cleaning services',
      'cleaning companies',
      'house cleaning'
    ],
    businessTypes: [
      'maid service',
      'janitorial service',
      'professional cleaning',
      'cleaning contractors'
    ],
    commercial: [
      'commercial cleaning',
      'office cleaning',
      'carpet cleaning',
      'window cleaning'
    ],
    local: [
      'cleaning services near me'
    ]
  },
  tree: {
    primary: [
      'tree service',
      'tree companies',
      'tree removal'
    ],
    businessTypes: [
      'tree contractors',
      'arborist',
      'tree trimming',
      'tree care'
    ],
    commercial: [
      'commercial tree service',
      'emergency tree service',
      'stump removal',
      'tree pruning'
    ],
    local: [
      'tree service near me'
    ]
  }
};

export function generateCustomKeywords(serviceType: string): string[] {
  const baseTerm = serviceType.toLowerCase().trim();
  if (!baseTerm) return [];
  
  const keywords = [
    baseTerm,
    `${baseTerm} service`,
    `${baseTerm} company`,
    `${baseTerm} near me`
  ];
  
  // Add contractor/specialist based on context
  if (baseTerm.includes('cleaning') || baseTerm.includes('repair') || baseTerm.includes('installation')) {
    keywords.push(`${baseTerm} contractor`);
  } else {
    keywords.push(`${baseTerm} specialist`);
  }
  
  // Add professional/licensed based on service type
  if (baseTerm.includes('plumb') || baseTerm.includes('electric') || baseTerm.includes('hvac')) {
    keywords.push(`licensed ${baseTerm}`);
  } else {
    keywords.push(`professional ${baseTerm}`);
  }
  
  // Add local variations
  keywords.push(`local ${baseTerm}`);
  keywords.push(`best ${baseTerm}`);
  keywords.push(`${baseTerm} expert`);
  
  return keywords;
}