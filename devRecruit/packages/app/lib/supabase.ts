import { createClient } from '@supabase/supabase-js'

// Function to get environment variables with better error handling
function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing environment variable: ${name}`)
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
    throw new Error(`Missing ${name}. Please set ${name} in your environment variables.`)
  }
  return value
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Environment check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL in your environment variables.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment variables.')
}

console.log('✅ Supabase configuration loaded successfully')

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
          email: string | null
          avatar_url: string | null
          about_me: string | null
          age: number | null
          education_status: string | null
          coding_languages: string[] | null
          github_username: string | null
          github_repository_count: number | null
          github_commit_count: number | null
          onboarding_completed: boolean | null
          account_status: string | null
          privacy_settings: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          about_me?: string | null
          age?: number | null
          education_status?: string | null
          coding_languages?: string[] | null
          github_username?: string | null
          github_repository_count?: number | null
          github_commit_count?: number | null
          onboarding_completed?: boolean | null
          account_status?: string | null
          privacy_settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          about_me?: string | null
          age?: number | null
          education_status?: string | null
          coding_languages?: string[] | null
          github_username?: string | null
          github_repository_count?: number | null
          github_commit_count?: number | null
          onboarding_completed?: boolean | null
          account_status?: string | null
          privacy_settings?: Record<string, any> | null
          updated_at?: string
        }
      }
    }
  }
} 