'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from 'app/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    console.log('🔄 Auth callback component mounted')
    console.log('🌐 Current URL:', window.location.href)
    
    // Check for errors in URL first
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    const errorCode = urlParams.get('error_code')
    
    if (error) {
      console.error('❌ OAuth error from URL:', { error, errorDescription, errorCode })
      
      // Handle specific error types
      if (error === 'server_error' && errorCode === 'unexpected_failure') {
        setStatus('GitHub authentication failed. Please try again.')
        setTimeout(() => {
          router.push('/signin?error=github_server_error')
        }, 2000)
      } else {
        setStatus('Authentication failed')
        router.push(`/signin?error=${error}`)
      }
      return
    }

    setStatus('Waiting for authentication...')

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in successfully!')
        setStatus('Authentication successful! Checking profile...')
        
        // Check if user has completed onboarding
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.error('❌ Profile check error:', error)
          setStatus('Profile check failed')
          return
        }
        
        // Small delay to show success message
        setTimeout(() => {
          if (profile?.onboarding_completed) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        }, 1000)
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ User signed out')
        setStatus('Authentication failed')
        router.push('/signin?error=signed_out')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed')
        if (session) {
          // Check onboarding status for token refresh too
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single()
          
          if (profile?.onboarding_completed) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        }
      }
    })

    // Also check current session immediately
    const checkCurrentSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session check error:', error)
        setStatus('Session check failed')
        return
      }
      
      if (session) {
        console.log('✅ Existing session found!')
        setStatus('Authentication successful! Checking profile...')
        
        // Check if user has completed onboarding
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('❌ Profile check error:', profileError)
          setStatus('Profile check failed')
          return
        }
        
        setTimeout(() => {
          if (profile?.onboarding_completed) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        }, 1000)
      } else {
        console.log('⏳ No session yet, waiting for auth state change...')
        setStatus('Completing authentication...')
      }
    }

    checkCurrentSession()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* DevRecruit Logo */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '900',
            color: 'white',
            margin: '0 0 12px 0',
            letterSpacing: '-1px'
          }}>
            devrecruit
          </h1>
          <div style={{
            width: '64px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.3)',
            margin: '0 auto',
            borderRadius: '2px'
          }}></div>
        </div>

        {/* Loading Spinner */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '64px',
            height: '64px',
            border: '4px solid transparent',
            borderTop: '4px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite reverse'
          }}></div>
        </div>

        {/* Status Message */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            lineHeight: '1.4'
          }}>
            {status}
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            margin: '0',
            lineHeight: '1.4'
          }}>
            Please wait while we complete your sign-in...
          </p>
        </div>

        {/* Progress Dots */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.2s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.4s'
          }}></div>
        </div>

        {/* Subtle Background Patterns */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          opacity: '0.1',
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '128px',
            height: '128px',
            background: 'white',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '96px',
            height: '96px',
            background: 'white',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
} 