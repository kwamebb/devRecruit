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
        setStatus('Authentication successful! Redirecting...')
        
        // Small delay to show success message
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ User signed out')
        setStatus('Authentication failed')
        router.push('/signin?error=signed_out')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed')
        if (session) {
          router.push('/dashboard')
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
        setStatus('Authentication successful! Redirecting...')
        setTimeout(() => {
          router.push('/dashboard')
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
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{
        color: 'white',
        fontSize: '16px',
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: '300px'
      }}>
        {status}
      </p>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 