export interface AdCreative {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'text';
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  headline?: string;
  primaryText?: string;
  description?: string;
  callToAction?: string;
  linkUrl?: string;
  createdAt?: string;
  lastSeen?: string;
  status?: 'active' | 'inactive' | 'paused';
  impressions?: number;
  spend?: string;
  targeting?: {
    locations?: string[];
    ageRange?: string;
    gender?: string;
    interests?: string[];
  };
  // Facebook Ad Library specific fields
  libraryId?: string;
  startedRunning?: string;
  platforms?: string[]; // Facebook, Instagram, Messenger, Audience Network
  pageInfo?: {
    name: string;
    url?: string;
    followers?: number;
  };
  disclosures?: string[]; // Paid partnership disclosures
}

export interface AdPlatformStatus {
  platform: 'Google Ads' | 'Facebook Ads' | 'Instagram Ads' | 'Nextdoor' | 'LinkedIn Ads' | 'Twitter Ads' | 'Yelp Ads' | 'Angi Ads' | 'HomeAdvisor' | 'Thumbtack';
  hasAds: boolean;
  lastChecked: string;
  adCount?: number;
  adSpend?: string;
  notes?: string;
  ads?: AdCreative[];
}

export interface Lead {
  id: string;
  user_id: string;
  handle?: string | null;
  company_name: string;
  service_type?: string | null;
  normalized_service_type?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  email2?: string | null;
  email3?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  website?: string | null;
  google_maps_url?: string | null;
  address?: string | null;
  full_address?: string | null;
  search_query?: string | null;
  rating?: number | null;
  review_count?: number | null;
  lead_source: 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | 'CSV Import' | null;
  running_ads: boolean;
  ad_start_date?: string | null;
  ad_copy?: string | null;
  ad_platform?: string | null;
  ad_platforms?: AdPlatformStatus[];
  total_ad_platforms?: number;
  notes?: string | null;
  score: 'A++' | 'A+' | 'A' | 'B' | 'C' | null;
  close_crm_id?: string | null;
  import_operation_id?: string | null;
  created_at: string;
  updated_at: string;
  // Temporary field for duplicate tracking during import
  existingId?: string;
}

export interface KeywordSession {
  active: boolean;
  keywords: string[];
  completed: string[];
  currentIndex: number;
  results: Lead[];
  totalFound: number;
  city: string;
}

export interface ServiceType {
  value: string;
  label: string;
  keywords?: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  googleScriptUrl?: string;
  openaiApiKey?: string;
  createdAt: string;
}

// Dynamic market types (no database storage - auto-detected from leads)
export interface DynamicMarket {
  id: string;
  name: string;
  type: 'all' | 'state' | 'metro' | 'city';
  state?: string;
  cities: string[];
  leadCount: number;
  parentId?: string; // For hierarchical structure
  adPercentage?: number;
  isExpanded?: boolean; // For UI state
}

export interface MarketHierarchy {
  market: DynamicMarket;
  children: MarketHierarchy[];
}

export interface MarketStats {
  marketId: string;
  marketName: string;
  totalLeads: number;
  leadsByCity: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByServiceType: Record<string, number>;
  withAds: number;
  avgScore: string;
  withPhone: number;
  withWebsite: number;
}

// Metro area definitions for auto-detection
export interface MetroAreaDefinition {
  name: string;
  state: string;
  cities: string[];
  aliases?: string[]; // Alternative names
}

// Import operation tracking for undo functionality
export interface ImportOperation {
  id: string;
  user_id: string;
  operation_type: 'bulk_import' | 'csv_import' | 'google_maps_import' | 'manual_add';
  source: 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | 'CSV Import';
  lead_count: number;
  metadata: {
    city?: string;
    service_type?: string;
    keywords?: string[];
    import_mode?: 'new' | 'update' | 'all';
    phase?: 1 | 2 | 3;
    market_id?: string;
    market_name?: string;
    parent_phase_id?: string;
    coverage_context?: {
      service_type?: string;
      search_query?: string;
    };
    [key: string]: any;
  };
  created_at: string;
  reverted_at: string | null;
  reverted_by: string | null;
}

// Market coverage tracking
export interface MarketCoverage {
  id: string;
  user_id: string;
  market_id: string;
  market_name: string;
  market_type: 'state' | 'city' | 'metro';
  
  // Phase 1: Google Maps
  phase_1_searches: string[];
  phase_1_service_types: string[];
  phase_1_import_ids: string[];
  phase_1_lead_count: number;
  phase_1_completed_at: string | null;
  phase_1_import_metrics?: ImportMetric[];
  
  // Phase 2: Facebook Ads
  phase_2_searches: string[];
  phase_2_import_ids: string[];
  phase_2_lead_count: number;
  phase_2_completed_at: string | null;
  phase_2_import_metrics?: ImportMetric[];
  
  // Phase 3: Instagram Manual
  phase_3_handles: string[];
  phase_3_import_ids: string[];
  phase_3_lead_count: number;
  phase_3_completed_at: string | null;
  phase_3_import_metrics?: ImportMetric[];
  
  // Overall metrics
  total_lead_count: number;
  coverage_percentage: number;
  
  created_at: string;
  updated_at: string;
}

// Import metrics for saturation tracking
export interface ImportMetric {
  import_id: string;
  timestamp: string;
  total_found: number;
  duplicates: number;
  imported: number;
  service_type?: string;
  search_query?: string;
}