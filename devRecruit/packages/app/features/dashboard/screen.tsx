'use client'

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native'
import { useAuth } from '../../provider/auth'
import { TextLink } from 'solito/link'
import { useAppRouter } from '../../hooks/useAppRouter'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/Avatar'
import { usePrivacyControls, PrivacySettings } from '../../utils/privacyControls'

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

  // Authentication guard - redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔒 User not authenticated, redirecting to home...')
      router.push('/')
      return
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
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error checking onboarding status:', error)
          setCheckingOnboarding(false)
          return
        }

        if (!profile?.onboarding_completed) {
          console.log('User has not completed onboarding, redirecting...')
          router.push('/onboarding')
          return
        }

        setUserProfile(profile)
        setCheckingOnboarding(false)
        
        // Load privacy settings
        loadPrivacySettings()
      } catch (error) {
        console.error('Unexpected error checking onboarding:', error)
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
      console.error('Error loading privacy settings:', error)
    } finally {
      setIsLoadingPrivacy(false)
    }
  }

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

    // Validate age
    const age = parseInt(editedProfile.age)
    if (!age || age < 13) {
      console.error('Age must be 13 or above')
      // You could add a toast notification here
      return
    }

    // Validate required fields
    if (!editedProfile.username || !editedProfile.full_name || !editedProfile.education_status) {
      console.error('Please fill in all required fields')
      return
    }

    if (!editedProfile.coding_languages || editedProfile.coding_languages.length === 0) {
      console.error('Please select at least one coding language')
      return
    }

    setIsSavingProfile(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedProfile.username,
          full_name: editedProfile.full_name,
          age: age,
          education_status: editedProfile.education_status,
          coding_languages: editedProfile.coding_languages,
          avatar_url: editedProfile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        // You could add a toast notification here
        return
      }

      // Update local state
      setUserProfile(editedProfile)
      setIsEditingProfile(false)
      setEditedProfile(null)
      console.log('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Unexpected error updating profile:', error)
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
    
    const age = parseInt(editedProfile.age)
    return (
      editedProfile.username &&
      editedProfile.full_name &&
      age >= 13 &&
      editedProfile.education_status &&
      editedProfile.coding_languages &&
      editedProfile.coding_languages.length > 0
    )
  }

  // Privacy control handlers
  const handlePrivacySettingChange = async (setting: keyof PrivacySettings, value: any) => {
    if (!user || !privacySettings) return
    
    const updatedSettings = { ...privacySettings, [setting]: value }
    setPrivacySettings(updatedSettings)
    
    // Save to database
    setIsSavingPrivacy(true)
    try {
      const result = await privacyControls.updatePrivacySettings(user.id, { [setting]: value })
      if (!result.success) {
        // Revert on error
        setPrivacySettings(privacySettings)
        Alert.alert('Error', result.error || 'Failed to update privacy settings')
      }
    } catch (error) {
      // Revert on error
      setPrivacySettings(privacySettings)
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
                        <TextInput
                          style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: '#0f172a',
                            borderWidth: 2,
                            borderColor: '#667eea',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: '#f8fafc'
                          }}
                          value={editedProfile?.full_name || ''}
                          onChangeText={(text) => setEditedProfile({...editedProfile, full_name: text})}
                          placeholder="Full Name"
                        />
                        <TextInput
                          style={{
                            fontSize: 14,
                            color: '#64748b',
                            borderWidth: 2,
                            borderColor: '#e2e8f0',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#ffffff'
                          }}
                          value={editedProfile?.username || ''}
                          onChangeText={(text) => setEditedProfile({...editedProfile, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                          placeholder="username"
                        />
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
                               borderColor: editedProfile?.age && parseInt(editedProfile.age) < 13 ? '#ef4444' : '#e2e8f0',
                               borderRadius: 8,
                               paddingHorizontal: 12,
                               paddingVertical: 8,
                               backgroundColor: '#ffffff'
                             }}
                             value={editedProfile?.age?.toString() || ''}
                             onChangeText={(text) => setEditedProfile({...editedProfile, age: text.replace(/[^0-9]/g, '')})}
                             placeholder="Age"
                             keyboardType="numeric"
                           />
                           {editedProfile?.age && parseInt(editedProfile.age) < 13 && (
                             <Text style={{
                               fontSize: 12,
                               color: '#ef4444',
                               marginTop: 4,
                               fontWeight: '500'
                             }}>
                               Must be 13 or older
                             </Text>
                           )}
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
                              onPress={() => setEditedProfile({...editedProfile, education_status: option.value})}
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
                              onPress={() => handleLanguageToggle(language)}
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
                        
                        {editedProfile?.coding_languages?.length > 0 && (
                          <View style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: 8,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#e2e8f0'
                          }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                              Selected ({editedProfile.coding_languages.length}):
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>
                              {editedProfile.coding_languages.join(', ')}
                            </Text>
                          </View>
                        )}
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