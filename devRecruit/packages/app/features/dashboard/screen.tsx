'use client'

import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useAuth } from '../../provider/auth'
import { TextLink } from 'solito/link'

export function DashboardScreen() {
  const { user, signOut, loading } = useAuth()
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
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

        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          {user && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderRadius: 12
            }}>
              {user.user_metadata?.avatar_url && (
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#667eea',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 12, color: '#ffffff' }}>
                    {user.user_metadata?.full_name?.charAt(0) || '👤'}
                  </Text>
                </View>
              )}
              <Text style={{
                color: '#667eea',
                fontSize: 14,
                fontWeight: '600'
              }}>
                {user.user_metadata?.full_name || user.email}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSignOut}
            disabled={loading}
            onHoverIn={() => setHoveredButton('signout')}
            onHoverOut={() => setHoveredButton(null)}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: hoveredButton === 'signout' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              borderWidth: 1,
              borderColor: hoveredButton === 'signout' ? '#ef4444' : '#e2e8f0',
              // @ts-ignore - React Native Web transitions
              transition: 'all 0.2s ease-in-out',
              transform: [{ scale: hoveredButton === 'signout' ? 1.02 : 1 }]
            }}
          >
            <Text style={{
              color: hoveredButton === 'signout' ? '#ef4444' : '#64748b',
              fontSize: 15,
              fontWeight: '600',
              // @ts-ignore - React Native Web transition
              transition: 'color 0.2s ease-in-out'
            }}>
              {loading ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Dashboard Content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 80,
        minHeight: 600
      }}>
        <View style={{
          maxWidth: 600,
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
          borderColor: 'rgba(0, 0, 0, 0.06)',
          alignItems: 'center',
          gap: 32
        }}>
          {/* Welcome Message */}
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: '#0f172a',
              textAlign: 'center',
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
              fontSize: 18,
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 28,
              fontWeight: '500'
            }}>
              🎉 You're successfully signed in! Your dashboard is coming soon.
            </Text>
          </View>

          {/* User Info Card */}
          {user && (
            <View style={{
              width: '100%',
              backgroundColor: '#f8fafc',
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.06)'
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#374151',
                marginBottom: 16
              }}>
                Your Profile
              </Text>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#64748b', fontWeight: '500' }}>Name:</Text>
                  <Text style={{ color: '#374151', fontWeight: '600' }}>
                    {user.user_metadata?.full_name || 'Not provided'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#64748b', fontWeight: '500' }}>Email:</Text>
                  <Text style={{ color: '#374151', fontWeight: '600' }}>
                    {user.email}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#64748b', fontWeight: '500' }}>GitHub:</Text>
                  <Text style={{ color: '#374151', fontWeight: '600' }}>
                    @{user.user_metadata?.user_name || 'Not connected'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Coming Soon Features */}
          <View style={{ width: '100%', gap: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#374151',
              textAlign: 'center'
            }}>
              Coming Soon
            </Text>

            <View style={{ gap: 12 }}>
              {[
                '📊 Project Dashboard',
                '🤝 Collaboration Hub',
                '💼 Profile Management',
                '🔍 Developer Search',
                '📝 Project Listings'
              ].map((feature, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: 8
                }}>
                  <Text style={{ fontSize: 16 }}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Back to Home */}
          <Pressable
            onHoverIn={() => setHoveredButton('home')}
            onHoverOut={() => setHoveredButton(null)}
            style={{
              // @ts-ignore - React Native Web gradient background
              background: hoveredButton === 'home' ? 'linear-gradient(135deg, #5b6cf0 0%, #6366f1 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 12,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: hoveredButton === 'home' ? 8 : 4 },
              shadowOpacity: hoveredButton === 'home' ? 0.3 : 0.2,
              shadowRadius: hoveredButton === 'home' ? 16 : 12,
              elevation: hoveredButton === 'home' ? 6 : 4,
              // @ts-ignore - React Native Web transitions
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: [
                { scale: hoveredButton === 'home' ? 1.05 : 1 },
                { translateY: hoveredButton === 'home' ? -2 : 0 }
              ]
            }}
          >
            <TextLink href="/" style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '700',
              textDecorationLine: 'none',
              letterSpacing: 0.3
            }}>
              ← Back to Home
            </TextLink>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
} 