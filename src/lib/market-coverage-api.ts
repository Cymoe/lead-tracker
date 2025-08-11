import { createClient } from './supabase/client';
import { MarketCoverage, ImportMetric } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMarketSizeConfig } from '@/utils/market-size';

// Get market coverage for a specific market
export async function getMarketCoverage(
  marketId: string,
  supabase?: SupabaseClient
): Promise<MarketCoverage | null> {
  try {
    if (!supabase) {
      supabase = createClient();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('market_coverage')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching market coverage:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getMarketCoverage:', error);
    return null;
  }
}

// Get all market coverage for the current user
export async function getAllMarketCoverage(
  supabase?: SupabaseClient
): Promise<MarketCoverage[]> {
  try {
    if (!supabase) {
      supabase = createClient();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('market_coverage')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching all market coverage:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllMarketCoverage:', error);
    return [];
  }
}

// Create or update market coverage
export async function upsertMarketCoverage(
  coverage: Partial<MarketCoverage>,
  supabase?: SupabaseClient
): Promise<MarketCoverage | null> {
  try {
    if (!supabase) {
      supabase = createClient();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('market_coverage')
      .upsert({
        ...coverage,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting market coverage:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertMarketCoverage:', error);
    return null;
  }
}

// Calculate coverage percentage based on phases completed
export function calculateCoveragePercentage(coverage: MarketCoverage): number {
  // Extract city name from market_name (e.g., "Amarillo, TX" -> "Amarillo")
  const cityName = coverage.market_name.includes(',') 
    ? coverage.market_name.split(',')[0].trim()
    : coverage.market_name;
    
  // Get market size configuration
  const marketConfig = getMarketSizeConfig(cityName);
  
  // Base coverage from phases
  let percentage = 0;
  
  // Phase 1 (Google Maps) - 70% of total coverage potential
  if (coverage.phase_1_lead_count > 0) {
    // Scale based on number of service types covered relative to market size
    const serviceTypeCoverage = Math.min(
      coverage.phase_1_service_types.length / marketConfig.targetServiceTypes, 
      1
    );
    percentage += 70 * serviceTypeCoverage;
  }
  
  // Phase 2 (Facebook Ads) - 20% of total coverage potential
  if (coverage.phase_2_lead_count > 0) {
    // Scale based on number of searches (assume 3+ is good coverage)
    const searchCoverage = Math.min(coverage.phase_2_searches.length / 3, 1);
    percentage += 20 * searchCoverage;
  }
  
  // Phase 3 (Instagram) - 10% of total coverage potential
  if (coverage.phase_3_lead_count > 0) {
    // Scale based on number of handles (assume 10+ is good coverage)
    const handleCoverage = Math.min(coverage.phase_3_handles.length / 10, 1);
    percentage += 10 * handleCoverage;
  }
  
  return Math.round(percentage);
}

// Get recommended next actions for a market
export function getRecommendedActions(coverage: MarketCoverage): string[] {
  const actions: string[] = [];
  
  // Extract city name and get market configuration
  const cityName = coverage.market_name.includes(',') 
    ? coverage.market_name.split(',')[0].trim()
    : coverage.market_name;
  const marketConfig = getMarketSizeConfig(cityName);
  
  // Phase 1 recommendations
  if (coverage.phase_1_lead_count === 0) {
    actions.push('Start Phase 1: Search Google Maps for primary service types');
  } else if (coverage.phase_1_service_types.length < marketConfig.minServiceTypes) {
    actions.push(`Continue Phase 1: Search for at least ${marketConfig.minServiceTypes} service types (${marketConfig.description})`);
  } else if (coverage.phase_1_service_types.length < marketConfig.targetServiceTypes) {
    actions.push(`Continue Phase 1: Aim for ${marketConfig.targetServiceTypes} service types for optimal coverage`);
  }
  
  // Phase 2 recommendations (only if Phase 1 has minimum coverage)
  if (coverage.phase_1_service_types.length >= marketConfig.minServiceTypes && coverage.phase_2_lead_count === 0) {
    actions.push('Start Phase 2: Search Facebook Ad Library for active advertisers');
  } else if (coverage.phase_2_lead_count > 0 && coverage.phase_2_searches.length < 3) {
    actions.push('Continue Phase 2: Try additional Facebook Ad search queries');
  }
  
  // Phase 3 recommendations (only if Phase 1 & 2 have coverage)
  if (coverage.phase_1_service_types.length >= marketConfig.targetServiceTypes && 
      coverage.phase_2_lead_count > 5 && 
      coverage.phase_3_lead_count === 0) {
    actions.push('Start Phase 3: Manually search Instagram for high-value targets');
  }
  
  // Market saturation check
  if (coverage.phase_1_service_types.length >= marketConfig.maxServiceTypes) {
    actions.push('Phase 1 reaching saturation - consider moving to Phase 2 & 3');
  }
  
  // Coverage completion
  if (coverage.total_lead_count > 50 && 
      coverage.phase_1_service_types.length >= marketConfig.targetServiceTypes &&
      coverage.phase_3_lead_count > 0) {
    actions.push('Market coverage complete! Consider expanding to nearby markets');
  }
  
  return actions;
}

// Get suggested service types for a market that haven't been searched yet
export function getSuggestedServiceTypes(
  coverage: MarketCoverage,
  allServiceTypes: string[]
): string[] {
  const searchedTypes = new Set(coverage.phase_1_service_types);
  return allServiceTypes.filter(type => !searchedTypes.has(type));
}

// Mark a phase as completed
export async function markPhaseCompleted(
  marketId: string,
  phase: 1 | 2 | 3,
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    if (!supabase) {
      supabase = createClient();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: any = {};
    updateData[`phase_${phase}_completed_at`] = new Date().toISOString();

    const { error } = await supabase
      .from('market_coverage')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('market_id', marketId);

    if (error) {
      console.error('Error marking phase completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markPhaseCompleted:', error);
    return false;
  }
}

// Add Instagram handle to Phase 3
export async function addInstagramHandle(
  marketId: string,
  handle: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    if (!supabase) {
      supabase = createClient();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get current coverage
    const coverage = await getMarketCoverage(marketId, supabase);
    if (!coverage) return false;

    // Add handle if not already present
    const handles = coverage.phase_3_handles || [];
    if (!handles.includes(handle)) {
      handles.push(handle);
      
      const { error } = await supabase
        .from('market_coverage')
        .update({
          phase_3_handles: handles
        })
        .eq('user_id', user.id)
        .eq('market_id', marketId);

      if (error) {
        console.error('Error adding Instagram handle:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in addInstagramHandle:', error);
    return false;
  }
}

// Track import metrics for saturation detection
export async function trackImportMetrics(
  marketId: string,
  phase: 1 | 2 | 3,
  importId: string,
  metrics: {
    totalFound: number;
    duplicates: number;
    imported: number;
    serviceType?: string;
    searchQuery?: string;
  },
  supabase?: SupabaseClient
): Promise<boolean> {
  try {
    if (!supabase) {
      supabase = createClient();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get current coverage
    const coverage = await getMarketCoverage(marketId, supabase);
    if (!coverage) return false;

    // Create new metric
    const newMetric: ImportMetric = {
      import_id: importId,
      timestamp: new Date().toISOString(),
      total_found: metrics.totalFound,
      duplicates: metrics.duplicates,
      imported: metrics.imported,
      service_type: metrics.serviceType,
      search_query: metrics.searchQuery
    };

    // Get existing metrics for the phase
    const metricsField = `phase_${phase}_import_metrics` as keyof MarketCoverage;
    const existingMetrics = (coverage[metricsField] as ImportMetric[]) || [];
    
    // Add new metric
    const updatedMetrics = [...existingMetrics, newMetric];
    
    // Keep only the last 20 metrics per phase
    const trimmedMetrics = updatedMetrics.slice(-20);

    // Update the coverage record
    const { error } = await supabase
      .from('market_coverage')
      .update({
        [metricsField]: trimmedMetrics,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('market_id', marketId);

    if (error) {
      console.error('Error tracking import metrics:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in trackImportMetrics:', error);
    return false;
  }
}