'use client'

import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native'
import { useAuth } from '../../provider/auth'
import { supabase } from '../../lib/supabase'
import { useAppRouter } from '../../hooks/useAppRouter'

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

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      codingLanguages: prev.codingLanguages.includes(language)
        ? prev.codingLanguages.filter(lang => lang !== language)
        : [...prev.codingLanguages, language]
    }))
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
    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.')
      return
    }

    if (!formData.username || !formData.fullName || !formData.age || !formData.educationStatus) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }

    if (formData.codingLanguages.length === 0) {
      Alert.alert('Error', 'Please select at least one coding language.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.fullName,
          age: parseInt(formData.age),
          education_status: formData.educationStatus,
          coding_languages: formData.codingLanguages,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Onboarding update error:', error)
        Alert.alert('Error', 'Failed to save your information. Please try again.')
        return
      }

      console.log('✅ Onboarding completed successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Unexpected error:', error)
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.username.length >= 3 && formData.fullName.length >= 2
      case 2:
        return formData.age && parseInt(formData.age) >= 13 && parseInt(formData.age) <= 100
      case 3:
        return formData.educationStatus !== ''
      case 4:
        return formData.codingLanguages.length > 0
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
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                  Username *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: formData.username ? '#667eea' : '#e2e8f0',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  maxLength={20}
                />
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  This will be your public username on DevRecruit
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                  Full Name *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: formData.fullName ? '#667eea' : '#e2e8f0',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                  maxLength={50}
                />
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
                  borderColor: formData.age ? '#667eea' : '#e2e8f0',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  backgroundColor: '#ffffff'
                }}
                placeholder="Enter your age"
                value={formData.age}
                onChangeText={(text) => setFormData(prev => ({ ...prev, age: text.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                Must be 13 or older to use DevRecruit
              </Text>
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
                  onPress={() => setFormData(prev => ({ ...prev, educationStatus: option.value as any }))}
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

                  {formData.educationStatus === option.value && (
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
                  )}
                </Pressable>
              ))}
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

            {formData.codingLanguages.length > 0 && (
              <View style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0'
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Selected ({formData.codingLanguages.length}):
                </Text>
                <Text style={{ fontSize: 14, color: '#64748b' }}>
                  {formData.codingLanguages.join(', ')}
                </Text>
              </View>
            )}
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
              ) : <View style={{ flex: 1 }} />}

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