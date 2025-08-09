// State name to abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'district of columbia': 'DC',
  'washington dc': 'DC',
  'washington d.c.': 'DC'
};

// Normalize state to 2-letter abbreviation
export function normalizeState(state: string | null | undefined): string {
  if (!state) return '';
  
  const trimmed = state.trim();
  
  // If already 2 letters, assume it's an abbreviation
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }
  
  // Try to find in our mapping
  const normalized = trimmed.toLowerCase();
  const abbreviation = STATE_ABBREVIATIONS[normalized];
  
  if (abbreviation) {
    return abbreviation;
  }
  
  // If not found, return original (but uppercase if 2 letters)
  return trimmed;
}

// Get full state name from abbreviation
export function getStateName(abbreviation: string): string {
  const stateEntry = Object.entries(STATE_ABBREVIATIONS).find(([_, abbr]) => abbr === abbreviation);
  if (stateEntry) {
    return stateEntry[0].split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  return abbreviation;
}