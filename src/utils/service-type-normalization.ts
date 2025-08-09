// Service type normalization mappings and utilities

export interface ServiceTypeMapping {
  canonicalName: string;
  variations: string[];
  category: string;
  keywords?: string[];
}

// Comprehensive service type mappings
export const SERVICE_TYPE_MAPPINGS: ServiceTypeMapping[] = [
  // Home Improvement & Construction
  {
    canonicalName: 'General Contractor',
    variations: ['contractor', 'general contractor', 'general', 'construction company', 'builders', 'builder', 'construction'],
    category: 'Home Services',
    keywords: ['contractor', 'construction', 'builder']
  },
  {
    canonicalName: 'Home Builder',
    variations: ['home builder', 'custom home builder', 'home construction', 'residential builder', 'house builder'],
    category: 'Home Services',
    keywords: ['home', 'builder', 'custom']
  },
  {
    canonicalName: 'Remodeling',
    variations: ['bathroom remodeler', 'kitchen remodeler', 'full yard remodel', 'home remodeling', 'renovation'],
    category: 'Home Services',
    keywords: ['remodel', 'renovation']
  },
  
  // Flooring
  {
    canonicalName: 'Flooring',
    variations: ['flooring', 'flooring contractor', 'floor refinishing service', 'tile contractor', 'hardwood flooring', 'carpet installation'],
    category: 'Home Services',
    keywords: ['floor', 'tile', 'carpet']
  },
  
  // Landscaping & Outdoor
  {
    canonicalName: 'Landscaping',
    variations: [
      'landscaping', 'landscaping services', 'luxury landscaping', 'paver and landscaping',
      'lawn care service', 'lawn service', 'lawn sprinkler system contractor', 'artificial turf',
      'artificial turf installation', 'synthetic turf & paver installation', 'hardscape', 'hard scape'
    ],
    category: 'Home Services',
    keywords: ['landscap', 'lawn', 'turf', 'hardscape']
  },
  
  // Pool Services
  {
    canonicalName: 'Pool Services',
    variations: [
      'swimming pool contractor', 'swimming pool repair service', 'pool cleaning service',
      'pool maintenance', 'pool service', 'pool builder', 'pool construction'
    ],
    category: 'Home Services',
    keywords: ['pool', 'swimming']
  },
  
  // Pest Control
  {
    canonicalName: 'Pest Control',
    variations: [
      'pest control service', 'pest control', 'animal control service', 'bird control service',
      'exterminator', 'termite control', 'rodent control'
    ],
    category: 'Home Services',
    keywords: ['pest', 'control', 'exterminator']
  },
  
  // Window Services
  {
    canonicalName: 'Window Services',
    variations: [
      'window installation service', 'window tinting service', 'auto window tinting service',
      'window replacement', 'window repair', 'glass service', 'glass repair service',
      'windows services', 'window service', 'windows service'
    ],
    category: 'Home Services',
    keywords: ['window', 'glass', 'tinting']
  },
  
  // Roofing
  {
    canonicalName: 'Roofing',
    variations: [
      'roofing', 'roofing contractor', 'roofing and construction', 'roof repair',
      'roof replacement', 'roofer'
    ],
    category: 'Home Services',
    keywords: ['roof']
  },
  
  // Garage Services
  {
    canonicalName: 'Garage Door Services',
    variations: ['garage door supplier', 'garage doors', 'garage door repair', 'garage door installation', 'garages'],
    category: 'Home Services',
    keywords: ['garage', 'door']
  },
  
  // Fencing
  {
    canonicalName: 'Fencing',
    variations: ['fencing', 'fence contractor', 'welding / fencing', 'fence installation', 'fence repair'],
    category: 'Home Services',
    keywords: ['fence', 'fencing']
  },
  
  // HVAC
  {
    canonicalName: 'HVAC',
    variations: ['hvac', 'heating and cooling', 'air conditioning', 'ac repair', 'furnace repair'],
    category: 'Home Services',
    keywords: ['hvac', 'heating', 'cooling', 'air']
  },
  
  // Plumbing
  {
    canonicalName: 'Plumbing',
    variations: ['plumbing', 'plumber', 'plumbing service', 'plumbing contractor'],
    category: 'Home Services',
    keywords: ['plumb']
  },
  
  // Electrical
  {
    canonicalName: 'Electrical',
    variations: ['electrical', 'electrician', 'electrical contractor', 'electrical service'],
    category: 'Home Services',
    keywords: ['electric']
  },
  
  // Painting
  {
    canonicalName: 'Painting',
    variations: ['painting', 'painter', 'painting contractor', 'house painting', 'commercial painting'],
    category: 'Home Services',
    keywords: ['paint']
  },
  
  // Cleaning Services
  {
    canonicalName: 'Cleaning Services',
    variations: ['cleaning', 'cleaning service', 'outdoor cleaning', 'house cleaning', 'commercial cleaning', 'janitorial'],
    category: 'Home Services',
    keywords: ['clean']
  },
  
  // Handyman
  {
    canonicalName: 'Handyman',
    variations: ['handyman', 'handywoman', 'handyperson', 'handyman services', 'handyman/handywoman/handyperson'],
    category: 'Home Services',
    keywords: ['handy']
  },
  
  // Interior Design
  {
    canonicalName: 'Interior Design',
    variations: ['interior designer', 'interior design', 'interiorista', 'home staging', 'decorator'],
    category: 'Professional Services',
    keywords: ['interior', 'design']
  },
  
  // Cabinet & Countertop
  {
    canonicalName: 'Cabinet & Countertop',
    variations: [
      'cabinet maker', 'cabinets', 'countertop contractor', 'kitchen cabinets',
      'cabinet installation', 'granite supplier', 'closets'
    ],
    category: 'Home Services',
    keywords: ['cabinet', 'countertop', 'granite']
  },
  
  // Concrete & Masonry
  {
    canonicalName: 'Concrete & Masonry',
    variations: ['concrete contractor', 'masonry contractor', 'concrete', 'brick work', 'stone work', 'paving contractor'],
    category: 'Home Services',
    keywords: ['concrete', 'masonry', 'paving']
  },
  
  // Automotive
  {
    canonicalName: 'Auto Detailing',
    variations: ['car detailing service', 'auto detailing', 'car wash', 'mobile detailing'],
    category: 'Automotive',
    keywords: ['detail', 'car', 'auto']
  },
  
  // Home Systems
  {
    canonicalName: 'Home Automation',
    variations: ['home automation company', 'smart home', 'home theater', 'home cinema installation'],
    category: 'Home Services',
    keywords: ['automation', 'smart', 'theater', 'cinema']
  },
  
  // Welding & Metal
  {
    canonicalName: 'Welding Services',
    variations: ['aluminum welder', 'aluminum supplier', 'welding', 'metal fabrication', 'welding / fencing'],
    category: 'Home Services',
    keywords: ['weld', 'aluminum', 'metal']
  },
  
  // Doors
  {
    canonicalName: 'Door Services',
    variations: ['door manufacturer', 'door supplier', 'door installation', 'entry doors'],
    category: 'Home Services',
    keywords: ['door']
  },
  
  // Screen Services
  {
    canonicalName: 'Screen Repair',
    variations: ['screen repair service', 'screen installation', 'screen enclosure'],
    category: 'Home Services',
    keywords: ['screen']
  },
  
  // Animal Services
  {
    canonicalName: 'Animal Services',
    variations: ['animal shelter', 'animal protection organization', 'pet adoption service', 'veterinary'],
    category: 'Pet Services',
    keywords: ['animal', 'pet', 'shelter']
  },
  
  // Miscellaneous
  {
    canonicalName: 'Epoxy Services',
    variations: ['epoxy', 'epoxy flooring', 'epoxy coating'],
    category: 'Home Services',
    keywords: ['epoxy']
  },
  {
    canonicalName: 'Building Supplies',
    variations: ['building materials supplier', 'construction supplies', 'lumber yard'],
    category: 'Retail & Shopping',
    keywords: ['building', 'materials', 'supplier']
  },
  {
    canonicalName: 'Design Services',
    variations: ['design agency', 'graphic design', 'web design'],
    category: 'Professional Services',
    keywords: ['design', 'agency']
  },
  
  // Additional mappings for unmapped services
  {
    canonicalName: 'Aesthetics',
    variations: ['aesthetics', 'aesthetic', 'aesthetic services', 'medical aesthetics', 'aesthetic clinic'],
    category: 'Beauty & Personal Care',
    keywords: ['aesthetic']
  },
  {
    canonicalName: 'Design Agency',
    variations: ['design agency', 'creative agency', 'branding agency', 'digital agency'],
    category: 'Professional Services',
    keywords: ['agency', 'design']
  },
  {
    canonicalName: 'Home Maintenance',
    variations: ['home maintenance', 'property maintenance', 'house maintenance', 'maintenance services'],
    category: 'Home Services',
    keywords: ['maintenance', 'home']
  },
  {
    canonicalName: 'Jewelry',
    variations: ['jewelry', 'jeweler', 'jewelry store', 'jewelry repair', 'custom jewelry'],
    category: 'Retail & Shopping',
    keywords: ['jewelry', 'jewel']
  },
  {
    canonicalName: 'Window Tinting',
    variations: ['window tinting', 'car tinting', 'tint shop', 'window tint'],
    category: 'Automotive',
    keywords: ['tint', 'tinting']
  },
  {
    canonicalName: 'Auto Detailing',
    variations: ['auto detailing', 'car detailing', 'mobile detailing', 'detail shop'],
    category: 'Automotive',
    keywords: ['detail', 'detailing']
  }
];

