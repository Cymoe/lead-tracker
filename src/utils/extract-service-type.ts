/**
 * Extract service type from various search query formats
 */
export function extractServiceTypeFromQuery(query: string): string | null {
  if (!query) return null;
  
  // Patterns to try in order
  const patterns = [
    // "Service Type in City, State" format
    /^(.+?)\s+in\s+.+$/i,
    
    // "Service Type near City" format
    /^(.+?)\s+near\s+.+$/i,
    
    // "City State Service Type" format (service at end)
    /^[A-Za-z\s]+,?\s+[A-Z]{2}\s+(.+)$/i,
    
    // "Service Type City State" format (service at beginning)
    /^(.+?)\s+[A-Za-z\s]+,?\s+[A-Z]{2}$/i,
    
    // Just return the whole query if no pattern matches
    // (will be cleaned up below)
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return cleanServiceType(match[1]);
    }
  }
  
  // If no pattern matches, try to clean up the query
  // Remove common location words
  const locationWords = [
    'near me', 'nearby', 'local', 'around here',
    'in my area', 'close by', 'in town'
  ];
  
  let cleaned = query;
  locationWords.forEach(word => {
    cleaned = cleaned.replace(new RegExp(word, 'gi'), '').trim();
  });
  
  // Remove state abbreviations at the end
  cleaned = cleaned.replace(/,?\s+[A-Z]{2}$/i, '').trim();
  
  // Remove city names that might be at the beginning or end
  // This is tricky without a full city list, so we'll be conservative
  
  return cleanServiceType(cleaned) || null;
}

/**
 * Clean up extracted service type
 */
function cleanServiceType(serviceType: string): string {
  // Remove extra whitespace
  let cleaned = serviceType.trim();
  
  // Remove trailing punctuation
  cleaned = cleaned.replace(/[.,;:!?]+$/, '');
  
  // Capitalize first letter of each word
  cleaned = cleaned.replace(/\b\w/g, char => char.toUpperCase());
  
  // Remove duplicate spaces
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Common corrections
  const corrections: Record<string, string> = {
    'Grassinstallation': 'Grass Installation',
    'Turfinstallers': 'Turf Installers',
    'Patiobuilder': 'Patio Builder',
    'Patiobuilders': 'Patio Builders',
    'Poolbuilder': 'Pool Builder',
    'Poolbuilders': 'Pool Builders',
  };
  
  // Apply corrections (case-insensitive)
  Object.entries(corrections).forEach(([wrong, right]) => {
    const regex = new RegExp(`^${wrong}$`, 'i');
    if (regex.test(cleaned)) {
      cleaned = right;
    }
  });
  
  return cleaned;
}