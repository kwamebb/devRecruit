'use client'

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native'
import { useAuth } from '../../provider/auth'
import { TextLink } from 'solito/link'
import { useAppRouter } from '../../hooks/useAppRouter'
import { supabase } from '../../lib/supabase'

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('browse-projects')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState<any>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

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
      } catch (error) {
        console.error('Unexpected error checking onboarding:', error)
        setCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user, router])

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
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

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
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
                  <View style={{
                    width: 64,
                    height: 64,
                    backgroundColor: '#667eea',
                    borderRadius: 32,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 24, color: '#ffffff', fontWeight: 'bold' }}>
                      {(isEditingProfile ? editedProfile?.full_name : userProfile.full_name)?.charAt(0) || '👤'}
                    </Text>
                  </View>
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
          <View style={{ gap: 24 }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                Settings
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                Manage your account preferences
              </Text>
            </View>

            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              gap: 20
            }}>
              <View style={{ gap: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>
                  Account Settings
                </Text>
                
                <View style={{ gap: 12 }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9'
                  }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Email Notifications
                      </Text>
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        Receive updates about your projects
                      </Text>
                    </View>
                    <View style={{
                      width: 48,
                      height: 24,
                      backgroundColor: '#667eea',
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      paddingHorizontal: 2
                    }}>
                      <View style={{
                        width: 20,
                        height: 20,
                        backgroundColor: '#ffffff',
                        borderRadius: 10
                      }} />
                    </View>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12
                  }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Profile Visibility
                      </Text>
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        Make your profile visible to others
                      </Text>
                    </View>
                    <View style={{
                      width: 48,
                      height: 24,
                      backgroundColor: '#667eea',
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      paddingHorizontal: 2
                    }}>
                      <View style={{
                        width: 20,
                        height: 20,
                        backgroundColor: '#ffffff',
                        borderRadius: 10
                      }} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
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
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#667eea',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}>
                  {userProfile.full_name?.charAt(0) || '👤'}
                </Text>
              </View>
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
            disabled={loading}
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
              borderColor: hoveredButton === 'signout' ? '#fecaca' : '#e2e8f0'
            }}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: hoveredButton === 'signout' ? '#dc2626' : '#64748b'
            }}>
              {loading ? 'Signing out...' : 'Sign Out'}
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