export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      jobs: {
        Row: {
          address: string
          category: string
          chosen_tier: string | null
          created_at: string
          customer_id: string
          diagnosis: string | null
          eta_minutes: number | null
          estimated_completion: string
          id: string
          media_path: string | null
          media_type: string | null
          parts_checked: boolean
          parts_in_stock: boolean
          place_tag: string
          price_a1: number | null
          price_a2: number | null
          price_a3: number | null
          status: string
          tech_lat: number | null
          tech_lng: number | null
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          category: string
          chosen_tier?: string | null
          created_at?: string
          customer_id: string
          diagnosis?: string | null
          eta_minutes?: number | null
          estimated_completion?: string
          id?: string
          media_path?: string | null
          media_type?: string | null
          parts_checked?: boolean
          parts_in_stock?: boolean
          place_tag: string
          price_a1?: number | null
          price_a2?: number | null
          price_a3?: number | null
          status?: string
          tech_lat?: number | null
          tech_lng?: number | null
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string
          chosen_tier?: string | null
          created_at?: string
          customer_id?: string
          diagnosis?: string | null
          eta_minutes?: number | null
          estimated_completion?: string
          id?: string
          media_path?: string | null
          media_type?: string | null
          parts_checked?: boolean
          parts_in_stock?: boolean
          place_tag?: string
          price_a1?: number | null
          price_a2?: number | null
          price_a3?: number | null
          status?: string
          tech_lat?: number | null
          tech_lng?: number | null
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_technician_id_fkey'
            columns: ['technician_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_technician: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type JobRow = Database['public']['Tables']['jobs']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
