import { supabase } from './supabase'

export const debugSupabase = async () => {
  console.log('🔧 Supabase Configuration Debug:')
  console.log('URL:', supabase.supabaseUrl)
  console.log('Key:', supabase.supabaseKey ? 'Present' : 'Missing')
  
  try {
    // Test connection
    const { data, error } = await supabase.auth.getSession()
    console.log('🔗 Connection test:', error ? 'Failed' : 'Success')
    if (error) console.error('Connection error:', error)
    
    // Test auth config
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log('👤 Auth test:', authError ? 'Failed' : 'Success')
    if (authError) console.error('Auth error:', authError)
    
  } catch (err) {
    console.error('❌ Debug error:', err)
  }
}

// Auto-run debug in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  debugSupabase()
} 