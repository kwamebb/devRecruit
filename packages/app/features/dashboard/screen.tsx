'use client'

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native'
import { useAuth } from '../../provider/auth'
import { TextLink } from 'solito/link'
import { useAppRouter } from '../../hooks/useAppRouter'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/Avatar'
import { usePrivacyControls, PrivacySettings } from '../../utils/privacyControls'
import { 
  logInfo, 
  logWarning, 
  logError, 
  logSecurityEvent, 
  measureAsync, 
  useMonitoring 
} from '../../utils/monitoring'
import { 
  runSecurityScan, 
  testXSSInput, 
  exportSecurityReport,
  useSecurityTools 
} from '../../utils/securityTools'
import { 
  getCachedGitHubStats,
  GitHubStats 
} from '../../utils/githubStats'
import {
  validateFullName,
  validateUsername,
  validateAge,
  validateAboutMe,
  validateEducationStatus,
  validateCodingLanguages,
  formatFullName,
  formatUsername,
  getCharacterCountInfo,
  getFieldValidationState
} from '../../utils/profileValidation'

type TabType = 'profile' | 'settings' | 'my-projects' | 'create-project' | 'browse-projects' | 'help'

interface SidebarItem {
  id: TabType
  label: string
  icon: string
  description: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'browse-projects', label: 'Browse Projects', icon: '🔍', description: 'Find projects to work on' },
  { id: 'my-projects', label: 'My Projects', icon: '📁', description: 'Manage your projects' },
  { id: 'create-project', label: 'Create Project', icon: '➕', description: 'Post a new project' },
  { id: 'profile', label: 'Profile', icon: '👤', description: 'View and edit your profile' },
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Account settings' },
  { id: 'help', label: 'Help', icon: '❓', description: 'Get help and support' }
]

const CODING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'HTML/CSS', 'SQL', 'R',
  'Scala', 'Perl', 'Haskell', 'Lua', 'Assembly', 'MATLAB', 'Shell/Bash'
]

const EDUCATION_OPTIONS = [
  { value: 'highschool', label: 'High School', icon: '🎓' },
  { value: 'college', label: 'College/University', icon: '🏫' },
  { value: 'professional', label: 'Working Professional', icon: '💼' },
  { value: 'not_in_school', label: 'Self-Learning', icon: '📚' }
]

