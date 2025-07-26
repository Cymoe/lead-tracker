import { KeywordCategory, KEYWORD_TEMPLATES } from './constants';

// Major cities and their key suburbs for location-specific searches
const CITY_SUBURBS: Record<string, string[]> = {
  'Phoenix': ['Scottsdale', 'Mesa', 'Tempe', 'Chandler', 'Gilbert', 'Glendale'],
  'Los Angeles': ['Hollywood', 'Santa Monica', 'Pasadena', 'Long Beach', 'Burbank'],
  'San Diego': ['La Jolla', 'Carlsbad', 'Chula Vista', 'Escondido', 'Oceanside'],
  'Houston': ['Katy', 'Sugar Land', 'The Woodlands', 'Pearland', 'Cypress'],
  'Dallas': ['Plano', 'Frisco', 'Arlington', 'Irving', 'McKinney'],
  'Miami': ['Coral Gables', 'Miami Beach', 'Aventura', 'Brickell', 'Coconut Grove'],
  'Chicago': ['Naperville', 'Evanston', 'Oak Park', 'Schaumburg', 'Aurora'],
  'Las Vegas': ['Henderson', 'Summerlin', 'North Las Vegas', 'Spring Valley'],
  'Atlanta': ['Buckhead', 'Sandy Springs', 'Marietta', 'Alpharetta', 'Decatur'],
  'Denver': ['Aurora', 'Lakewood', 'Westminster', 'Littleton', 'Centennial'],
};

export interface GeneratedKeywords {
  primary: string[];
  businessTypes: string[];
  commercial: string[];
  local: string[];
  totalCount: number;
}

export function generateKeywordsForService(
  serviceType: string, 
  city: string,
  includeSuburbs: boolean = true
): GeneratedKeywords {
  const template = KEYWORD_TEMPLATES[serviceType];
  
  if (!template) {
    // Generate custom keywords if service type not found
    return generateCustomKeywordsStructured(serviceType, city, includeSuburbs);
  }

  const keywords: GeneratedKeywords = {
    primary: [],
    businessTypes: [],
    commercial: [],
    local: [],
    totalCount: 0
  };

  // Add city to all primary keywords
  keywords.primary = template.primary.map(kw => `${kw} ${city}`);

  // Add city to all business type keywords
  keywords.businessTypes = template.businessTypes.map(kw => `${kw} ${city}`);

  // Add city to commercial keywords
  if (template.commercial) {
    keywords.commercial = template.commercial.map(kw => `${kw} ${city}`);
  }

  // Add local keywords (already include "near me")
  if (template.local) {
    keywords.local = [...template.local];
  }

  // Add suburb-specific keywords if enabled
  if (includeSuburbs) {
    const cityName = city.split(',')[0].trim();
    const suburbs = CITY_SUBURBS[cityName] || [];
    
    if (suburbs.length > 0) {
      // Add top 3 suburbs with most important keyword variations
      const topSuburbs = suburbs.slice(0, 3);
      topSuburbs.forEach(suburb => {
        // Add the most effective keyword pattern for each suburb
        if (template.primary[0]) {
          keywords.local.push(`${template.primary[0]} ${suburb}`);
        }
        if (template.primary[1] && template.primary[1] !== template.primary[0]) {
          keywords.local.push(`${template.primary[1]} ${suburb}`);
        }
      });
    }
  }

  keywords.totalCount = 
    keywords.primary.length + 
    keywords.businessTypes.length + 
    keywords.commercial.length + 
    keywords.local.length;

  return keywords;
}

function generateCustomKeywordsStructured(
  serviceType: string, 
  city: string,
  includeSuburbs: boolean
): GeneratedKeywords {
  const baseTerm = serviceType.toLowerCase().trim();
  
  const keywords: GeneratedKeywords = {
    primary: [
      `${baseTerm} ${city}`,
      `${baseTerm} service ${city}`,
      `${baseTerm} companies ${city}`,
      `${baseTerm} contractors ${city}`
    ],
    businessTypes: [
      `${baseTerm} installation ${city}`,
      `${baseTerm} repair ${city}`,
      `professional ${baseTerm} ${city}`,
      `licensed ${baseTerm} ${city}`
    ],
    commercial: [
      `commercial ${baseTerm} ${city}`,
      `residential ${baseTerm} ${city}`
    ],
    local: [
      `${baseTerm} near me`,
      `best ${baseTerm} ${city}`,
      `local ${baseTerm} ${city}`
    ],
    totalCount: 0
  };

  // Add suburb variations if applicable
  if (includeSuburbs) {
    const cityName = city.split(',')[0].trim();
    const suburbs = CITY_SUBURBS[cityName] || [];
    
    if (suburbs.length > 0) {
      suburbs.slice(0, 2).forEach(suburb => {
        keywords.local.push(`${baseTerm} ${suburb}`);
      });
    }
  }

  keywords.totalCount = 
    keywords.primary.length + 
    keywords.businessTypes.length + 
    keywords.commercial.length + 
    keywords.local.length;

  return keywords;
}

export function getAllKeywordsFlat(keywords: GeneratedKeywords): string[] {
  return [
    ...keywords.primary,
    ...keywords.businessTypes,
    ...keywords.commercial,
    ...keywords.local
  ];
}

export function getKeywordsByCategory(
  keywords: GeneratedKeywords, 
  category: keyof GeneratedKeywords
): string[] {
  if (category === 'totalCount') return [];
  return keywords[category] || [];
}