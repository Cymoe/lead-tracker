import { Lead } from '@/types';

export interface LeadQualityThresholds {
  lowReviews: number;
  mediumReviews: number;
  highReviews: number;
  lowRating: number;
  mediumRating: number;
  goodRating: number;
}

export const DEFAULT_THRESHOLDS: LeadQualityThresholds = {
  lowReviews: 10,
  mediumReviews: 50,
  highReviews: 100,
  lowRating: 3.5,
  mediumRating: 4.0,
  goodRating: 4.5
};

export function generateNotesFromLead(
  lead: Partial<Lead>,
  thresholds: LeadQualityThresholds = DEFAULT_THRESHOLDS
): string {
  const notes: string[] = [];
  
  // Website presence
  if (!lead.website) {
    notes.push('No website found - high priority lead');
  } else {
    notes.push('Has website');
  }
  
  // Review count analysis
  if (typeof lead.review_count === 'number') {
    if (lead.review_count === 0) {
      notes.push('No reviews - new or low online presence');
    } else if (lead.review_count < thresholds.lowReviews) {
      notes.push(`Few reviews (${lead.review_count}) - growing business opportunity`);
    } else if (lead.review_count < thresholds.mediumReviews) {
      notes.push(`Moderate reviews (${lead.review_count}) - established local presence`);
    } else if (lead.review_count < thresholds.highReviews) {
      notes.push(`Good review count (${lead.review_count}) - active online presence`);
    } else {
      notes.push(`High review count (${lead.review_count}) - well-established business`);
    }
  }
  
  // Rating analysis
  if (typeof lead.rating === 'number' && lead.rating > 0) {
    if (lead.rating < thresholds.lowRating) {
      notes.push(`Low rating (${lead.rating}⭐) - significant reputation improvement opportunity`);
    } else if (lead.rating < thresholds.mediumRating) {
      notes.push(`Medium rating (${lead.rating}⭐) - reputation enhancement potential`);
    } else if (lead.rating < thresholds.goodRating) {
      notes.push(`Good rating (${lead.rating}⭐) - solid reputation`);
    } else {
      notes.push(`Excellent rating (${lead.rating}⭐) - strong reputation`);
    }
  }
  
  // Contact information
  const contactMethods: string[] = [];
  if (lead.phone) contactMethods.push('phone');
  if (lead.email) contactMethods.push('email');
  if (lead.instagram_url) contactMethods.push('Instagram');
  if (lead.facebook_url) contactMethods.push('Facebook');
  if (lead.linkedin_url) contactMethods.push('LinkedIn');
  if (lead.twitter_url) contactMethods.push('Twitter');
  
  if (contactMethods.length > 0) {
    notes.push(`Contact available: ${contactMethods.join(', ')}`);
  } else {
    notes.push('Limited contact information');
  }
  
  // Lead source
  if (lead.lead_source && lead.lead_source !== 'Manual Entry') {
    notes.push(`Source: ${lead.lead_source}`);
  }
  
  return notes.join('. ');
}

export function calculateLeadScore(
  lead: Partial<Lead>,
  thresholds: LeadQualityThresholds = DEFAULT_THRESHOLDS
): number {
  let score = 50; // Base score
  
  // No website = high opportunity (30 points)
  if (!lead.website) {
    score += 30;
  }
  
  // Review count scoring (up to 20 points)
  if (typeof lead.review_count === 'number') {
    if (lead.review_count === 0) {
      score += 20; // No reviews = highest opportunity
    } else if (lead.review_count < thresholds.lowReviews) {
      score += 15;
    } else if (lead.review_count < thresholds.mediumReviews) {
      score += 10;
    } else if (lead.review_count < thresholds.highReviews) {
      score += 5;
    }
    // No points for high review count (lower opportunity)
  }
  
  // Rating scoring (up to 15 points)
  if (typeof lead.rating === 'number' && lead.rating > 0) {
    if (lead.rating < thresholds.lowRating) {
      score += 15; // Low rating = high opportunity
    } else if (lead.rating < thresholds.mediumRating) {
      score += 10;
    } else if (lead.rating < thresholds.goodRating) {
      score += 5;
    }
    // No points for excellent rating (lower opportunity)
  }
  
  // Contact information bonus (up to 10 points)
  let contactScore = 0;
  if (lead.email) contactScore += 5;
  if (lead.phone) contactScore += 3;
  if (lead.instagram_url || lead.facebook_url) contactScore += 2;
  score += Math.min(contactScore, 10);
  
  return Math.min(Math.max(score, 0), 100);
}

export function getQualitySignals(
  lead: Partial<Lead>,
  thresholds: LeadQualityThresholds = DEFAULT_THRESHOLDS
): string[] {
  const signals: string[] = [];
  
  // Website status
  if (!lead.website) {
    signals.push('🚨 No Website');
  }
  
  // Review count signals
  if (typeof lead.review_count === 'number') {
    if (lead.review_count === 0) {
      signals.push('🆕 No Reviews');
    } else if (lead.review_count < thresholds.lowReviews) {
      signals.push('🌱 Growing Business');
    } else if (lead.review_count >= thresholds.highReviews) {
      signals.push('🏆 Established Business');
    }
  }
  
  // Rating signals
  if (typeof lead.rating === 'number' && lead.rating > 0) {
    if (lead.rating < thresholds.lowRating) {
      signals.push('⚡ Reputation Opportunity');
    } else if (lead.rating >= thresholds.goodRating) {
      signals.push('⭐ Strong Reputation');
    }
  }
  
  // Contact availability
  if (lead.email) {
    signals.push('📧 Email Available');
  }
  if (lead.instagram_url || lead.facebook_url || lead.linkedin_url || lead.twitter_url) {
    signals.push('📱 Social Media Present');
  }
  
  return signals;
}

// Helper function to clean up inconsistent notes
export function cleanupLeadNotes(currentNotes: string | null, lead: Partial<Lead>): string {
  if (!currentNotes) {
    return generateNotesFromLead(lead);
  }
  
  let cleanedNotes = currentNotes;
  
  // Fix website inconsistency
  if (lead.website && cleanedNotes.includes('No website')) {
    cleanedNotes = cleanedNotes.replace(/No website[^.]*\.?\s*/gi, '');
  }
  
  // Fix review count inconsistency
  if (lead.review_count && lead.review_count >= 20 && cleanedNotes.includes('Few reviews')) {
    cleanedNotes = cleanedNotes.replace(/Few reviews[^.]*\.?\s*/gi, '');
  }
  
  // Fix rating inconsistency
  if (lead.rating && lead.rating >= 4.0 && cleanedNotes.includes('Low rating')) {
    cleanedNotes = cleanedNotes.replace(/Low rating[^.]*\.?\s*/gi, '');
  }
  
  // Remove [Merged from Google Maps] as it's redundant with lead_source
  cleanedNotes = cleanedNotes.replace(/\[Merged from Google Maps\]\s*/gi, '');
  
  // If notes are now empty or just whitespace, regenerate
  if (!cleanedNotes.trim()) {
    return generateNotesFromLead(lead);
  }
  
  return cleanedNotes.trim();
}