import { supabase } from './supabase'

// Test Supabase connection and GitHub provider
export const testSupabaseConnection = async () => {
  console.log('🧪 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    console.log('📊 Current session:', data)
    
    if (error) {
      console.error('❌ Session error:', error)
    } else {
      console.log('✅ Supabase connection successful')
    }
    
    // Test GitHub provider availability
    console.log('🔍 Testing GitHub OAuth provider...')
    
    // This will show us what providers are available
    const testUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:3000/auth/callback'
    
    console.log('🔗 Test redirect URL:', testUrl)
    
    // Try to get the OAuth URL without actually redirecting
    try {
      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: testUrl,
          skipBrowserRedirect: true, // This prevents actual redirect
        },
      })
      
      if (oauthError) {
        console.error('❌ GitHub OAuth test error:', oauthError)
      } else {
        console.log('✅ GitHub OAuth provider available:', oauthData)
      }
    } catch (oauthErr) {
      console.error('❌ GitHub OAuth test exception:', oauthErr)
    }
    
  } catch (err) {
    console.error('❌ Supabase test failed:', err)
  }
}

// Auto-run test when imported
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-running Supabase tests...')
  testSupabaseConnection()
} 