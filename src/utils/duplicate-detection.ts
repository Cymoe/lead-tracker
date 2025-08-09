import { Lead } from '@/types';

// Common business suffixes and words to remove for normalization
const BUSINESS_SUFFIXES = [
  'llc', 'inc', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited',
  'group', 'services', 'service', 'solutions', 'solution', 'systems',
  'enterprises', 'enterprise', 'partners', 'partner', 'associates',
  'az', 'arizona', 'phoenix az', 'phx', 'valley', 'southwest', 'sw'
];

// Normalize company name by removing common suffixes and cleaning up
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  
  let normalized = name.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
  
  // Remove common suffixes
  BUSINESS_SUFFIXES.forEach(suffix => {
    const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });
  
  return normalized.trim();
}

// Calculate similarity between two strings (0-1)
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Calculate distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
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
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return maxLen === 0 ? 1 : 1 - (distance / maxLen);
}

// Check if two company names are similar enough to be duplicates
export function areCompaniesSimilar(
  company1: string, 
  company2: string, 
  threshold: number = 0.8
): boolean {
  const norm1 = normalizeCompanyName(company1);
  const norm2 = normalizeCompanyName(company2);
  
  // Check if one is a substring of the other (after normalization)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }
  
  // Calculate similarity
  const similarity = calculateSimilarity(norm1, norm2);
  return similarity >= threshold;
}

// Find duplicate lead in existing leads
export function findDuplicateLead(
  newLead: Partial<Lead>, 
  existingLeads: Lead[],
  options: {
    checkCity?: boolean;
    similarityThreshold?: number;
  } = {}
): Lead | undefined {
  const { checkCity = true, similarityThreshold = 0.8 } = options;
  
  return existingLeads.find(existing => {
    // First check if company names are similar
    if (!areCompaniesSimilar(
      newLead.company_name || '', 
      existing.company_name, 
      similarityThreshold
    )) {
      return false;
    }
    
    // If checking city, ensure they match
    if (checkCity && newLead.city && existing.city) {
      const city1 = newLead.city.toLowerCase().trim();
      const city2 = existing.city.toLowerCase().trim();
      if (city1 !== city2) {
        return false;
      }
    }
    
    return true;
  });
}

// Batch duplicate detection for multiple leads
export function detectDuplicates(
  newLeads: Partial<Lead>[], 
  existingLeads: Lead[],
  options: {
    checkCity?: boolean;
    similarityThreshold?: number;
  } = {}
): {
  unique: Partial<Lead>[];
  duplicates: Array<{ lead: Partial<Lead>; existing: Lead }>;
} {
  const unique: Partial<Lead>[] = [];
  const duplicates: Array<{ lead: Partial<Lead>; existing: Lead }> = [];
  const processedInBatch = new Set<string>();
  
  newLeads.forEach(lead => {
    const leadKey = `${lead.company_name?.toLowerCase()}_${lead.city?.toLowerCase()}`;
    
    // Check if already processed in this batch
    if (processedInBatch.has(leadKey)) {
      return;
    }
    
    // Check against existing leads
    const existingDupe = findDuplicateLead(lead, existingLeads, options);
    if (existingDupe) {
      duplicates.push({ lead, existing: existingDupe });
    } else {
      // Check against already processed unique leads in this batch
      const batchDupe = findDuplicateLead(lead, unique as Lead[], options);
      if (!batchDupe) {
        unique.push(lead);
        processedInBatch.add(leadKey);
      }
    }
  });
  
  return { unique, duplicates };
}

// Types for duplicate detection modal
export interface DuplicateGroup {
  id: string;
  leads: Lead[];
  similarityScore: number;
  suggestedMaster?: Lead;
  matchType?: 'exact' | 'similar' | 'potential';
  confidence: number;
}

