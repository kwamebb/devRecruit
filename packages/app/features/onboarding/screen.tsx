'use client'

import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native'
import { useAuth } from '../../provider/auth'
import { supabase } from '../../lib/supabase'
import { useAppRouter } from '../../hooks/useAppRouter'
import {
  validateFullName,
  validateUsername,
  validateAge,
  validateEducationStatus,
  validateCodingLanguages,
  formatFullName,
  formatUsername,
  getCharacterCountInfo
} from '../../utils/profileValidation'

interface OnboardingData {
  username: string
  fullName: string
  age: string
  educationStatus: 'highschool' | 'college' | 'professional' | 'not_in_school' | ''
  codingLanguages: string[]
}

const CODING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'HTML/CSS', 'SQL', 'R',
  'Scala', 'Perl', 'Haskell', 'Lua', 'Assembly', 'MATLAB', 'Shell/Bash'
]

const EDUCATION_OPTIONS = [
  { value: 'highschool', label: 'High School', icon: '🎓', description: 'Currently in high school' },
  { value: 'college', label: 'College/University', icon: '🏫', description: 'Currently in college or university' },
  { value: 'professional', label: 'Working Professional', icon: '💼', description: 'Working in the industry' },
  { value: 'not_in_school', label: 'Self-Learning', icon: '📚', description: 'Learning independently' }
]

