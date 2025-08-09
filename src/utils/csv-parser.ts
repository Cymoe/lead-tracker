import { Lead } from '@/types';

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  success: boolean;
  error?: string;
}

export interface FieldMapping {
  csvField: string;
  leadField: keyof Lead;
  transform?: (value: string) => any;
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string): CSVParseResult {
  try {
    // Handle different line endings
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    
    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    if (nonEmptyLines.length === 0) {
      return {
        headers: [],
        rows: [],
        success: false,
        error: 'CSV file is empty'
      };
    }

    // Parse headers
    const headers = parseCSVLine(nonEmptyLines[0]);
    
    // Parse rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < nonEmptyLines.length; i++) {
      const values = parseCSVLine(nonEmptyLines[i]);
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return {
      headers,
      rows,
      success: true
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV'
    };
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

/**
 * Common field mappings for different CSV formats
 */
export const commonFieldMappings: FieldMapping[] = [
  // Company/Name mappings
  { csvField: 'Company', leadField: 'company_name' },
  { csvField: 'Company Name', leadField: 'company_name' },
  { csvField: 'Business Name', leadField: 'company_name' },
  { csvField: 'Name', leadField: 'company_name' },
  
  // Phone mappings
  { csvField: 'Phone', leadField: 'phone' },
  { csvField: 'Phone Number', leadField: 'phone' },
  { csvField: 'Mobile', leadField: 'phone' },
  
  // Location mappings
  { csvField: 'City', leadField: 'city' },
  { csvField: 'Location', leadField: 'city' },
  { csvField: 'State', leadField: 'state' },
  { csvField: 'Address', leadField: 'address' },
  { csvField: 'Full Address', leadField: 'full_address' },
  { csvField: 'full_address', leadField: 'full_address' },
  
  // Service/Category mappings
  { csvField: 'Service', leadField: 'service_type' },
  { csvField: 'Service Type', leadField: 'service_type' },
  { csvField: 'Category', leadField: 'service_type' },
  
  // Website mappings
  { csvField: 'Website', leadField: 'website' },
  { csvField: 'URL', leadField: 'website' },
  { csvField: 'Site', leadField: 'website' },
  
  // Email mappings
  { csvField: 'Email', leadField: 'email' },
  { csvField: 'Email Address', leadField: 'email' },
  { csvField: 'email_1', leadField: 'email' },
  { csvField: 'email_2', leadField: 'email2' },
  { csvField: 'email_3', leadField: 'email3' },
  
  // Social media mappings
  { csvField: 'Instagram', leadField: 'instagram_url' },
  { csvField: 'Instagram Handle', leadField: 'handle' },
  { csvField: 'IG Handle', leadField: 'handle' },
  { csvField: 'Facebook', leadField: 'facebook_url' },
  { csvField: 'FB', leadField: 'facebook_url' },
  { csvField: 'LinkedIn', leadField: 'linkedin_url' },
  { csvField: 'Linkedin', leadField: 'linkedin_url' },
  { csvField: 'Twitter', leadField: 'twitter_url' },
  { csvField: 'X', leadField: 'twitter_url' },
  
  // Search query mapping
  { csvField: 'Query', leadField: 'search_query' },
  { csvField: 'Search Query', leadField: 'search_query' },
  { csvField: 'Keywords', leadField: 'search_query' },
  
  // Notes mappings
  { csvField: 'Notes', leadField: 'notes' },
  { csvField: 'Comments', leadField: 'notes' },
  { csvField: 'Description', leadField: 'notes' },
  
  // CloseCRM specific mappings
  { csvField: 'lead_name', leadField: 'company_name' },
  { csvField: 'primary_phone', leadField: 'phone' },
  { csvField: 'company_website', leadField: 'website' },
  { csvField: 'custom.cf_service_type', leadField: 'service_type' },
  { csvField: 'custom.cf_city', leadField: 'city' },
  { csvField: 'custom.cf_instagram_handle', leadField: 'handle' },
  { csvField: 'description', leadField: 'notes' },
  
  // Google Maps specific mappings
  { csvField: 'Title', leadField: 'company_name' },
  { csvField: 'Phone', leadField: 'phone' },
  { csvField: 'Website', leadField: 'website' },
  { csvField: 'Address', leadField: 'city' }, // Will need to extract city from address
  { csvField: 'Category', leadField: 'service_type' },
];

/**
 * Auto-detect field mappings based on headers
 */
export function autoDetectMappings(headers: string[]): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Try all common mappings
  commonFieldMappings.forEach(mapping => {
    const csvFieldLower = mapping.csvField.toLowerCase();
    const matchIndex = normalizedHeaders.findIndex(h => 
      h === csvFieldLower || 
      h.includes(csvFieldLower) || 
      csvFieldLower.includes(h)
    );
    
    if (matchIndex !== -1 && !mappings.some(m => m.leadField === mapping.leadField)) {
      mappings.push({
        ...mapping,
        csvField: headers[matchIndex] // Use original header
      });
    }
  });
  
  return mappings;
}

/**
 * Transform CSV rows to leads based on field mappings
 */
export function transformToLeads(
  rows: Record<string, string>[],
  mappings: FieldMapping[],
  defaults: Partial<Lead> = {}
): Partial<Lead>[] {
  return rows.map(row => {
    const lead: Partial<Lead> = { ...defaults };
    
    mappings.forEach(mapping => {
      const value = row[mapping.csvField];
      if (value && value.trim()) {
        if (mapping.transform) {
          (lead as any)[mapping.leadField] = mapping.transform(value);
        } else {
          // Apply default transformations based on field type
          switch (mapping.leadField) {
            case 'phone':
              (lead as any)[mapping.leadField] = normalizePhone(value);
              break;
            case 'handle':
              (lead as any)[mapping.leadField] = normalizeInstagramHandle(value);
              break;
            case 'website':
              (lead as any)[mapping.leadField] = normalizeWebsite(value);
              break;
            case 'instagram_url':
            case 'facebook_url':
            case 'linkedin_url':
            case 'twitter_url':
              (lead as any)[mapping.leadField] = normalizeSocialUrl(value, mapping.leadField);
              break;
            case 'running_ads':
              (lead as any)[mapping.leadField] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
              break;
            default:
              (lead as any)[mapping.leadField] = value.trim();
          }
        }
      }
    });
    
    // Set Instagram URL if handle is provided
    if (lead.handle && !lead.instagram_url) {
      lead.instagram_url = `https://www.instagram.com/${lead.handle.replace('@', '')}`;
    }
    
    // If full_address is provided but not individual city/state, try to parse
    if (lead.full_address && (!lead.city || !lead.state)) {
      const addressParts = parseAddress(lead.full_address);
      if (!lead.city && addressParts.city) lead.city = addressParts.city;
      if (!lead.state && addressParts.state) lead.state = addressParts.state;
    }
    
    // Add CSV import note
    const importDate = new Date().toLocaleDateString();
    const csvNote = `📊 Imported from CSV on ${importDate}`;
    const searchQuery = lead.search_query ? `\n🔍 Search: ${lead.search_query}` : '';
    const importNote = `${csvNote}${searchQuery}`;
    
    if (lead.notes) {
      lead.notes = `${importNote}\n\n${lead.notes}`;
    } else {
      lead.notes = importNote;
    }
    
    return lead;
  });
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return original if not standard format
  return phone.trim();
}

/**
 * Normalize Instagram handle
 */
function normalizeInstagramHandle(handle: string): string {
  let normalized = handle.trim();
  
  // Remove @ if present
  if (normalized.startsWith('@')) {
    normalized = normalized.slice(1);
  }
  
  // Extract handle from URL if provided
  const instagramUrlMatch = normalized.match(/instagram\.com\/([^\/\?]+)/);
  if (instagramUrlMatch) {
    normalized = instagramUrlMatch[1];
  }
  
  return normalized ? `@${normalized}` : '';
}

/**
 * Normalize website URL
 */
function normalizeWebsite(website: string): string {
  let normalized = website.trim();
  
  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Remove www. if present
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
}

// Add this function to ensure URLs have protocols when displayed
export function ensureProtocol(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // Check if it already has a protocol
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }
  
  // Add https:// by default
  return `https://${trimmed}`;
}

