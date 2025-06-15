import { supabase } from './supabase'

export const runAuthDiagnostics = () => {
  console.log('🔧 Running Authentication Diagnostics...')
  console.log('=' .repeat(50))
  
  // 1. Check environment variables
  console.log('📋 Environment Configuration:')
  console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Using fallback')
  console.log('- Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Using fallback')
  console.log('- Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'Server-side')
  
  // 2. Check Supabase client configuration
  console.log('\n🔧 Supabase Client Configuration:')
  console.log('- Client created:', !!supabase)
  console.log('- Auth configured:', !!supabase.auth)
  
  // 3. Expected URLs
  console.log('\n🌐 Expected URL Configuration:')
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  console.log('- App Callback URL:', `${currentOrigin}/auth/callback`)
  console.log('- Supabase Callback URL:', 'https://bshhrtukpprqetgfpwsb.supabase.co/auth/v1/callback')
  
  // 4. GitHub OAuth App Requirements
  console.log('\n⚙️ GitHub OAuth App Configuration Required:')
  console.log('- Authorization callback URL should be: https://bshhrtukpprqetgfpwsb.supabase.co/auth/v1/callback')
  console.log('- Homepage URL can be:', currentOrigin)
  
  // 5. Supabase Dashboard Requirements
  console.log('\n📊 Supabase Dashboard Configuration Required:')
  console.log('- Site URL:', currentOrigin)
  console.log('- Redirect URLs should include:', `${currentOrigin}/auth/callback`)
  console.log('- GitHub provider should be enabled with Client ID and Secret')
  
  console.log('=' .repeat(50))
  console.log('✅ Diagnostics complete. Check the configuration above.')
}

// Auto-run diagnostics
if (typeof window !== 'undefined') {
  runAuthDiagnostics()
} 