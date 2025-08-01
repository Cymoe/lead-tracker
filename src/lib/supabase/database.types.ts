export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string | null
          full_name: string | null
          company_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          avatar_url?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          user_id: string
          handle: string | null
          company_name: string
          service_type: string | null
          city: string | null
          state: string | null
          phone: string | null
          email: string | null
          email2: string | null
          email3: string | null
          instagram_url: string | null
          facebook_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          website: string | null
          google_maps_url: string | null
          address: string | null
          full_address: string | null
          search_query: string | null
          rating: number | null
          review_count: number | null
          lead_source: 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | null
          running_ads: boolean
          ad_start_date: string | null
          ad_copy: string | null
          ad_call_to_action: string | null
          service_areas: string | null
          price_info: string | null
          ad_platform: string | null
          dm_sent: boolean
          dm_response: string | null
          called: boolean
          call_result: string | null
          follow_up_date: string | null
          notes: string | null
          score: 'A++' | 'A+' | 'A' | 'B' | 'C' | null
          close_crm_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          handle?: string | null
          company_name: string
          service_type?: string | null
          city?: string | null
          state?: string | null
          phone?: string | null
          email?: string | null
          email2?: string | null
          email3?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website?: string | null
          google_maps_url?: string | null
          address?: string | null
          full_address?: string | null
          search_query?: string | null
          rating?: number | null
          review_count?: number | null
          lead_source?: 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | null
          running_ads?: boolean
          ad_start_date?: string | null
          ad_copy?: string | null
          ad_call_to_action?: string | null
          service_areas?: string | null
          price_info?: string | null
          ad_platform?: string | null
          dm_sent?: boolean
          dm_response?: string | null
          called?: boolean
          call_result?: string | null
          follow_up_date?: string | null
          notes?: string | null
          score?: 'A++' | 'A+' | 'A' | 'B' | 'C' | null
          close_crm_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          handle?: string | null
          company_name?: string
          service_type?: string | null
          city?: string | null
          state?: string | null
          phone?: string | null
          email?: string | null
          email2?: string | null
          email3?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website?: string | null
          google_maps_url?: string | null
          address?: string | null
          full_address?: string | null
          search_query?: string | null
          rating?: number | null
          review_count?: number | null
          lead_source?: 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | null
          running_ads?: boolean
          ad_start_date?: string | null
          ad_copy?: string | null
          ad_call_to_action?: string | null
          service_areas?: string | null
          price_info?: string | null
          ad_platform?: string | null
          dm_sent?: boolean
          dm_response?: string | null
          called?: boolean
          call_result?: string | null
          follow_up_date?: string | null
          notes?: string | null
          score?: 'A++' | 'A+' | 'A' | 'B' | 'C' | null
          close_crm_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sheets: {
        Row: {
          id: string
          user_id: string
          google_sheet_id: string
          google_script_url: string
          sheet_name: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          google_sheet_id: string
          google_script_url: string
          sheet_name: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          google_sheet_id?: string
          google_script_url?: string
          sheet_name?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      apify_search_results: {
        Row: {
          id: string
          user_id: string
          search_type: 'google_maps' | 'facebook_ads'
          search_params: Json
          results: Json
          result_count: number
          search_mode: string | null
          cost_estimate: Json | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          search_type: 'google_maps' | 'facebook_ads'
          search_params: Json
          results: Json
          result_count: number
          search_mode?: string | null
          cost_estimate?: Json | null
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          search_type?: 'google_maps' | 'facebook_ads'
          search_params?: Json
          results?: Json
          result_count?: number
          search_mode?: string | null
          cost_estimate?: Json | null
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}