export function OnboardingScreen() {
  const { user } = useAuth()
  const router = useAppRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<OnboardingData>({
    username: '',
    fullName: '',
    age: '',
    educationStatus: '',
    codingLanguages: []
  })

  // Validation state for real-time feedback
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Real-time field validation
  const validateField = (fieldName: string, value: any) => {
    let validation
    
    switch (fieldName) {
      case 'fullName':
        validation = validateFullName(value || '')
        break
      case 'username':
        validation = validateUsername(value || '')
        break
      case 'age':
        validation = validateAge(value || '')
        break
      case 'educationStatus':
        validation = validateEducationStatus(value || '')
        break
      case 'codingLanguages':
        // For onboarding, be more lenient - just check minimum requirement
        const languages = value || []
        if (languages.length === 0) {
          validation = { isValid: false, error: "Please select at least one coding language" }
        } else {
          validation = { isValid: true }
        }
        break
      default:
        return
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error || ''
    }))
  }

  const handleLanguageToggle = (language: string) => {
    const newLanguages = formData.codingLanguages.includes(language)
      ? formData.codingLanguages.filter(lang => lang !== language)
      : [...formData.codingLanguages, language]
      
    setFormData(prev => ({
      ...prev,
      codingLanguages: newLanguages
    }))
    
    // Validate after selection
    validateField('codingLanguages', newLanguages)
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 Starting handleSubmit...')
    
    if (!user) {
      console.error('❌ No user found')
      Alert.alert('Error', 'User not found. Please try logging in again.')
      return
    }

    console.log('✅ User found:', user.id)

    // Comprehensive validation using our validation utility
    const fullNameValid = validateFullName(formData.fullName || '')
    const usernameValid = validateUsername(formData.username || '')
    const ageValid = validateAge(formData.age || '')
    const educationValid = validateEducationStatus(formData.educationStatus || '')
    
    // For onboarding, be more lenient with languages - just check minimum
    const hasLanguages = formData.codingLanguages && formData.codingLanguages.length > 0
    
    console.log('🔍 Validation results:', {
      fullNameValid: fullNameValid.isValid,
      usernameValid: usernameValid.isValid,
      ageValid: ageValid.isValid,
      educationValid: educationValid.isValid,
      hasLanguages
    })
    
    // Collect all validation errors
    const errors = []
    if (!fullNameValid.isValid) errors.push(`Full Name: ${fullNameValid.error}`)
    if (!usernameValid.isValid) errors.push(`Username: ${usernameValid.error}`)
    if (!ageValid.isValid) errors.push(`Age: ${ageValid.error}`)
    if (!educationValid.isValid) errors.push(`Education: ${educationValid.error}`)
    if (!hasLanguages) errors.push(`Languages: Please select at least one coding language`)
    
    if (errors.length > 0) {
      console.error('❌ Profile validation failed:', errors)
      Alert.alert(
        'Profile Validation Failed',
        errors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    console.log('✅ All validation passed, starting database update...')
    setIsLoading(true)

    try {
      // Format data before saving
      const formattedData = {
        username: formatUsername(formData.username || ''),
        full_name: formatFullName(formData.fullName || ''),
        age: parseInt(formData.age || '0'),
        education_status: formData.educationStatus,
        coding_languages: formData.codingLanguages.slice(0, 15), // Limit to 15 for database
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }

      console.log('📝 Formatted data for database:', formattedData)

      const { error } = await supabase
        .from('profiles')
        .update(formattedData)
        .eq('id', user.id)

      if (error) {
        console.error('❌ Onboarding update error:', error)
        Alert.alert(
          'Update Failed',
          error.message || 'Failed to save your information. Please try again.',
          [{ text: 'OK', style: 'default' }]
        )
        return
      }

      console.log('✅ Database update successful!')

      // Fetch GitHub stats if user has GitHub username
      if (user.user_metadata?.user_name || user.user_metadata?.login) {
        console.log('🔄 Fetching initial GitHub stats...')
        try {
          const { updateUserGitHubStats } = await import('../../utils/githubStats')
          const githubUsername = user.user_metadata?.user_name || user.user_metadata?.login
          
          const statsResult = await updateUserGitHubStats(user.id, githubUsername)
          if (statsResult.success) {
            console.log('✅ GitHub stats fetched successfully:', statsResult.stats)
          } else {
            console.log('⚠️ GitHub stats fetch failed:', statsResult.error)
          }
        } catch (error) {
          console.log('⚠️ GitHub stats fetch error:', error)
        }
      }

      // Clear validation errors
      setValidationErrors({})
      
      // Check if we had to trim languages
      const languageMessage = formData.codingLanguages.length > 15 
        ? `Your profile has been set up successfully! We've saved your top 15 programming languages - you can update this anytime in your dashboard.`
        : 'Your profile has been set up successfully. Let\'s get started!'
      
      console.log('🎉 Showing success alert...')
      Alert.alert(
        'Welcome to DevRecruit! 🎉',
        languageMessage,
        [{ 
          text: 'Let\'s Go!', 
          style: 'default',
          onPress: () => {
            console.log('🚀 Navigating to dashboard...')
            router.push('/dashboard')
          }
        }]
      )
      
      // Navigate automatically after a very short delay
      setTimeout(() => {
        console.log('🔄 Auto-navigating to dashboard...')
        router.push('/dashboard')
      }, 500)
      
      console.log('✅ Onboarding completed successfully!')
    } catch (error) {
      console.error('Unexpected error:', error)
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', style: 'default' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        const fullNameValid = validateFullName(formData.fullName || '')
        const usernameValid = validateUsername(formData.username || '')
        return fullNameValid.isValid && usernameValid.isValid
      case 2:
        const ageValid = validateAge(formData.age || '')
        return ageValid.isValid
      case 3:
        const educationValid = validateEducationStatus(formData.educationStatus || '')
        return educationValid.isValid
      case 4:
        // For onboarding, just check if at least 1 language is selected
        // We'll allow more than 15 for now and fix it later in dashboard
        return formData.codingLanguages && formData.codingLanguages.length > 0
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={{ gap: 24 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                Welcome to DevRecruit! 👋
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 }}>
                Let's set up your developer profile
              </Text>
            </View>

            <View style={{ gap: 20 }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                    Username *
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: (() => {
                      const len = formData.username?.length || 0
                      if (len > 22) return '#ef4444'
                      if (len >= 18) return '#f59e0b'
                      return '#64748b'
                    })()
                  }}>
                    {formData.username?.length || 0}/22
                  </Text>
                </View>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: (() => {
                      if (validationErrors.username) return '#ef4444'
                      if (formData.username && validateUsername(formData.username).isValid) return '#10b981'
                      return '#e2e8f0'
                    })(),
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="Choose a unique username (3-22 characters)"
                  value={formData.username}
                  onChangeText={(text) => {
                    const formatted = formatUsername(text)
                    setFormData(prev => ({ ...prev, username: formatted }))
                    validateField('username', formatted)
                  }}
                  maxLength={22}
                />
                {validationErrors.username ? (
                  <Text style={{
                    fontSize: 12,
                    color: '#ef4444',
                    fontWeight: '500'
                  }}>
                    {validationErrors.username}
                  </Text>
                ) : formData.username && validateUsername(formData.username).isValid ? (
                  <Text style={{
                    fontSize: 12,
                    color: '#10b981',
                    fontWeight: '500'
                  }}>
                    ✓ Username looks great!
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    This will be your public username on DevRecruit
                  </Text>
                )}
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                  Full Name *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: (() => {
                      if (validationErrors.fullName) return '#ef4444'
                      if (formData.fullName && validateFullName(formData.fullName).isValid) return '#10b981'
                      return '#e2e8f0'
                    })(),
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="Enter your first and last name"
                  value={formData.fullName}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, fullName: text }))
                    validateField('fullName', text)
                  }}
                  maxLength={50}
                />
                {validationErrors.fullName ? (
                  <Text style={{
                    fontSize: 12,
                    color: '#ef4444',
                    fontWeight: '500'
                  }}>
                    {validationErrors.fullName}
                  </Text>
                ) : formData.fullName && validateFullName(formData.fullName).isValid ? (
                  <Text style={{
                    fontSize: 12,
                    color: '#10b981',
                    fontWeight: '500'
                  }}>
                    ✓ Name looks perfect!
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    Please enter your first and last name
                  </Text>
                )}
              </View>
            </View>
          </View>
        )

      case 2:
        return (
          <View style={{ gap: 24 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                Tell us about yourself 🎂
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 }}>
                This helps us connect you with the right opportunities
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                Age *
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: (() => {
                    if (validationErrors.age) return '#ef4444'
                    if (formData.age && validateAge(formData.age).isValid) return '#10b981'
                    return '#e2e8f0'
                  })(),
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  backgroundColor: '#ffffff'
                }}
                placeholder="Enter your age (13+)"
                value={formData.age}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '')
                  setFormData(prev => ({ ...prev, age: numericText }))
                  validateField('age', numericText)
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              {validationErrors.age ? (
                <Text style={{
                  fontSize: 12,
                  color: '#ef4444',
                  fontWeight: '500'
                }}>
                  {validationErrors.age}
                </Text>
              ) : formData.age && validateAge(formData.age).isValid ? (
                <Text style={{
                  fontSize: 12,
                  color: '#10b981',
                  fontWeight: '500'
                }}>
                  ✓ Age verified
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  Must be 13 or older to use DevRecruit
                </Text>
              )}
            </View>
          </View>
        )

      case 3:
        return (
          <View style={{ gap: 24 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                What's your current status? 📚
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 }}>
                This helps us understand your experience level
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              {EDUCATION_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, educationStatus: option.value as any }))
                    validateField('educationStatus', option.value)
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: formData.educationStatus === option.value ? '#667eea' : '#e2e8f0',
                    backgroundColor: formData.educationStatus === option.value ? '#f8fafc' : '#ffffff',
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    backgroundColor: formData.educationStatus === option.value ? '#667eea' : '#f8fafc',
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 20 }}>{option.icon}</Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: formData.educationStatus === option.value ? '#667eea' : '#0f172a',
                      marginBottom: 4
                    }}>
                      {option.label}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#64748b'
                    }}>
                      {option.description}
                    </Text>
                  </View>

                  {formData.educationStatus === option.value ? (
                    <View style={{
                      width: 24,
                      height: 24,
                      backgroundColor: '#667eea',
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
              
              {validationErrors.educationStatus ? (
                <Text style={{
                  fontSize: 12,
                  color: '#ef4444',
                  fontWeight: '500',
                  textAlign: 'center',
                  marginTop: 8
                }}>
                  {validationErrors.educationStatus}
                </Text>
              ) : null}
            </View>
          </View>
        )

      case 4:
        return (
          <View style={{ gap: 24 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                What languages do you code in? 💻
              </Text>
              <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 }}>
                Select all that apply (you can always update this later)
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center'
            }}>
              {CODING_LANGUAGES.map((language) => (
                <Pressable
                  key={language}
                  onPress={() => handleLanguageToggle(language)}
                  style={{
                    borderWidth: 2,
                    borderColor: formData.codingLanguages.includes(language) ? '#667eea' : '#e2e8f0',
                    backgroundColor: formData.codingLanguages.includes(language) ? '#667eea' : '#ffffff',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: formData.codingLanguages.includes(language) ? '#ffffff' : '#64748b'
                  }}>
                    {language}
                  </Text>
                </Pressable>
              ))}
            </View>

            {validationErrors.codingLanguages ? (
              <Text style={{
                fontSize: 12,
                color: '#ef4444',
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 8
              }}>
                {validationErrors.codingLanguages}
              </Text>
            ) : null}

            {formData.codingLanguages.length > 0 ? (
              <View style={{
                backgroundColor: formData.codingLanguages.length > 15 ? '#fef2f2' : '#f8fafc',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: formData.codingLanguages.length > 15 ? '#fecaca' : '#e2e8f0'
              }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: formData.codingLanguages.length > 15 ? '#dc2626' : '#374151', 
                  marginBottom: 8 
                }}>
                  Selected ({formData.codingLanguages.length}/15):
                </Text>
                <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                  {formData.codingLanguages.join(', ')}
                </Text>
                {formData.codingLanguages.length > 15 ? (
                  <Text style={{
                    fontSize: 12,
                    color: '#dc2626',
                    fontWeight: '500'
                  }}>
                    Please select no more than 15 languages to keep your profile focused
                  </Text>
                ) : formData.codingLanguages.length >= 1 ? (
                  <Text style={{
                    fontSize: 12,
                    color: '#10b981',
                    fontWeight: '500'
                  }}>
                    ✓ Great selection!
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )

      default:
        return null
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      <View style={{
        minHeight: '100vh',
        paddingHorizontal: 24,
        paddingVertical: 40,
        justifyContent: 'center'
      }}>
        <View style={{
          maxWidth: 600,
          alignSelf: 'center',
          width: '100%'
        }}>
          {/* Progress Bar */}
          <View style={{
            flexDirection: 'row',
            gap: 8,
            marginBottom: 40,
            justifyContent: 'center'
          }}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: step <= currentStep ? '#667eea' : '#e2e8f0',
                  borderRadius: 2,
                  maxWidth: 60
                }}
              />
            ))}
          </View>

          {/* Step Content */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 24,
            elevation: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}>
            {renderStep()}

            {/* Navigation Buttons */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 32,
              gap: 16
            }}>
              {currentStep > 1 ? (
                <Pressable
                  onPress={handleBack}
                  onHoverIn={() => setHoveredButton('back')}
                  onHoverOut={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    backgroundColor: hoveredButton === 'back' ? '#f8fafc' : '#ffffff',
                    borderWidth: 2,
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#64748b'
                  }}>
                    Back
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push('/')}
                  onHoverIn={() => setHoveredButton('home')}
                  onHoverOut={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    backgroundColor: hoveredButton === 'home' ? '#f8fafc' : '#ffffff',
                    borderWidth: 2,
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#64748b'
                  }}>
                    Home
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={currentStep === 4 ? handleSubmit : handleNext}
                disabled={!isStepValid() || isLoading}
                onHoverIn={() => setHoveredButton('next')}
                onHoverOut={() => setHoveredButton(null)}
                style={{
                  flex: 1,
                  backgroundColor: isStepValid() && !isLoading ? 
                    (hoveredButton === 'next' ? '#5b6cf0' : '#667eea') : '#94a3b8',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#ffffff'
                }}>
                  {isLoading ? 'Saving...' : currentStep === 4 ? 'Complete Setup' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Step Indicator */}
          <Text style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 14,
            color: '#64748b',
            fontWeight: '500'
          }}>
            Step {currentStep} of 4
          </Text>
        </View>
      </View>
    </ScrollView>
  )
} 