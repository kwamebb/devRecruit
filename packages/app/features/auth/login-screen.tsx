'use client'

import React, { useState } from 'react'
import { View, Text, Pressable, Alert, ScrollView } from 'react-native'
import { useAuth } from '../../provider/auth'
import { TextLink } from 'solito/link'
import '../../lib/supabase-debug'
import '../../lib/supabase-test'
import '../../lib/auth-diagnostics'

export function LoginScreen() {
  const { signInWithGitHub, loading } = useAuth()
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGitHubLogin = async () => {
    try {
      setError(null)
      console.log('🚀 Starting GitHub login...')
      await signInWithGitHub()
      console.log('✅ GitHub login initiated successfully')
    } catch (error) {
      console.error('❌ Login error:', error)
      setError(`Failed to sign in with GitHub: ${error.message}`)
      Alert.alert('Error', `Failed to sign in with GitHub: ${error.message}`)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      {/* Navigation Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 48,
        paddingVertical: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2
      }}>
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
            fontSize: 28,
            fontWeight: '900',
            color: hoveredButton === 'logo' ? '#5b6cf0' : '#667eea',
            letterSpacing: -1,
            textDecorationLine: 'none',
            // @ts-ignore - React Native Web transition
            transition: 'color 0.2s ease-in-out'
          }}>
            devrecruit
          </TextLink>
        </Pressable>

        <Pressable
          onHoverIn={() => setHoveredButton('back')}
          onHoverOut={() => setHoveredButton(null)}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: hoveredButton === 'back' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
            // @ts-ignore - React Native Web transitions
            transition: 'all 0.2s ease-in-out',
            transform: [{ scale: hoveredButton === 'back' ? 1.02 : 1 }]
          }}
        >
          <TextLink href="/" style={{
            color: hoveredButton === 'back' ? '#374151' : '#64748b',
            fontSize: 15,
            fontWeight: '600',
            textDecorationLine: 'none',
            // @ts-ignore - React Native Web transition
            transition: 'color 0.2s ease-in-out'
          }}>
            ← Back to Home
          </TextLink>
        </Pressable>
      </View>

      {/* Main Login Content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 80,
        minHeight: 600
      }}>
        <View style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 24,
          padding: 48,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.06)'
        }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '800',
              color: '#0f172a',
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -0.8
            }}>
              Welcome to{' '}
              <Text style={{
                // @ts-ignore - React Native Web gradient text
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                // @ts-ignore - React Native Web gradient text
                WebkitBackgroundClip: 'text',
                // @ts-ignore - React Native Web gradient text
                WebkitTextFillColor: 'transparent',
                // @ts-ignore - React Native Web gradient text
                backgroundClip: 'text'
              }}>
                DevRecruit
              </Text>
            </Text>

            <Text style={{
              fontSize: 16,
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 24,
              fontWeight: '500',
              maxWidth: 360
            }}>
              Connect with skilled developers for collaborations, code reviews, and project partnerships
            </Text>
          </View>

          {/* GitHub Login Button */}
          <Pressable
            onPress={handleGitHubLogin}
            disabled={loading}
            onHoverIn={() => setHoveredButton('github')}
            onHoverOut={() => setHoveredButton(null)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hoveredButton === 'github' ? '#1a1a1a' : '#24292e',
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 14,
              gap: 12,
              opacity: loading ? 0.7 : 1,
              shadowColor: '#24292e',
              shadowOffset: { width: 0, height: hoveredButton === 'github' ? 8 : 4 },
              shadowOpacity: hoveredButton === 'github' ? 0.3 : 0.2,
              shadowRadius: hoveredButton === 'github' ? 16 : 12,
              elevation: hoveredButton === 'github' ? 6 : 4,
              // @ts-ignore - React Native Web transitions
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: [
                { scale: hoveredButton === 'github' ? 1.02 : 1 },
                { translateY: hoveredButton === 'github' ? -2 : 0 }
              ]
            }}
          >
            {/* GitHub Icon */}
            <View style={{
              width: 20,
              height: 20,
              backgroundColor: '#ffffff',
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 12, color: '#24292e' }}>🐙</Text>
            </View>

            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: 0.3
            }}>
              {loading ? 'Signing in...' : 'Continue with GitHub'}
            </Text>
          </Pressable>

          {/* Error Display */}
          {error && (
            <View style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#fef2f2',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#fecaca'
            }}>
              <Text style={{
                color: '#dc2626',
                fontSize: 14,
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {error}
              </Text>
            </View>
          )}

          {/* Features List */}
          <View style={{ marginTop: 40 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Join 2,400+ developers already collaborating
            </Text>

            <View style={{ gap: 12 }}>
              {[
                { icon: '🤝', text: 'Find collaboration partners' },
                { icon: '🔍', text: 'Get expert code reviews' },
                { icon: '🚀', text: 'Build amazing projects together' },
                { icon: '💡', text: 'Share knowledge and learn' }
              ].map((feature, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 8
                }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 14 }}>{feature.icon}</Text>
                  </View>
                  <Text style={{
                    fontSize: 14,
                    color: '#64748b',
                    fontWeight: '500',
                    flex: 1
                  }}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={{
            marginTop: 32,
            paddingTop: 24,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0, 0, 0, 0.06)'
          }}>
            <Text style={{
              fontSize: 12,
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: 18
            }}>
              By continuing, you agree to our{' '}
              <TextLink href="/terms" style={{
                color: '#667eea',
                textDecorationLine: 'none',
                fontWeight: '600'
              }}>
                Terms of Service
              </TextLink>
              {' '}and{' '}
              <TextLink href="/privacy" style={{
                color: '#667eea',
                textDecorationLine: 'none',
                fontWeight: '600'
              }}>
                Privacy Policy
              </TextLink>
            </Text>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={{
          marginTop: 40,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 14,
            color: '#64748b',
            textAlign: 'center'
          }}>
            New to DevRecruit?{' '}
            <TextLink href="/" style={{
              color: '#667eea',
              fontWeight: '600',
              textDecorationLine: 'none'
            }}>
              Learn more about our platform
            </TextLink>
          </Text>
        </View>
      </View>
    </ScrollView>
  )
} 