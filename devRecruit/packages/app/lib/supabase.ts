import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bshhrtukpprqetgfpwsb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaGhydHVrcHBycWV0Z2Zwd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTY2NTQsImV4cCI6MjA2NTUzMjY1NH0.50cZgfDXarPYKahxFY_CwD1KslRvfZP68DPU5NwEmUA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure for cross-platform compatibility
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          github_username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          updated_at?: string
        }
      }
    }
  }
} 