/**
 * Normalize social media URLs
 */
function normalizeSocialUrl(url: string, fieldName: string): string {
  if (!url || !url.trim()) return '';
  
  let normalized = url.trim();
  
  // If it's just a username/handle, convert to full URL
  if (!normalized.includes('://')) {
    const username = normalized.replace('@', '');
    
    switch (fieldName) {
      case 'instagram_url':
        return `https://www.instagram.com/${username}`;
      case 'facebook_url':
        return `https://www.facebook.com/${username}`;
      case 'linkedin_url':
        return normalized.includes('/company/') 
          ? `https://www.linkedin.com${normalized}`
          : `https://www.linkedin.com/company/${username}`;
      case 'twitter_url':
        return `https://twitter.com/${username}`;
      default:
        return normalized;
    }
  }
  
  // Already a URL, just ensure it has protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return `https://${normalized}`;
  }
  
  return normalized;
}

/**
 * Parse address into components
 */
function parseAddress(fullAddress: string): { city?: string; state?: string } {
  // Simple parser - looks for "City, State" pattern
  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    // Assume second-to-last is city, last is state (with possible zip)
    const city = parts[parts.length - 2];
    const stateZip = parts[parts.length - 1];
    
    // Extract state abbreviation (first 2 uppercase letters)
    const stateMatch = stateZip.match(/\b[A-Z]{2}\b/);
    const state = stateMatch ? stateMatch[0] : undefined;
    
    return { city, state };
  }
  
  return {};
}

/**
 * Validate that required fields are present
 */
export function validateLeads(leads: Partial<Lead>[]): {
  valid: Lead[];
  invalid: Array<{ lead: Partial<Lead>; reason: string }>;
} {
  const valid: Lead[] = [];
  const invalid: Array<{ lead: Partial<Lead>; reason: string }> = [];
  
  leads.forEach(lead => {
    if (!lead.company_name || !lead.company_name.trim()) {
      invalid.push({ lead, reason: 'Missing company name' });
    } else {
      // Set defaults for required fields
      valid.push({
        ...lead,
        id: lead.id || crypto.randomUUID(),
        user_id: lead.user_id || '', // Will be set by the API
        company_name: lead.company_name,
        lead_source: lead.lead_source || 'CSV Import', // Default to CSV Import for CSV uploaded leads
        running_ads: lead.running_ads ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Lead);
    }
  });
  
  return { valid, invalid };
}