// Normalize a service type to its canonical form
export function normalizeServiceType(serviceType: string | null | undefined): string | null {
  if (!serviceType) return null;
  
  const normalized = serviceType.toLowerCase().trim();
  const trimmedOriginal = serviceType.trim();
  
  // Check if the service type itself IS a canonical name
  for (const mapping of SERVICE_TYPE_MAPPINGS) {
    if (mapping.canonicalName.toLowerCase() === normalized) {
      return mapping.canonicalName;
    }
  }
  
  // First, try exact match in variations
  for (const mapping of SERVICE_TYPE_MAPPINGS) {
    if (mapping.variations.some(v => v.toLowerCase() === normalized)) {
      return mapping.canonicalName;
    }
  }
  
  // Then, try keyword matching
  for (const mapping of SERVICE_TYPE_MAPPINGS) {
    if (mapping.keywords) {
      for (const keyword of mapping.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          return mapping.canonicalName;
        }
      }
    }
  }
  
  // Special handling for common unmapped types
  if (normalized === 'aesthetics') return 'Aesthetics';
  if (normalized === 'design agency') return 'Design Agency';
  if (normalized === 'animal services') return 'Animal Services';
  if (normalized === 'home maintenance') return 'Home Maintenance';
  if (normalized === 'jewelry') return 'Jewelry';
  if (normalized === 'window tinting') return 'Window Tinting';
  if (normalized === 'auto detailing') return 'Auto Detailing';
  if (normalized === 'windows services') return 'Window Services';
  if (normalized === 'windows service') return 'Window Services';
  
  // If no match found, return the original (cleaned up)
  return trimmedOriginal;
}

