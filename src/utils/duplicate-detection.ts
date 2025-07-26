import { Lead } from '@/types';

export interface DuplicateGroup {
  id: string;
  leads: Lead[];
  matchType: 'exact' | 'phone' | 'company' | 'instagram' | 'fuzzy';
  confidence: number;
  suggestedMaster?: Lead;
}

/**
 * Normalize phone numbers for comparison
 */
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

/**
 * Normalize company names for comparison
 */
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\b(llc|inc|corp|corporation|company|co)\b/g, '') // Remove common suffixes
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find duplicate leads based on various criteria
 */
export function findDuplicates(leads: Lead[]): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedLeadIds = new Set<string>();
  
  // Create indexes for efficient lookup
  const phoneIndex = new Map<string, Lead[]>();
  const companyIndex = new Map<string, Lead[]>();
  const instagramIndex = new Map<string, Lead[]>();
  
  // Build indexes
  leads.forEach(lead => {
    // Phone index
    const normalizedPhone = normalizePhone(lead.phone);
    if (normalizedPhone) {
      if (!phoneIndex.has(normalizedPhone)) {
        phoneIndex.set(normalizedPhone, []);
      }
      phoneIndex.get(normalizedPhone)!.push(lead);
    }
    
    // Company name index
    const normalizedCompany = normalizeCompanyName(lead.company_name);
    if (!companyIndex.has(normalizedCompany)) {
      companyIndex.set(normalizedCompany, []);
    }
    companyIndex.get(normalizedCompany)!.push(lead);
    
    // Instagram handle index
    if (lead.handle) {
      const normalizedHandle = lead.handle.toLowerCase().replace('@', '');
      if (!instagramIndex.has(normalizedHandle)) {
        instagramIndex.set(normalizedHandle, []);
      }
      instagramIndex.get(normalizedHandle)!.push(lead);
    }
  });
  
  // Find exact duplicates (same phone)
  phoneIndex.forEach((groupLeads, phone) => {
    if (groupLeads.length > 1) {
      const unprocessedLeads = groupLeads.filter(lead => !processedLeadIds.has(lead.id));
      if (unprocessedLeads.length > 1) {
        const group: DuplicateGroup = {
          id: `phone-${phone}`,
          leads: unprocessedLeads,
          matchType: 'phone',
          confidence: 0.95,
          suggestedMaster: selectMasterLead(unprocessedLeads)
        };
        duplicateGroups.push(group);
        unprocessedLeads.forEach(lead => processedLeadIds.add(lead.id));
      }
    }
  });
  
  // Find Instagram handle duplicates
  instagramIndex.forEach((groupLeads, handle) => {
    if (groupLeads.length > 1) {
      const unprocessedLeads = groupLeads.filter(lead => !processedLeadIds.has(lead.id));
      if (unprocessedLeads.length > 1) {
        const group: DuplicateGroup = {
          id: `instagram-${handle}`,
          leads: unprocessedLeads,
          matchType: 'instagram',
          confidence: 0.9,
          suggestedMaster: selectMasterLead(unprocessedLeads)
        };
        duplicateGroups.push(group);
        unprocessedLeads.forEach(lead => processedLeadIds.add(lead.id));
      }
    }
  });
  
  // Find company name duplicates (exact match after normalization)
  companyIndex.forEach((groupLeads, company) => {
    if (groupLeads.length > 1) {
      const unprocessedLeads = groupLeads.filter(lead => !processedLeadIds.has(lead.id));
      if (unprocessedLeads.length > 1) {
        const group: DuplicateGroup = {
          id: `company-${company}`,
          leads: unprocessedLeads,
          matchType: 'company',
          confidence: 0.8,
          suggestedMaster: selectMasterLead(unprocessedLeads)
        };
        duplicateGroups.push(group);
        unprocessedLeads.forEach(lead => processedLeadIds.add(lead.id));
      }
    }
  });
  
  // Find fuzzy duplicates (similar company names)
  const remainingLeads = leads.filter(lead => !processedLeadIds.has(lead.id));
  for (let i = 0; i < remainingLeads.length; i++) {
    if (processedLeadIds.has(remainingLeads[i].id)) continue;
    
    const similarLeads = [remainingLeads[i]];
    const baseCompany = normalizeCompanyName(remainingLeads[i].company_name);
    
    for (let j = i + 1; j < remainingLeads.length; j++) {
      if (processedLeadIds.has(remainingLeads[j].id)) continue;
      
      const compareCompany = normalizeCompanyName(remainingLeads[j].company_name);
      const similarity = calculateSimilarity(baseCompany, compareCompany);
      
      // Check if companies are similar enough and in the same city
      if (similarity > 0.8 && remainingLeads[i].city === remainingLeads[j].city) {
        similarLeads.push(remainingLeads[j]);
      }
    }
    
    if (similarLeads.length > 1) {
      const group: DuplicateGroup = {
        id: `fuzzy-${remainingLeads[i].id}`,
        leads: similarLeads,
        matchType: 'fuzzy',
        confidence: 0.7,
        suggestedMaster: selectMasterLead(similarLeads)
      };
      duplicateGroups.push(group);
      similarLeads.forEach(lead => processedLeadIds.add(lead.id));
    }
  }
  
  return duplicateGroups.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Select the best lead to keep from a group of duplicates
 */
