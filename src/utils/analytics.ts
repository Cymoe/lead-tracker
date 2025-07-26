import { Lead } from '@/types';

export interface LeadStats {
  total: number;
  bySource: Record<string, number>;
  byCity: Record<string, number>;
  byServiceType: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
  withPhone: number;
  withInstagram: number;
  withWebsite: number;
  runningAds: number;
  dmSent: number;
  called: number;
  conversionFunnel: {
    total: number;
    contacted: number;
    responded: number;
    converted: number;
  };
}

export interface LeadTrends {
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  topGrowthSource: string | null;
  topGrowthCity: string | null;
}

/**
 * Calculate comprehensive statistics from leads data
 */
export function calculateLeadStats(leads: Lead[]): LeadStats {
  const stats: LeadStats = {
    total: leads.length,
    bySource: {},
    byCity: {},
    byServiceType: {},
    byMonth: [],
    withPhone: 0,
    withInstagram: 0,
    withWebsite: 0,
    runningAds: 0,
    dmSent: 0,
    called: 0,
    conversionFunnel: {
      total: leads.length,
      contacted: 0,
      responded: 0,
      converted: 0,
    },
  };

  // Initialize monthly data for the last 6 months
  const monthlyData = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    monthlyData.set(monthKey, 0);
  }

  // Process each lead
  leads.forEach(lead => {
    // Count by source
    if (lead.lead_source) {
      stats.bySource[lead.lead_source] = (stats.bySource[lead.lead_source] || 0) + 1;
    }

    // Count by city
    if (lead.city) {
      stats.byCity[lead.city] = (stats.byCity[lead.city] || 0) + 1;
    }

    // Count by service type
    if (lead.service_type) {
      stats.byServiceType[lead.service_type] = (stats.byServiceType[lead.service_type] || 0) + 1;
    }

    // Count by month
    const leadDate = new Date(lead.created_at);
    const monthKey = leadDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, monthlyData.get(monthKey)! + 1);
    }

    // Count data completeness
    if (lead.phone) stats.withPhone++;
    if (lead.handle || lead.instagram_url) stats.withInstagram++;
    if (lead.website) stats.withWebsite++;

    // Count actions
    if (lead.running_ads) stats.runningAds++;
    if (lead.dm_sent) stats.dmSent++;
    if (lead.called) stats.called++;

    // Conversion funnel
    if (lead.dm_sent || lead.called) {
      stats.conversionFunnel.contacted++;
    }
    // Note: We don't have response/conversion tracking yet
    // These would need additional fields in the Lead model
  });

  // Convert monthly data to array
  stats.byMonth = Array.from(monthlyData.entries()).map(([month, count]) => ({
    month,
    count,
  }));

  return stats;
}

/**
 * Calculate growth trends from leads data
 */
export function calculateLeadTrends(leads: Lead[]): LeadTrends {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count leads by period
  const leadsToday = leads.filter(l => new Date(l.created_at) >= dayAgo).length;
  const leadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
  const leadsThisMonth = leads.filter(l => new Date(l.created_at) >= monthAgo).length;

  // Calculate growth rates
  const totalLeads = leads.length;
  const dailyGrowth = totalLeads > 0 ? (leadsToday / totalLeads) * 100 : 0;
  const weeklyGrowth = totalLeads > 0 ? (leadsThisWeek / totalLeads) * 100 : 0;
  const monthlyGrowth = totalLeads > 0 ? (leadsThisMonth / totalLeads) * 100 : 0;

  // Find top growth source this week
  const weekLeads = leads.filter(l => new Date(l.created_at) >= weekAgo);
  const sourceGrowth = new Map<string, number>();
  const cityGrowth = new Map<string, number>();

  weekLeads.forEach(lead => {
    if (lead.lead_source) {
      sourceGrowth.set(lead.lead_source, (sourceGrowth.get(lead.lead_source) || 0) + 1);
    }
    if (lead.city) {
      cityGrowth.set(lead.city, (cityGrowth.get(lead.city) || 0) + 1);
    }
  });

  const topGrowthSource = Array.from(sourceGrowth.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const topGrowthCity = Array.from(cityGrowth.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    dailyGrowth,
    weeklyGrowth,
    monthlyGrowth,
    topGrowthSource,
    topGrowthCity,
  };
}

/**
 * Get top performing items by category
 */
export function getTopPerformers(stats: LeadStats, limit: number = 5) {
  const sortByCount = (a: [string, number], b: [string, number]) => b[1] - a[1];

  return {
    topSources: Object.entries(stats.bySource)
      .sort(sortByCount)
      .slice(0, limit),
    topCities: Object.entries(stats.byCity)
      .sort(sortByCount)
      .slice(0, limit),
    topServices: Object.entries(stats.byServiceType)
      .sort(sortByCount)
      .slice(0, limit),
  };
}

/**
 * Calculate data quality score
 */
export function calculateDataQuality(stats: LeadStats): {
  score: number;
  phoneCompleteness: number;
  instagramCompleteness: number;
  websiteCompleteness: number;
} {
  const phoneCompleteness = stats.total > 0 ? (stats.withPhone / stats.total) * 100 : 0;
  const instagramCompleteness = stats.total > 0 ? (stats.withInstagram / stats.total) * 100 : 0;
  const websiteCompleteness = stats.total > 0 ? (stats.withWebsite / stats.total) * 100 : 0;

  // Average completeness as quality score
  const score = (phoneCompleteness + instagramCompleteness + websiteCompleteness) / 3;

  return {
    score,
    phoneCompleteness,
    instagramCompleteness,
    websiteCompleteness,
  };
}