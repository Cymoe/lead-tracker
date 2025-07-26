export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          phone: string | null
          instagram_url: string | null
          website: string | null
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
          phone?: string | null
          instagram_url?: string | null
          website?: string | null
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
          phone?: string | null
          instagram_url?: string | null
          website?: string | null
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