// Get the category for a normalized service type
export function getCategoryForNormalizedType(normalizedType: string): string {
  const mapping = SERVICE_TYPE_MAPPINGS.find(m => m.canonicalName === normalizedType);
  return mapping?.category || 'Other Services';
}

// Get all variations for a canonical service type
export function getVariationsForType(canonicalName: string): string[] {
  const mapping = SERVICE_TYPE_MAPPINGS.find(m => m.canonicalName === canonicalName);
  return mapping?.variations || [];
}

// Get normalization confidence (for future use)
export function getNormalizationConfidence(original: string, normalized: string): number {
  if (!original || !normalized) return 0;
  
  const originalLower = original.toLowerCase().trim();
  const mapping = SERVICE_TYPE_MAPPINGS.find(m => m.canonicalName === normalized);
  
  if (!mapping) return 0.5; // Medium confidence for unmapped
  
  // Exact match
  if (mapping.variations.some(v => v.toLowerCase() === originalLower)) {
    return 1.0; // High confidence
  }
  
  // Keyword match
  if (mapping.keywords?.some(k => originalLower.includes(k.toLowerCase()))) {
    return 0.8; // Good confidence
  }
  
  return 0.5; // Medium confidence
}

// Get all unmapped service types from a list
export function getUnmappedServiceTypes(serviceTypes: string[]): string[] {
  const unmapped: string[] = [];
  
  for (const type of serviceTypes) {
    if (type) {
      const normalized = normalizeServiceType(type);
      // If normalization returns the same value, it's likely unmapped
      if (normalized === type.trim() && 
          !SERVICE_TYPE_MAPPINGS.some(m => m.canonicalName === normalized)) {
        unmapped.push(type);
      }
    }
  }
  
  return Array.from(new Set(unmapped)); // Remove duplicates
}

// Suggest mapping for an unmapped type (for future admin interface)
export function suggestMapping(unmappedType: string): ServiceTypeMapping | null {
  const normalized = unmappedType.toLowerCase().trim();
  let bestMatch: ServiceTypeMapping | null = null;
  let bestScore = 0;
  
  for (const mapping of SERVICE_TYPE_MAPPINGS) {
    // Check for partial matches in existing variations
    for (const variation of mapping.variations) {
      const similarity = calculateSimilarity(normalized, variation.toLowerCase());
      if (similarity > bestScore && similarity > 0.6) { // 60% similarity threshold
        bestScore = similarity;
        bestMatch = mapping;
      }
    }
  }
  
  return bestMatch;
}

// Simple string similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance for string similarity
function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}