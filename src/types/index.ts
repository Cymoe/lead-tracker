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
  city?: string | null;
  phone?: string | null;
  instagram_url?: string | null;
  website?: string | null;
  lead_source: 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | null;
  running_ads: boolean;
  ad_start_date?: string | null;
  ad_copy?: string | null;
  ad_call_to_action?: string | null;
  service_areas?: string | null;
  price_info?: string | null;
  ad_platform?: string | null;
  ad_platforms?: AdPlatformStatus[];
  total_ad_platforms?: number;
  dm_sent: boolean;
  dm_response?: string | null;
  called: boolean;
  call_result?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  score: 'A++' | 'A+' | 'A' | 'B' | 'C' | null;
  close_crm_id?: string | null;
  created_at: string;
  updated_at: string;
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