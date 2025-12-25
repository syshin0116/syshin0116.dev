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
      projects_timeline: {
        Row: {
          id: string
          title: string
          period: string
          year: number
          period_type: 'Q' | 'H'
          period_number: number
          is_completed: boolean
          description: string
          tags: string[]
          category: 'company' | 'personal'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          period: string
          year: number
          period_type: 'Q' | 'H'
          period_number: number
          is_completed?: boolean
          description: string
          tags: string[]
          category: 'company' | 'personal'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          period?: string
          year?: number
          period_type?: 'Q' | 'H'
          period_number?: number
          is_completed?: boolean
          description?: string
          tags?: string[]
          category?: 'company' | 'personal'
          updated_at?: string
        }
      }
      projects_detail: {
        Row: {
          id: string
          title: string
          subtitle: string
          period: string
          duration: string
          role: string
          team: string
          description: string
          tech_stack: Json
          achievements: Json
          key_features: Json
          key_responsibilities: Json
          business_goals: Json
          architecture_evolution: Json
          challenges: Json
          learnings: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          subtitle: string
          period: string
          duration: string
          role: string
          team: string
          description: string
          tech_stack: Json
          achievements?: Json
          key_features?: Json
          key_responsibilities?: Json
          business_goals?: Json
          architecture_evolution?: Json
          challenges?: Json
          learnings?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string
          period?: string
          duration?: string
          role?: string
          team?: string
          description?: string
          tech_stack?: Json
          achievements?: Json
          key_features?: Json
          key_responsibilities?: Json
          business_goals?: Json
          architecture_evolution?: Json
          challenges?: Json
          learnings?: string[]
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          year: number
          period_type: 'Q' | 'H'
          period_number: number
          is_checked: boolean
          events: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: number
          period_type: 'Q' | 'H'
          period_number: number
          is_checked?: boolean
          events: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number
          period_type?: 'Q' | 'H'
          period_number?: number
          is_checked?: boolean
          events?: Json
          updated_at?: string
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
      period_type: 'Q' | 'H'
      project_category: 'company' | 'personal'
    }
  }
}