// Find duplicate groups across all leads - Optimized O(n) version
export function findDuplicates(leads: Lead[]): DuplicateGroup[] {
  console.log(`Starting duplicate detection for ${leads.length} leads...`);
  const startTime = Date.now();
  
  const groups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();
  
  // Build hash maps for O(1) lookups
  const phoneMap = new Map<string, Lead[]>();
  const handleMap = new Map<string, Lead[]>();
  const companyLocationMap = new Map<string, Lead[]>();
  
  // Normalize phone numbers for comparison
  const normalizePhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, ''); // Remove all non-digits
  };
  
  // First pass: Build lookup maps
  console.log('Building lookup maps...');
  leads.forEach(lead => {
    // Phone map
    if (lead.phone) {
      const normalizedPhone = normalizePhone(lead.phone);
      if (normalizedPhone) {
        if (!phoneMap.has(normalizedPhone)) {
          phoneMap.set(normalizedPhone, []);
        }
        phoneMap.get(normalizedPhone)!.push(lead);
      }
    }
    
    // Instagram handle map
    if (lead.handle) {
      const lowerHandle = lead.handle.toLowerCase();
      if (!handleMap.has(lowerHandle)) {
        handleMap.set(lowerHandle, []);
      }
      handleMap.get(lowerHandle)!.push(lead);
    }
    
    // Company + location map
    if (lead.company_name && lead.city) {
      const key = `${normalizeCompanyName(lead.company_name)}|${lead.city.toLowerCase()}`;
      if (!companyLocationMap.has(key)) {
        companyLocationMap.set(key, []);
      }
      companyLocationMap.get(key)!.push(lead);
    }
  });
  
  console.log(`Maps built. Found ${phoneMap.size} unique phones, ${handleMap.size} unique handles, ${companyLocationMap.size} unique company+city combos`);
  
  // Process phone duplicates
  phoneMap.forEach((duplicateLeads, phone) => {
    if (duplicateLeads.length > 1) {
      const unprocessedDupes = duplicateLeads.filter(lead => !processedIds.has(lead.id));
      if (unprocessedDupes.length > 1) {
        unprocessedDupes.forEach(lead => processedIds.add(lead.id));
        
        // Find best master
        const suggestedMaster = findBestMaster(unprocessedDupes);
        
        groups.push({
          id: `group-${groups.length + 1}`,
          leads: unprocessedDupes,
          similarityScore: 0.95,
          suggestedMaster,
          matchType: 'exact',
          confidence: 0.95
        });
      }
    }
  });
  
  // Process Instagram handle duplicates
  handleMap.forEach((duplicateLeads, handle) => {
    if (duplicateLeads.length > 1) {
      const unprocessedDupes = duplicateLeads.filter(lead => !processedIds.has(lead.id));
      if (unprocessedDupes.length > 1) {
        unprocessedDupes.forEach(lead => processedIds.add(lead.id));
        
        const suggestedMaster = findBestMaster(unprocessedDupes);
        
        groups.push({
          id: `group-${groups.length + 1}`,
          leads: unprocessedDupes,
          similarityScore: 0.95,
          suggestedMaster,
          matchType: 'exact',
          confidence: 0.95
        });
      }
    }
  });
  
  // Process company + location duplicates
  companyLocationMap.forEach((duplicateLeads, key) => {
    if (duplicateLeads.length > 1) {
      const unprocessedDupes = duplicateLeads.filter(lead => !processedIds.has(lead.id));
      if (unprocessedDupes.length > 1) {
        unprocessedDupes.forEach(lead => processedIds.add(lead.id));
        
        const suggestedMaster = findBestMaster(unprocessedDupes);
        
        groups.push({
          id: `group-${groups.length + 1}`,
          leads: unprocessedDupes,
          similarityScore: 0.9,
          suggestedMaster,
          matchType: 'similar',
          confidence: 0.9
        });
      }
    }
  });
  
  const endTime = Date.now();
  console.log(`Duplicate detection completed in ${endTime - startTime}ms. Found ${groups.length} duplicate groups.`);
  
  return groups;
}

// Helper function to find the best master lead
function findBestMaster(leads: Lead[]): Lead {
  return leads.reduce((best, current) => {
    let bestScore = 0;
    let currentScore = 0;
    
    // Score based on data completeness
    if (best.phone) bestScore++;
    if (best.email) bestScore++;
    if (best.website) bestScore++;
    if (best.address) bestScore++;
    if (best.running_ads) bestScore += 2;
    if (best.rating) bestScore++;
    if (best.lead_source === 'CSV Import') bestScore--; // Prefer original sources
    
    if (current.phone) currentScore++;
    if (current.email) currentScore++;
    if (current.website) currentScore++;
    if (current.address) currentScore++;
    if (current.running_ads) currentScore += 2;
    if (current.rating) currentScore++;
    if (current.lead_source === 'CSV Import') currentScore--; // Prefer original sources
    
    return currentScore > bestScore ? current : best;
  });
}

// Merge duplicate leads into a single lead
export function mergeLeads(leads: Lead[], masterId: string): Partial<Lead> {
  const masterLead = leads.find(l => l.id === masterId);
  if (!masterLead) {
    throw new Error('Master lead not found');
  }
  
  // Start with master lead data
  const merged: Partial<Lead> = { ...masterLead };
  
  // Merge data from other leads, preferring non-empty values
  leads.forEach(lead => {
    if (lead.id === masterId) return;
    
    // Basic fields - keep master unless it's empty
    if (!merged.phone && lead.phone) merged.phone = lead.phone;
    if (!merged.email && lead.email) merged.email = lead.email;
    if (!merged.website && lead.website) merged.website = lead.website;
    if (!merged.address && lead.address) merged.address = lead.address;
    if (!merged.full_address && lead.full_address) merged.full_address = lead.full_address;
    if (!merged.handle && lead.handle) merged.handle = lead.handle;
    
    // Location data
    if (!merged.city && lead.city) merged.city = lead.city;
    if (!merged.state && lead.state) merged.state = lead.state;
    
    // Business data
    if (!merged.service_type && lead.service_type) merged.service_type = lead.service_type;
    if (!merged.rating && lead.rating) merged.rating = lead.rating;
    if (!merged.review_count && lead.review_count) merged.review_count = lead.review_count;
    
    // URLs
    if (!merged.google_maps_url && lead.google_maps_url) merged.google_maps_url = lead.google_maps_url;
    if (!merged.facebook_url && lead.facebook_url) merged.facebook_url = lead.facebook_url;
    if (!merged.instagram_url && lead.instagram_url) merged.instagram_url = lead.instagram_url;
    
    // Ad data - merge if any lead has ads
    if (lead.running_ads) merged.running_ads = true;
    if (lead.ad_platforms && lead.ad_platforms.length > 0) {
      if (!merged.ad_platforms) merged.ad_platforms = [];
      // Merge ad platforms avoiding duplicates
      lead.ad_platforms.forEach(platform => {
        if (!merged.ad_platforms!.some(p => p.platform === platform.platform)) {
          merged.ad_platforms!.push(platform);
        }
      });
    }
    
    // Merge notes
    if (lead.notes) {
      if (merged.notes) {
        merged.notes = `${merged.notes}\n---\n${lead.notes}`;
      } else {
        merged.notes = lead.notes;
      }
    }
  });
  
  // Update merge metadata
  merged.updated_at = new Date().toISOString();
  
  return merged;
}