function selectMasterLead(leads: Lead[]): Lead {
  // Score each lead based on data completeness and quality
  const scoredLeads = leads.map(lead => {
    let score = 0;
    
    // Prefer leads with more complete data
    if (lead.phone) score += 3;
    if (lead.website) score += 2;
    if (lead.instagram_url) score += 2;
    if (lead.handle) score += 1;
    if (lead.notes) score += 1;
    if (lead.service_type) score += 1;
    if (lead.city) score += 1;
    if (lead.running_ads) score += 1;
    if (lead.ad_copy) score += 1;
    if (lead.price_info) score += 1;
    
    // Prefer leads from certain sources
    if (lead.lead_source === 'Instagram Manual') score += 2;
    if (lead.lead_source === 'Google Maps') score += 1;
    
    // Prefer newer leads (updated more recently)
    const daysSinceUpdate = (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) score += 2;
    else if (daysSinceUpdate < 30) score += 1;
    
    return { lead, score };
  });
  
  // Sort by score descending and return the best one
  scoredLeads.sort((a, b) => b.score - a.score);
  return scoredLeads[0].lead;
}

/**
 * Merge duplicate leads into a single lead
 */
export function mergeLeads(leads: Lead[], masterId: string): Partial<Lead> {
  const master = leads.find(l => l.id === masterId);
  if (!master) throw new Error('Master lead not found');
  
  const merged: Partial<Lead> = { ...master };
  
  // Merge data from other leads, preferring non-null values
  leads.forEach(lead => {
    if (lead.id === masterId) return;
    
    // Merge simple fields - prefer non-null values
    if (!merged.phone && lead.phone) merged.phone = lead.phone;
    if (!merged.website && lead.website) merged.website = lead.website;
    if (!merged.instagram_url && lead.instagram_url) merged.instagram_url = lead.instagram_url;
    if (!merged.handle && lead.handle) merged.handle = lead.handle;
    if (!merged.service_type && lead.service_type) merged.service_type = lead.service_type;
    if (!merged.city && lead.city) merged.city = lead.city;
    if (!merged.ad_copy && lead.ad_copy) merged.ad_copy = lead.ad_copy;
    if (!merged.price_info && lead.price_info) merged.price_info = lead.price_info;
    if (!merged.service_areas && lead.service_areas) merged.service_areas = lead.service_areas;
    
    // Merge boolean fields - true takes precedence
    if (lead.running_ads) merged.running_ads = true;
    if (lead.dm_sent) merged.dm_sent = true;
    if (lead.called) merged.called = true;
    
    // Merge notes - combine if different
    if (lead.notes && lead.notes !== merged.notes) {
      merged.notes = merged.notes 
        ? `${merged.notes}\n\n--- Merged from duplicate ---\n${lead.notes}`
        : lead.notes;
    }
    
    // Keep the best score
    if (lead.score && (!merged.score || lead.score > merged.score)) {
      merged.score = lead.score;
    }
  });
  
  return merged;
}