export function DashboardScreen() {
  const { user, signOut, loading } = useAuth()
  const router = useAppRouter()
  const privacyControls = usePrivacyControls()
  const { getStats, exportLogs, clearLogs } = useMonitoring()
  const { runSecurityScan: scanSecurity, testXSSInput: testXSS } = useSecurityTools()
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('browse-projects')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState<any>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [accountDeletionStatus, setAccountDeletionStatus] = useState<any>(null)
  const [isExportingData, setIsExportingData] = useState(false)
  
  // Security and monitoring state
  const [securityScanResults, setSecurityScanResults] = useState<any>(null)
  const [isRunningSecurityScan, setIsRunningSecurityScan] = useState(false)
  const [xssTestInput, setXssTestInput] = useState('')
  const [showDeveloperTools, setShowDeveloperTools] = useState(
    process.env.NODE_ENV === 'development' || user?.email === 'ekbotse1@coastal.edu'
  )
  
  // GitHub statistics state
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null)
  const [isLoadingGithubStats, setIsLoadingGithubStats] = useState(false)
  
  // About Me is now part of the main profile editing
  
  // Validation state for real-time feedback
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Authentication guard - redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        details: { 
          action: 'unauthorized_dashboard_access',
          redirected: true,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        },
        timestamp: new Date().toISOString()
      })
      router.push('/')
      return
    }
    
    if (user) {
      logInfo('Dashboard accessed successfully', {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      })
    }
  }, [user, loading, router])

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingOnboarding(false)
        return
      }

      try {
        console.log('🔍 Checking profile for user:', user.id)
        
        // Use maybeSingle() instead of single() to handle case where profile doesn't exist
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        console.log('📋 Profile query result:', { profile, error })

        // If there's an error that's not "not found", log it
        if (error) {
          console.error('❌ Profile lookup error:', error)
          logError({
            message: 'Failed to check onboarding status',
            level: 'error',
            component: 'dashboard_onboarding',
            userId: user?.id,
            timestamp: new Date().toISOString(),
            metadata: { error: error.message, code: error.code }
          })
          setCheckingOnboarding(false)
          return
        }

        // If no profile exists, create one automatically
        if (!profile) {
          console.log('🆕 No profile found, creating one...')
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || 'user',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
              about_me: null,
              github_username: user.user_metadata?.user_name || user.user_metadata?.login || '',
              github_repository_count: 0,
              github_commit_count: 0,
              onboarding_completed: false,
              account_status: 'active',
              privacy_settings: {
                showEmail: false,
                showGithub: true,
                analyticsConsent: true
              }
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Failed to create profile:', createError)
            logError({
              message: 'Failed to create new user profile',
              level: 'error',
              component: 'dashboard_onboarding',
              userId: user?.id,
              timestamp: new Date().toISOString(),
              metadata: { error: createError.message, code: createError.code }
            })
            setCheckingOnboarding(false)
            return
          }

          console.log('✅ Created new profile:', newProfile)
          
          // Fetch initial GitHub stats if available
          if (user.user_metadata?.user_name || user.user_metadata?.login) {
            console.log('🔄 Fetching initial GitHub stats for new user...')
            try {
              const { updateUserGitHubStats } = await import('../../utils/githubStats')
              const githubUsername = user.user_metadata?.user_name || user.user_metadata?.login
              
              const statsResult = await updateUserGitHubStats(user.id, githubUsername)
              if (statsResult.success) {
                console.log('✅ Initial GitHub stats fetched successfully:', statsResult.stats)
              } else {
                console.log('⚠️ Initial GitHub stats fetch failed:', statsResult.error)
              }
            } catch (error) {
              console.log('⚠️ Initial GitHub stats fetch error:', error)
            }
          }
          
          // Redirect to onboarding since it's a new profile
          logInfo('New user redirected to complete onboarding', {
            userId: user.id,
            profileCreated: true
          })
          router.push('/onboarding')
          return
        }

        // Check if onboarding is completed
        if (!profile.onboarding_completed) {
          console.log('📝 Profile found but onboarding not completed, redirecting...')
          logInfo('User redirected to complete onboarding', {
            userId: user.id,
            profileExists: true,
            onboardingCompleted: false
          })
          router.push('/onboarding')
          return
        }

        console.log('✅ Profile loaded successfully:', profile)
        setUserProfile(profile)
        setCheckingOnboarding(false)
        
        // Load privacy settings and GitHub stats
        loadPrivacySettings()
        loadGitHubStats()
      } catch (error) {
        console.error('❌ Unexpected error during onboarding check:', error)
        logError({
          message: 'Unexpected error during onboarding check',
          level: 'error',
          component: 'dashboard_onboarding',
          userId: user?.id,
          timestamp: new Date().toISOString(),
          metadata: { error: error.message, stack: error.stack }
        })
        setCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user, router])

  // Load privacy settings
  const loadPrivacySettings = async () => {
    if (!user) return
    
    setIsLoadingPrivacy(true)
    try {
      const [settingsResult, deletionResult] = await Promise.all([
        privacyControls.getPrivacySettings(user.id),
        privacyControls.getAccountDeletionStatus(user.id)
      ])
      
      if (settingsResult.success) {
        setPrivacySettings(settingsResult.settings!)
      }
      
      if (deletionResult.success) {
        setAccountDeletionStatus(deletionResult)
      }
    } catch (error) {
      logError({
        message: 'Failed to load privacy settings',
        level: 'error',
        component: 'privacy_controls',
        userId: user?.id,
        timestamp: new Date().toISOString(),
        metadata: { error: error.message }
      })
    } finally {
      setIsLoadingPrivacy(false)
    }
  }

  // Load GitHub statistics
  const loadGitHubStats = async () => {
    if (!user) return
    
    setIsLoadingGithubStats(true)
    try {
      const result = await getCachedGitHubStats(user.id)
      
      if (result.success && result.stats) {
        setGithubStats(result.stats)
      } else {
        console.log('No GitHub stats available:', result.error)
      }
    } catch (error) {
      logError({
        message: 'Failed to load GitHub statistics',
        level: 'error',
        component: 'github_stats',
        userId: user?.id,
        timestamp: new Date().toISOString(),
        metadata: { error: error.message }
      })
    } finally {
      setIsLoadingGithubStats(false)
    }
  }

  // About Me is now handled in the main profile save function

  // Show loading while auth is loading or checking onboarding status
  if (loading || checkingOnboarding) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafbfc'
      }}>
        <Text style={{
          fontSize: 18,
          color: '#64748b',
          fontWeight: '500'
        }}>
          Loading dashboard...
        </Text>
      </View>
    )
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      console.log('🚪 Signing out user...')
      await signOut()
      console.log('✅ Sign out successful, redirecting to home...')
      router.push('/')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const handleEditProfile = () => {
    setEditedProfile({ ...userProfile })
    setIsEditingProfile(true)
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setEditedProfile(null)
  }

  const handleLanguageToggle = (language: string) => {
    if (!editedProfile) return
    
    const currentLanguages = editedProfile.coding_languages || []
    const updatedLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter((lang: string) => lang !== language)
      : [...currentLanguages, language]
    
    setEditedProfile({
      ...editedProfile,
      coding_languages: updatedLanguages
    })
  }

  const handleSaveProfile = async () => {
    if (!user || !editedProfile) return

    // Comprehensive validation using our validation utility
    const fullNameValid = validateFullName(editedProfile.full_name || '')
    const usernameValid = validateUsername(editedProfile.username || '')
    const ageValid = validateAge(editedProfile.age || '')
    const aboutMeValid = validateAboutMe(editedProfile.about_me || '')
    const educationValid = validateEducationStatus(editedProfile.education_status || '')
    const languagesValid = validateCodingLanguages(editedProfile.coding_languages || [])
    
    // Collect all validation errors
    const errors = []
    if (!fullNameValid.isValid) errors.push(`Full Name: ${fullNameValid.error}`)
    if (!usernameValid.isValid) errors.push(`Username: ${usernameValid.error}`)
    if (!ageValid.isValid) errors.push(`Age: ${ageValid.error}`)
    if (!aboutMeValid.isValid) errors.push(`About Me: ${aboutMeValid.error}`)
    if (!educationValid.isValid) errors.push(`Education: ${educationValid.error}`)
    if (!languagesValid.isValid) errors.push(`Languages: ${languagesValid.error}`)
    
    if (errors.length > 0) {
      console.error('Profile validation failed:', errors)
      Alert.alert(
        'Profile Validation Failed',
        errors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    setIsSavingProfile(true)

    try {
      // Format data before saving
      const formattedProfile = {
        username: formatUsername(editedProfile.username || ''),
        full_name: formatFullName(editedProfile.full_name || ''),
        about_me: editedProfile.about_me?.trim() || null,
        age: parseInt(editedProfile.age || '0'),
        education_status: editedProfile.education_status,
        coding_languages: editedProfile.coding_languages,
        avatar_url: editedProfile.avatar_url,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(formattedProfile)
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        Alert.alert(
          'Update Failed',
          error.message || 'Failed to update profile',
          [{ text: 'OK', style: 'default' }]
        )
        return
      }

      // Update local state with formatted data
      setUserProfile({ ...editedProfile, ...formattedProfile })
      setIsEditingProfile(false)
      setEditedProfile(null)
      
      // Clear validation errors
      setValidationErrors({})
      
      Alert.alert(
        'Success!',
        'Your profile has been updated successfully.',
        [{ text: 'Great!', style: 'default' }]
      )
      
      console.log('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Unexpected error updating profile:', error)
      Alert.alert(
        'Error',
        'An unexpected error occurred while updating your profile.',
        [{ text: 'OK', style: 'default' }]
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    if (!user) return

    try {
      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Avatar update error:', error)
        return
      }

      // Update local state
      setUserProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }))
      if (editedProfile) {
        setEditedProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }))
      }
      
      console.log('✅ Avatar updated successfully!')
    } catch (error) {
      console.error('Unexpected error updating avatar:', error)
    }
  }

  const isProfileValid = () => {
    if (!editedProfile) return false
    
    // Use our comprehensive validation
    const fullNameValid = validateFullName(editedProfile.full_name || '')
    const usernameValid = validateUsername(editedProfile.username || '')
    const ageValid = validateAge(editedProfile.age || '')
    const aboutMeValid = validateAboutMe(editedProfile.about_me || '')
    const educationValid = validateEducationStatus(editedProfile.education_status || '')
    const languagesValid = validateCodingLanguages(editedProfile.coding_languages || [])
    
    return (
      fullNameValid.isValid &&
      usernameValid.isValid &&
      ageValid.isValid &&
      aboutMeValid.isValid &&
      educationValid.isValid &&
      languagesValid.isValid
    )
  }

  // Real-time field validation
  const validateField = (fieldName: string, value: any) => {
    let validation
    
    switch (fieldName) {
      case 'full_name':
        validation = validateFullName(value || '')
        break
      case 'username':
        validation = validateUsername(value || '')
        break
      case 'age':
        validation = validateAge(value || '')
        break
      case 'about_me':
        validation = validateAboutMe(value || '')
        break
      case 'education_status':
        validation = validateEducationStatus(value || '')
        break
      case 'coding_languages':
        validation = validateCodingLanguages(value || [])
        break
      default:
        return
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error || ''
    }))
  }

  // Privacy control handlers
  const handlePrivacySettingChange = async (setting: keyof PrivacySettings, value: any) => {
    if (!user || !privacySettings) return
    
    // Log the privacy change
    logSecurityEvent({
      type: 'privacy_change',
      severity: 'medium',
      userId: user.id,
      details: { 
        setting, 
        oldValue: privacySettings[setting], 
        newValue: value 
      },
      timestamp: new Date().toISOString()
    })
    
    const updatedSettings = { ...privacySettings, [setting]: value }
    setPrivacySettings(updatedSettings)
    
    // Measure database update performance
    setIsSavingPrivacy(true)
    try {
      const result = await measureAsync('update_privacy_settings', async () => {
        return await privacyControls.updatePrivacySettings(user.id, { [setting]: value })
      }, { userId: user.id, setting, value })
      
      if (!result.success) {
        // Revert on error
        setPrivacySettings(privacySettings)
        logError({
          message: 'Failed to update privacy settings',
          level: 'error',
          component: 'privacy_controls',
          userId: user.id,
          timestamp: new Date().toISOString(),
          metadata: { setting, value, error: result.error }
        })
        Alert.alert('Error', result.error || 'Failed to update privacy settings')
      } else {
        logInfo('Privacy settings updated successfully', {
          userId: user.id,
          setting,
          newValue: value
        })
      }
    } catch (error) {
      // Revert on error
      setPrivacySettings(privacySettings)
      logError({
        message: 'Privacy settings update failed',
        level: 'error',
        component: 'privacy_controls',
        userId: user.id,
        timestamp: new Date().toISOString(),
        metadata: { setting, value, error: error.message }
      })
      Alert.alert('Error', 'Failed to update privacy settings')
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handleDataExport = async () => {
    if (!user) return
    
    setIsExportingData(true)
    try {
      const result = await privacyControls.exportUserData(user.id)
      if (result.success && result.data) {
        // Create downloadable file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `devrecruit-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        Alert.alert('Success', 'Your data has been exported and downloaded.')
      } else {
        Alert.alert('Error', result.error || 'Failed to export data')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data')
    } finally {
      setIsExportingData(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (!user) return
    
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. Your account will be scheduled for deletion with a 30-day grace period.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await privacyControls.requestAccountDeletion(user.id, 'User requested deletion')
              if (result.success) {
                Alert.alert(
                  'Account Deletion Scheduled',
                  `Your account has been scheduled for deletion on ${new Date(result.deletionDate!).toLocaleDateString()}. You can cancel this request within 30 days.`
                )
                loadPrivacySettings() // Refresh status
              } else {
                Alert.alert('Error', result.error || 'Failed to schedule account deletion')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to schedule account deletion')
            }
          }
        }
      ]
    )
  }

  const handleCancelAccountDeletion = async () => {
    if (!user) return
    
    try {
      const result = await privacyControls.cancelAccountDeletion(user.id)
      if (result.success) {
        Alert.alert('Success', 'Account deletion has been cancelled.')
        loadPrivacySettings() // Refresh status
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel account deletion')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel account deletion')
    }
  }

  // Security and monitoring functions
  const handleRunSecurityScan = async () => {
    setIsRunningSecurityScan(true)
    
    try {
      logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'low',
        userId: user?.id,
        details: { action: 'manual_security_scan_initiated' },
        timestamp: new Date().toISOString()
      })
      
      const report = await runSecurityScan()
      setSecurityScanResults(report)
      
      // Alert for critical issues
      if (report.criticalIssues > 0) {
        Alert.alert('🚨 Critical Security Issues', `Found ${report.criticalIssues} critical security issues. Check the console for details.`)
      }
      
      // Export report automatically
      exportSecurityReport(report)
      
      logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'low',
        userId: user?.id,
        details: { 
          action: 'security_scan_completed',
          totalIssues: report.totalIssues,
          criticalIssues: report.criticalIssues
        },
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      logError({
        message: 'Security scan failed',
        level: 'error',
        component: 'security_tools',
        userId: user?.id,
        timestamp: new Date().toISOString(),
        metadata: { error: error.message }
      })
    } finally {
      setIsRunningSecurityScan(false)
    }
  }

  const handleTestXSSInput = () => {
    if (!xssTestInput.trim()) return
    
    const results = testXSSInput(xssTestInput)
    
    if (results.length > 0) {
      Alert.alert('⚠️ XSS Vulnerabilities', `Detected ${results.length} potential XSS vulnerabilities. Check console for details.`)
      logWarning('XSS vulnerabilities detected in test input', {
        input: xssTestInput,
        vulnerabilities: results,
        userId: user?.id
      })
    } else {
      Alert.alert('✅ Input Safe', 'No XSS vulnerabilities detected in the test input.')
      logInfo('XSS test passed - input appears safe', {
        input: xssTestInput,
        userId: user?.id
      })
    }
  }

  const handleExportLogs = () => {
    try {
      const logs = exportLogs()
      const logData = JSON.parse(logs)
      
      // Create downloadable file
      const dataStr = JSON.stringify(logData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `devrecruit-logs-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      Alert.alert('Success', 'Logs exported and downloaded successfully.')
      
      logInfo('Logs exported by user', {
        userId: user?.id,
        logCount: logData.length
      })
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs')
      logError({
        message: 'Failed to export logs',
        level: 'error',
        component: 'monitoring',
        userId: user?.id,
        timestamp: new Date().toISOString(),
        metadata: { error: error.message }
      })
    }
  }

  const handleViewStats = () => {
    const stats = getStats()
    Alert.alert(
      '📊 Monitoring Stats',
      `Total Logs: ${stats.totalLogs}\nErrors: ${stats.errorCount}\nWarnings: ${stats.warningCount}\nSecurity Events: ${stats.securityEventCount}\nPerformance Alerts: ${stats.performanceAlertCount}`
    )
    
    logInfo('Monitoring stats viewed', {
      userId: user?.id,
      stats
    })
  }

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all monitoring logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearLogs()
            Alert.alert('Success', 'All logs have been cleared.')
            logInfo('Logs cleared by user', { userId: user?.id })
          }
        }
      ]
    )
  }

  // Helper function to render toggle switches
  const renderToggleSwitch = (isEnabled: boolean, onToggle: () => void, disabled: boolean = false) => (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      style={{
        width: 48,
        height: 24,
        backgroundColor: isEnabled ? '#667eea' : '#e2e8f0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: isEnabled ? 'flex-end' : 'flex-start',
        paddingHorizontal: 2,
        opacity: disabled ? 0.5 : 1
      }}
    >
      <View style={{
        width: 20,
        height: 20,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
      }} />
    </Pressable>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <View style={{ gap: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                  Your Profile
                </Text>
                <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                  {isEditingProfile ? 'Edit your developer profile' : 'Manage your developer profile and showcase your skills'}
                </Text>
              </View>
              
              {!isEditingProfile && (
                <Pressable
                  onPress={handleEditProfile}
                  onHoverIn={() => setHoveredButton('edit-profile')}
                  onHoverOut={() => setHoveredButton(null)}
                  style={{
                    // @ts-ignore - React Native Web gradient background
                    background: hoveredButton === 'edit-profile' ? 
                      'linear-gradient(135deg, #5b6cf0 0%, #6366f1 100%)' : 
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    shadowColor: '#667eea',
                    shadowOffset: { width: 0, height: hoveredButton === 'edit-profile' ? 8 : 4 },
                    shadowOpacity: hoveredButton === 'edit-profile' ? 0.3 : 0.2,
                    shadowRadius: hoveredButton === 'edit-profile' ? 16 : 12,
                    elevation: hoveredButton === 'edit-profile' ? 6 : 4,
                    // @ts-ignore - React Native Web transitions
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: [
                      { scale: hoveredButton === 'edit-profile' ? 1.05 : 1 },
                      { translateY: hoveredButton === 'edit-profile' ? -2 : 0 }
                    ]
                  }}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 12, color: '#ffffff' }}>✏️</Text>
                  </View>
                  <Text style={{ 
                    color: '#ffffff', 
                    fontWeight: '700', 
                    fontSize: 15,
                    letterSpacing: 0.3
                  }}>
                    Edit Profile
                  </Text>
                </Pressable>
              )}
            </View>

            {userProfile && (
              <View style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 24,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                gap: 24
              }}>
                {/* Profile Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Avatar
                    src={isEditingProfile ? editedProfile?.avatar_url : userProfile.avatar_url}
                    name={isEditingProfile ? editedProfile?.full_name : userProfile.full_name}
                    username={isEditingProfile ? editedProfile?.username : userProfile.username}
                    size={64}
                    showEditIcon={true}
                    onAvatarUpdate={handleAvatarUpdate}
                    userId={user?.id}
                  />
                  <View style={{ flex: 1 }}>
                    {isEditingProfile ? (
                      <View style={{ gap: 8 }}>
                        <View>
                          <TextInput
                            style={{
                              fontSize: 20,
                              fontWeight: '700',
                              color: '#0f172a',
                              borderWidth: 2,
                              borderColor: (() => {
                                if (validationErrors.full_name) return '#ef4444'
                                if (editedProfile?.full_name && validateFullName(editedProfile.full_name).isValid) return '#10b981'
                                return '#667eea'
                              })(),
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              backgroundColor: '#f8fafc'
                            }}
                            value={editedProfile?.full_name || ''}
                            onChangeText={(text) => {
                              setEditedProfile({...editedProfile, full_name: text})
                              validateField('full_name', text)
                            }}
                            placeholder="Full Name (First and Last)"
                          />
                          {validationErrors.full_name ? (
                            <Text style={{
                              fontSize: 12,
                              color: '#ef4444',
                              marginTop: 4,
                              fontWeight: '500'
                            }}>
                              {validationErrors.full_name}
                            </Text>
                          ) : null}
                          {editedProfile?.full_name && !validationErrors.full_name && validateFullName(editedProfile.full_name).isValid ? (
                            <Text style={{
                              fontSize: 12,
                              color: '#10b981',
                              marginTop: 4,
                              fontWeight: '500'
                            }}>
                              ✓ Name looks good!
                            </Text>
                          ) : null}
                        </View>
                        <View>
                          <TextInput
                            style={{
                              fontSize: 14,
                              color: '#64748b',
                              borderWidth: 2,
                              borderColor: (() => {
                                if (validationErrors.username) return '#ef4444'
                                if (editedProfile?.username && validateUsername(editedProfile.username).isValid) return '#10b981'
                                return '#e2e8f0'
                              })(),
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: '#ffffff'
                            }}
                            value={editedProfile?.username || ''}
                            onChangeText={(text) => {
                              const formatted = formatUsername(text)
                              setEditedProfile({...editedProfile, username: formatted})
                              validateField('username', formatted)
                            }}
                            placeholder="username (3-22 characters)"
                          />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <View>
                              {validationErrors.username ? (
                                <Text style={{
                                  fontSize: 12,
                                  color: '#ef4444',
                                  fontWeight: '500'
                                }}>
                                  {validationErrors.username}
                                </Text>
                              ) : null}
                              {editedProfile?.username && !validationErrors.username && validateUsername(editedProfile.username).isValid ? (
                                <Text style={{
                                  fontSize: 12,
                                  color: '#10b981',
                                  fontWeight: '500'
                                }}>
                                  ✓ Username available!
                                </Text>
                              ) : null}
                            </View>
                            <Text style={{
                              fontSize: 12,
                              color: (() => {
                                const len = editedProfile?.username?.length || 0
                                if (len > 22) return '#ef4444'
                                if (len >= 18) return '#f59e0b'
                                return '#64748b'
                              })()
                            }}>
                              {editedProfile?.username?.length || 0}/22
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>
                          {userProfile.full_name}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          @{userProfile.username}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Profile Details */}
                <View style={{ gap: 20 }}>
                  <View style={{ flexDirection: 'row', gap: 32 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 8 }}>AGE</Text>
                                             {isEditingProfile ? (
                         <View>
                           <TextInput
                             style={{
                               fontSize: 16,
                               color: '#0f172a',
                               fontWeight: '600',
                               borderWidth: 2,
                               borderColor: (() => {
                                 if (validationErrors.age) return '#ef4444'
                                 if (editedProfile?.age && validateAge(editedProfile.age).isValid) return '#10b981'
                                 return '#e2e8f0'
                               })(),
                               borderRadius: 8,
                               paddingHorizontal: 12,
                               paddingVertical: 8,
                               backgroundColor: '#ffffff'
                             }}
                             value={editedProfile?.age?.toString() || ''}
                             onChangeText={(text) => {
                               const numericText = text.replace(/[^0-9]/g, '')
                               setEditedProfile({...editedProfile, age: numericText})
                               validateField('age', numericText)
                             }}
                             placeholder="Age (13+)"
                             keyboardType="numeric"
                           />
                           {validationErrors.age ? (
                             <Text style={{
                               fontSize: 12,
                               color: '#ef4444',
                               marginTop: 4,
                               fontWeight: '500'
                             }}>
                               {validationErrors.age}
                             </Text>
                           ) : null}
                           {editedProfile?.age && !validationErrors.age && validateAge(editedProfile.age).isValid ? (
                             <Text style={{
                               fontSize: 12,
                               color: '#10b981',
                               marginTop: 4,
                               fontWeight: '500'
                             }}>
                               ✓ Age verified
                             </Text>
                           ) : null}
                         </View>
                       ) : (
                        <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '600' }}>
                          {userProfile.age}
                        </Text>
                      )}
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 8 }}>STATUS</Text>
                      {isEditingProfile ? (
                        <View style={{ gap: 8 }}>
                          {EDUCATION_OPTIONS.map((option) => (
                            <Pressable
                              key={option.value}
                              onPress={() => {
                                setEditedProfile({...editedProfile, education_status: option.value})
                                validateField('education_status', option.value)
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 8,
                                backgroundColor: editedProfile?.education_status === option.value ? '#f1f5f9' : 'transparent',
                                borderWidth: 1,
                                borderColor: editedProfile?.education_status === option.value ? '#667eea' : '#e2e8f0'
                              }}
                            >
                              <Text style={{ fontSize: 16 }}>{option.icon}</Text>
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: editedProfile?.education_status === option.value ? '#667eea' : '#64748b'
                              }}>
                                {option.label}
                              </Text>
                            </Pressable>
                          ))}
                          {validationErrors.education_status ? (
                            <Text style={{
                              fontSize: 12,
                              color: '#ef4444',
                              fontWeight: '500',
                              marginTop: 4
                            }}>
                              {validationErrors.education_status}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '600' }}>
                          {userProfile.education_status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Coding Languages */}
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 12 }}>
                      CODING LANGUAGES
                    </Text>
                    
                    {isEditingProfile ? (
                      <View style={{ gap: 16 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {CODING_LANGUAGES.map((language) => (
                            <Pressable
                              key={language}
                              onPress={() => {
                                handleLanguageToggle(language)
                                // Validate after selection
                                const currentLanguages = editedProfile?.coding_languages || []
                                const newLanguages = currentLanguages.includes(language) 
                                  ? currentLanguages.filter(l => l !== language)
                                  : [...currentLanguages, language]
                                validateField('coding_languages', newLanguages)
                              }}
                              style={{
                                borderWidth: 2,
                                borderColor: editedProfile?.coding_languages?.includes(language) ? '#667eea' : '#e2e8f0',
                                backgroundColor: editedProfile?.coding_languages?.includes(language) ? '#667eea' : '#ffffff',
                                borderRadius: 16,
                                paddingHorizontal: 12,
                                paddingVertical: 6
                              }}
                            >
                              <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                color: editedProfile?.coding_languages?.includes(language) ? '#ffffff' : '#64748b'
                              }}>
                                {language}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        
                        {validationErrors.coding_languages ? (
                          <Text style={{
                            fontSize: 12,
                            color: '#ef4444',
                            fontWeight: '500',
                            marginTop: 4
                          }}>
                            {validationErrors.coding_languages}
                          </Text>
                        ) : null}
                        
                                                  {editedProfile?.coding_languages?.length > 0 ? (
                            <View style={{
                              backgroundColor: editedProfile.coding_languages.length > 15 ? '#fef2f2' : '#f8fafc',
                              borderRadius: 8,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: editedProfile.coding_languages.length > 15 ? '#fecaca' : '#e2e8f0'
                            }}>
                              <Text style={{ 
                                fontSize: 12, 
                                fontWeight: '600', 
                                color: editedProfile.coding_languages.length > 15 ? '#dc2626' : '#374151', 
                                marginBottom: 4 
                              }}>
                                Selected ({editedProfile.coding_languages.length}/15):
                              </Text>
                              <Text style={{ fontSize: 12, color: '#64748b' }}>
                                {editedProfile.coding_languages.join(', ')}
                              </Text>
                              {editedProfile.coding_languages.length > 15 ? (
                                <Text style={{
                                  fontSize: 12,
                                  color: '#dc2626',
                                  fontWeight: '500',
                                  marginTop: 4
                                }}>
                                  Please select no more than 15 languages to keep your profile focused
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {userProfile.coding_languages?.map((lang: string, index: number) => (
                          <View key={index} style={{
                            backgroundColor: '#f1f5f9',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#e2e8f0'
                          }}>
                            <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>
                              {lang}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* About Me Section */}
                <View style={{ 
                  borderTopWidth: 1, 
                  borderTopColor: '#f1f5f9', 
                  paddingTop: 20,
                  marginTop: 20
                }}>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#64748b', 
                    fontWeight: '600',
                    marginBottom: 16
                  }}>
                    ABOUT ME
                  </Text>

                  {isEditingProfile ? (
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{
                          fontSize: 14,
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          Bio (Optional)
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: getCharacterCountInfo(editedProfile?.about_me || '', 500).color
                        }}>
                          {getCharacterCountInfo(editedProfile?.about_me || '', 500).current}/500
                        </Text>
                      </View>
                      <TextInput
                        value={editedProfile?.about_me || ''}
                        onChangeText={(text) => {
                          setEditedProfile(prev => ({ ...prev, about_me: text }))
                          validateField('about_me', text)
                        }}
                        placeholder="Tell us about yourself, your coding interests, experience, or what you're passionate about. Share your story in up to 500 characters..."
                        multiline
                        numberOfLines={4}
                        style={{
                          backgroundColor: '#ffffff',
                          borderWidth: 2,
                          borderColor: (() => {
                            if (validationErrors.about_me) return '#ef4444'
                            if (editedProfile?.about_me && validateAboutMe(editedProfile.about_me).isValid) return '#10b981'
                            return '#e2e8f0'
                          })(),
                          borderRadius: 12,
                          padding: 12,
                          fontSize: 14,
                          color: '#0f172a',
                          textAlignVertical: 'top',
                          minHeight: 100
                        }}
                      />
                      {validationErrors.about_me ? (
                        <Text style={{
                          fontSize: 12,
                          color: '#ef4444',
                          fontWeight: '500'
                        }}>
                          {validationErrors.about_me}
                        </Text>
                      ) : null}
                      {editedProfile?.about_me && !validationErrors.about_me && validateAboutMe(editedProfile.about_me).isValid && editedProfile.about_me.trim().length > 0 ? (
                        <Text style={{
                          fontSize: 12,
                          color: '#10b981',
                          fontWeight: '500'
                        }}>
                          ✓ Bio looks great!
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 12,
                      padding: 16
                    }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#475569',
                        lineHeight: 20
                      }}>
                        {userProfile?.about_me || 'No bio added yet. Click "Edit Profile" to add information about yourself!'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* GitHub Statistics Section */}
                <View style={{ 
                  borderTopWidth: 1, 
                  borderTopColor: '#f1f5f9', 
                  paddingTop: 20,
                  marginTop: 20
                }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 16 
                  }}>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#64748b', 
                      fontWeight: '600' 
                    }}>
                      GITHUB STATISTICS
                    </Text>
                    
                    <Text style={{
                      fontSize: 10,
                      color: '#94a3b8',
                      fontWeight: '400'
                    }}>
                      Updates daily
                    </Text>
                  </View>

                  {isLoadingGithubStats ? (
                    <View style={{
                      alignItems: 'center',
                      paddingVertical: 24
                    }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#64748b'
                      }}>
                        Loading GitHub statistics...
                      </Text>
                    </View>
                  ) : githubStats ? (
                    <View style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 12,
                      padding: 16,
                      gap: 12
                    }}>
                                             {/* GitHub Username */}
                       <View style={{
                         flexDirection: 'row',
                         alignItems: 'center',
                         gap: 8
                       }}>
                         <Text style={{
                           fontSize: 14,
                           color: '#475569',
                           fontWeight: '500'
                         }}>
                           Username:
                         </Text>
                         <Pressable
                           onPress={() => {
                             if (typeof window !== 'undefined') {
                               window.open(`https://github.com/${githubStats.username}`, '_blank')
                             }
                           }}
                           onHoverIn={() => setHoveredButton('github-username')}
                           onHoverOut={() => setHoveredButton(null)}
                           style={{
                             backgroundColor: hoveredButton === 'github-username' ? '#e0e7ff' : '#f1f5f9',
                             paddingHorizontal: 8,
                             paddingVertical: 4,
                             borderRadius: 6,
                             borderWidth: 1,
                             borderColor: hoveredButton === 'github-username' ? '#667eea' : '#e2e8f0',
                             cursor: 'pointer'
                           }}
                         >
                           <View style={{
                             flexDirection: 'row',
                             alignItems: 'center',
                             gap: 4
                           }}>
                             <Text style={{
                               fontSize: 14,
                               color: '#667eea',
                               fontWeight: '600',
                               fontFamily: 'monospace'
                             }}>
                               @{githubStats.username}
                             </Text>
                             <Text style={{
                               fontSize: 12,
                               color: '#94a3b8'
                             }}>
                               ↗
                             </Text>
                           </View>
                         </Pressable>
                       </View>

                      {/* Repository Count */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <Text style={{
                          fontSize: 14,
                          color: '#475569',
                          fontWeight: '500'
                        }}>
                          Public Repositories:
                        </Text>
                        <View style={{
                          backgroundColor: '#dbeafe',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6
                        }}>
                          <Text style={{
                            fontSize: 14,
                            color: '#1e40af',
                            fontWeight: '700'
                          }}>
                            {githubStats.repositoryCount}
                          </Text>
                        </View>
                      </View>

                      {/* Commit Count */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <Text style={{
                          fontSize: 14,
                          color: '#475569',
                          fontWeight: '500'
                        }}>
                          Estimated Commits:
                        </Text>
                        <View style={{
                          backgroundColor: '#dcfce7',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6
                        }}>
                          <Text style={{
                            fontSize: 14,
                            color: '#166534',
                            fontWeight: '700'
                          }}>
                            {githubStats.commitCount}+
                          </Text>
                        </View>
                      </View>

                      {/* Last Updated */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 4
                      }}>
                        <Text style={{
                          fontSize: 12,
                          color: '#64748b'
                        }}>
                          Last updated: {new Date(githubStats.lastUpdated).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#fef3c7',
                      borderWidth: 1,
                      borderColor: '#fbbf24',
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#92400e',
                        fontWeight: '500',
                        textAlign: 'center'
                      }}>
                        No GitHub account linked
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: '#a16207',
                        textAlign: 'center'
                      }}>
                        Sign in with GitHub to display your coding statistics
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Edit Actions */}
                {isEditingProfile && (
                  <View style={{
                    flexDirection: 'row',
                    gap: 12,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9'
                  }}>
                    <Pressable
                      onPress={handleCancelEdit}
                      onHoverIn={() => setHoveredButton('cancel-edit')}
                      onHoverOut={() => setHoveredButton(null)}
                      style={{
                        flex: 1,
                        backgroundColor: hoveredButton === 'cancel-edit' ? '#f8fafc' : '#ffffff',
                        borderWidth: 2,
                        borderColor: '#e2e8f0',
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#64748b'
                      }}>
                        Cancel
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={handleSaveProfile}
                      disabled={isSavingProfile || !isProfileValid()}
                      onHoverIn={() => setHoveredButton('save-profile')}
                      onHoverOut={() => setHoveredButton(null)}
                      style={{
                        flex: 1,
                        backgroundColor: isSavingProfile || !isProfileValid() ? '#94a3b8' : 
                          (hoveredButton === 'save-profile' ? '#5b6cf0' : '#667eea'),
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: 'center',
                        opacity: isSavingProfile || !isProfileValid() ? 0.6 : 1
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#ffffff'
                      }}>
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        )

      case 'my-projects':
        return (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                My Projects
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                Track and manage your active projects
              </Text>
            </View>

            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 48,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
              gap: 16
            }}>
              <Text style={{ fontSize: 48 }}>📁</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>
                No projects yet
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                You haven't created or joined any projects yet. Start by creating your first project!
              </Text>
              <Pressable
                onPress={() => setActiveTab('create-project')}
                style={{
                  backgroundColor: '#667eea',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginTop: 8
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                  Create Your First Project
                </Text>
              </Pressable>
            </View>
          </View>
        )

      case 'create-project':
        return (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                Create Project
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                Post a new project and find talented developers
              </Text>
            </View>

            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 48,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
              gap: 16
            }}>
              <Text style={{ fontSize: 48 }}>🚀</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>
                Project Creation Coming Soon
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                We're building an amazing project creation experience. Stay tuned!
              </Text>
            </View>
          </View>
        )

      case 'browse-projects':
        return (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                Browse Projects
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                Discover exciting projects to contribute to
              </Text>
            </View>

            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 48,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
              gap: 16
            }}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>
                Project Browser Coming Soon
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                Soon you'll be able to browse and apply to amazing projects from developers worldwide.
              </Text>
            </View>
          </View>
        )

      case 'settings':
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 24, paddingBottom: 40 }}>
              <View style={{ gap: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                  Settings & Privacy
                </Text>
                <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                  Manage your account preferences, privacy settings, and data controls
                </Text>
              </View>

              {isLoadingPrivacy ? (
                <View style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200
                }}>
                  <Text style={{ fontSize: 16, color: '#64748b' }}>Loading privacy settings...</Text>
                </View>
              ) : (
                <>
                  {/* Account Deletion Warning */}
                  {accountDeletionStatus?.status === 'pending' && (
                    <View style={{
                      backgroundColor: '#fef2f2',
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: '#fecaca',
                      gap: 12
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 20 }}>⚠️</Text>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#dc2626' }}>
                          Account Deletion Scheduled
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 20 }}>
                        Your account is scheduled for deletion on {new Date(accountDeletionStatus.scheduledDate).toLocaleDateString()}.
                        You have {accountDeletionStatus.daysRemaining} days remaining to cancel this request.
                      </Text>
                      <Pressable
                        onPress={handleCancelAccountDeletion}
                        style={{
                          backgroundColor: '#dc2626',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignSelf: 'flex-start'
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                          Cancel Deletion
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Privacy Settings */}
                  <View style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    gap: 20
                  }}>
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>
                        🔒 Privacy Settings
                      </Text>
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        Control how your information is shared and displayed
                      </Text>
                    </View>
                    
                    {privacySettings && (
                      <View style={{ gap: 16 }}>
                        {/* Profile Visibility */}
                        <View style={{
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9'
                        }}>
                          <View style={{ gap: 8, marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                              Profile Visibility
                            </Text>
                            <Text style={{ fontSize: 14, color: '#64748b' }}>
                              Control who can see your profile information
                            </Text>
                          </View>
                          <View style={{ gap: 8 }}>
                            {['public', 'limited', 'private'].map((visibility) => (
                              <Pressable
                                key={visibility}
                                onPress={() => handlePrivacySettingChange('profileVisibility', visibility)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 12,
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  borderRadius: 8,
                                  backgroundColor: privacySettings.profileVisibility === visibility ? '#f0f4ff' : 'transparent',
                                  borderWidth: 1,
                                  borderColor: privacySettings.profileVisibility === visibility ? '#667eea' : '#e2e8f0'
                                }}
                              >
                                <View style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 8,
                                  backgroundColor: privacySettings.profileVisibility === visibility ? '#667eea' : 'transparent',
                                  borderWidth: 2,
                                  borderColor: privacySettings.profileVisibility === visibility ? '#667eea' : '#d1d5db'
                                }} />
                                <View style={{ flex: 1 }}>
                                  <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '500', 
                                    color: privacySettings.profileVisibility === visibility ? '#667eea' : '#374151' 
                                  }}>
                                    {visibility === 'public' ? '🌍 Public' : 
                                     visibility === 'limited' ? '👥 Limited' : '🔒 Private'}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                                    {visibility === 'public' ? 'Visible to everyone' : 
                                     visibility === 'limited' ? 'Visible to registered users only' : 'Only visible to you'}
                                  </Text>
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        </View>

                        {/* Contact Information */}
                        <View style={{
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9'
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                            Contact Information
                          </Text>
                          <View style={{ gap: 12 }}>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Show Email Address
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Display your email on your public profile
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.showEmail,
                                () => handlePrivacySettingChange('showEmail', !privacySettings.showEmail),
                                isSavingPrivacy
                              )}
                            </View>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Show GitHub Profile
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Display your GitHub username and link
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.showGithub,
                                () => handlePrivacySettingChange('showGithub', !privacySettings.showGithub),
                                isSavingPrivacy
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Communication Preferences */}
                        <View style={{
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9'
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                            Communication Preferences
                          </Text>
                          <View style={{ gap: 12 }}>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Allow Direct Messages
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Let other users send you direct messages
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.allowDirectMessages,
                                () => handlePrivacySettingChange('allowDirectMessages', !privacySettings.allowDirectMessages),
                                isSavingPrivacy
                              )}
                            </View>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Allow Project Invites
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Receive invitations to collaborate on projects
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.allowProjectInvites,
                                () => handlePrivacySettingChange('allowProjectInvites', !privacySettings.allowProjectInvites),
                                isSavingPrivacy
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Data Processing Consent */}
                        <View style={{ paddingVertical: 12 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                            Data Processing Consent
                          </Text>
                          <View style={{ gap: 12 }}>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Essential Data Processing
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Required for core platform functionality
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.dataProcessingConsent,
                                () => handlePrivacySettingChange('dataProcessingConsent', !privacySettings.dataProcessingConsent),
                                isSavingPrivacy
                              )}
                            </View>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Marketing Communications
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Receive promotional emails and updates
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.marketingConsent,
                                () => handlePrivacySettingChange('marketingConsent', !privacySettings.marketingConsent),
                                isSavingPrivacy
                              )}
                            </View>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                                  Analytics & Performance
                                </Text>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Help us improve the platform with usage data
                                </Text>
                              </View>
                              {renderToggleSwitch(
                                privacySettings.analyticsConsent,
                                () => handlePrivacySettingChange('analyticsConsent', !privacySettings.analyticsConsent),
                                isSavingPrivacy
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Data Management */}
                  <View style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    gap: 20
                  }}>
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>
                        📊 Data Management
                      </Text>
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        Export, manage, or delete your personal data
                      </Text>
                    </View>
                    
                    <View style={{ gap: 16 }}>
                      {/* Data Export */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f1f5f9'
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                            Export Your Data
                          </Text>
                          <Text style={{ fontSize: 14, color: '#64748b' }}>
                            Download all your personal data in JSON format
                          </Text>
                        </View>
                        <Pressable
                          onPress={handleDataExport}
                          disabled={isExportingData}
                          style={{
                            backgroundColor: isExportingData ? '#94a3b8' : '#667eea',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                            opacity: isExportingData ? 0.6 : 1
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                            {isExportingData ? 'Exporting...' : 'Export Data'}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Account Deletion */}
                      {accountDeletionStatus?.status !== 'pending' && (
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 12
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#dc2626' }}>
                              Delete Account
                            </Text>
                            <Text style={{ fontSize: 14, color: '#64748b' }}>
                              Permanently delete your account and all data (30-day grace period)
                            </Text>
                          </View>
                          <Pressable
                            onPress={handleAccountDeletion}
                            style={{
                              backgroundColor: '#dc2626',
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 8
                            }}
                          >
                            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                              Delete Account
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Legal Information */}
                  <View style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    gap: 20
                  }}>
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>
                        📋 Legal Information
                      </Text>
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        Review our policies and legal documents
                      </Text>
                    </View>
                    
                    <View style={{ gap: 12 }}>
                      {[
                        { title: 'Privacy Policy', desc: 'How we collect, use, and protect your data', icon: '🔒' },
                        { title: 'Terms of Service', desc: 'Rules and guidelines for using DevRecruit', icon: '📜' },
                        { title: 'Cookie Policy', desc: 'Information about cookies and tracking', icon: '🍪' },
                        { title: 'Data Processing Agreement', desc: 'GDPR compliance and data handling', icon: '⚖️' }
                      ].map((item, index) => (
                        <Pressable
                          key={index}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: '#f8fafc',
                            borderWidth: 1,
                            borderColor: '#e2e8f0'
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                              {item.title}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>
                              {item.desc}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 16, color: '#94a3b8' }}>→</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Developer Tools */}
                  {showDeveloperTools && (
                    <View style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 16,
                      padding: 24,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      gap: 20
                    }}>
                      <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>
                          🛠️ Developer Tools
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          Security scanning and monitoring tools for development
                        </Text>
                      </View>
                      
                      {/* Security Scan Section */}
                      <View style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        gap: 12
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                          🔍 Security Scan
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          Run comprehensive security checks on the application
                        </Text>
                        
                        <Pressable
                          onPress={handleRunSecurityScan}
                          disabled={isRunningSecurityScan}
                          style={{
                            backgroundColor: isRunningSecurityScan ? '#94a3b8' : '#667eea',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                            opacity: isRunningSecurityScan ? 0.7 : 1
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                            {isRunningSecurityScan ? 'Scanning...' : 'Run Security Scan'}
                          </Text>
                        </Pressable>
                        
                        {securityScanResults && (
                          <View style={{
                            backgroundColor: '#f1f5f9',
                            borderRadius: 8,
                            padding: 12,
                            gap: 8
                          }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                              📋 Scan Results
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>
                              Total Issues: {securityScanResults.totalIssues} | 
                              Critical: {securityScanResults.criticalIssues} | 
                              High: {securityScanResults.highIssues} | 
                              Medium: {securityScanResults.mediumIssues} | 
                              Low: {securityScanResults.lowIssues}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>
                              {securityScanResults.summary}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {/* XSS Testing Section */}
                      <View style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        gap: 12
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                          🧪 XSS Input Testing
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          Test inputs for potential XSS vulnerabilities
                        </Text>
                        
                        <TextInput
                          value={xssTestInput}
                          onChangeText={setXssTestInput}
                          placeholder="Enter input to test for XSS..."
                          style={{
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            fontSize: 14,
                            backgroundColor: '#ffffff'
                          }}
                        />
                        
                        <Pressable
                          onPress={handleTestXSSInput}
                          disabled={!xssTestInput.trim()}
                          style={{
                            backgroundColor: xssTestInput.trim() ? '#10b981' : '#94a3b8',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                            opacity: xssTestInput.trim() ? 1 : 0.7
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                            Test Input
                          </Text>
                        </Pressable>
                        
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>
                          Try inputs like: &lt;script&gt;alert('xss')&lt;/script&gt; or javascript:alert('xss')
                        </Text>
                      </View>
                      
                      {/* Monitoring Tools Section */}
                      <View style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        gap: 12
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                          📊 Monitoring Tools
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          View logs, statistics, and export monitoring data
                        </Text>
                        
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                          <Pressable
                            onPress={handleViewStats}
                            style={{
                              backgroundColor: '#3b82f6',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 6
                            }}
                          >
                            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                              View Stats
                            </Text>
                          </Pressable>
                          
                          <Pressable
                            onPress={handleExportLogs}
                            style={{
                              backgroundColor: '#059669',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 6
                            }}
                          >
                            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                              Export Logs
                            </Text>
                          </Pressable>
                          
                          <Pressable
                            onPress={handleClearLogs}
                            style={{
                              backgroundColor: '#dc2626',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 6
                            }}
                          >
                            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                              Clear Logs
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                      
                      {/* Toggle Developer Tools */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: '#e2e8f0'
                      }}>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          Hide developer tools
                        </Text>
                        <Pressable
                          onPress={() => setShowDeveloperTools(false)}
                          style={{
                            backgroundColor: '#6b7280',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                            Hide
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Security Information */}
                  <View style={{
                    backgroundColor: '#f0f9ff',
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#bae6fd',
                    gap: 12
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>🛡️</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0369a1' }}>
                        Your Privacy Matters
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#0c4a6e', lineHeight: 20 }}>
                      We're committed to protecting your privacy and giving you control over your data. 
                      All settings are saved automatically and take effect immediately. 
                      You can change these settings at any time.
                    </Text>
                    
                    {/* Show Developer Tools Toggle for Admin Users */}
                    {!showDeveloperTools && (process.env.NODE_ENV === 'development' || user?.email === 'ekbotse1@coastal.edu') && (
                      <Pressable
                        onPress={() => setShowDeveloperTools(true)}
                        style={{
                          backgroundColor: '#0369a1',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 6,
                          alignSelf: 'flex-start',
                          marginTop: 8
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                          Show Developer Tools
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        )

      case 'help':
        return (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                Help & Support
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                Get help and learn how to use DevRecruit
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              {[
                { title: 'Getting Started', desc: 'Learn the basics of DevRecruit', icon: '🚀' },
                { title: 'Creating Projects', desc: 'How to post and manage projects', icon: '📝' },
                { title: 'Finding Work', desc: 'Tips for finding great projects', icon: '💼' },
                { title: 'Contact Support', desc: 'Get help from our team', icon: '💬' }
              ].map((item, index) => (
                <Pressable
                  key={index}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      {item.desc}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: '#94a3b8' }}>→</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fafbfc', flexDirection: 'row' }}>
      {/* Sidebar */}
      <View style={{
        width: 280,
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        paddingVertical: 24,
        paddingHorizontal: 20,
        gap: 24
      }}>
        {/* Logo */}
        <View style={{ paddingHorizontal: 8 }}>
          <Pressable
            onHoverIn={() => setHoveredButton('logo')}
            onHoverOut={() => setHoveredButton(null)}
            style={{
              // @ts-ignore - React Native Web hover transition
              transition: 'all 0.2s ease-in-out',
              transform: [{ scale: hoveredButton === 'logo' ? 1.05 : 1 }]
            }}
          >
            <TextLink href="/" style={{
              fontSize: 24,
              fontWeight: '900',
              color: hoveredButton === 'logo' ? '#5b6cf0' : '#667eea',
              letterSpacing: -0.5,
              textDecorationLine: 'none',
              // @ts-ignore - React Native Web transition
              transition: 'color 0.2s ease-in-out'
            }}>
              devrecruit
            </TextLink>
          </Pressable>
        </View>

        {/* User Info */}
        {userProfile && (
          <View style={{
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            padding: 16,
            gap: 12
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar
                src={userProfile.avatar_url}
                name={userProfile.full_name}
                username={userProfile.username}
                size={40}
                showEditIcon={false}
                onAvatarUpdate={handleAvatarUpdate}
                userId={user?.id}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                  {userProfile.full_name}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  @{userProfile.username}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={{ gap: 4 }}>
          {SIDEBAR_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              onHoverIn={() => setHoveredButton(item.id)}
              onHoverOut={() => setHoveredButton(null)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: activeTab === item.id ? '#f1f5f9' : 
                  hoveredButton === item.id ? '#f8fafc' : 'transparent',
                borderWidth: activeTab === item.id ? 1 : 0,
                borderColor: activeTab === item.id ? '#e2e8f0' : 'transparent'
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: activeTab === item.id ? '600' : '500',
                  color: activeTab === item.id ? '#667eea' : '#374151'
                }}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Sign Out Button */}
        <View style={{ marginTop: 'auto' }}>
          <Pressable
            onPress={handleSignOut}
            disabled={isSigningOut}
            onHoverIn={() => setHoveredButton('signout')}
            onHoverOut={() => setHoveredButton(null)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: hoveredButton === 'signout' ? '#fef2f2' : 'transparent',
              borderWidth: 1,
              borderColor: hoveredButton === 'signout' ? '#fecaca' : '#e2e8f0',
              opacity: isSigningOut ? 0.6 : 1
            }}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: hoveredButton === 'signout' ? '#dc2626' : '#64748b'
            }}>
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }}>
        <View style={{
          flex: 1,
          padding: 32,
          maxWidth: 1000,
          alignSelf: 'center',
          width: '100%'
        }}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </View>
  )
} 