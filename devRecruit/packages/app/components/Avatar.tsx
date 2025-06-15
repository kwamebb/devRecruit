'use client'

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, Image } from 'react-native'
import { AvatarUploadModal } from './AvatarUploadModal'

interface AvatarProps {
  src?: string | null
  name?: string
  username?: string
  size?: number
  showEditIcon?: boolean
  onAvatarUpdate?: (newAvatarUrl: string) => void
  userId?: string
}

export function Avatar({
  src,
  name,
  username,
  size = 48,
  showEditIcon = false,
  onAvatarUpdate,
  userId
}: AvatarProps) {
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(src)

  // Update internal state when src prop changes
  useEffect(() => {
    setCurrentAvatarUrl(src)
  }, [src])

  // Generate initials from name or username
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return '?'
  }

  const handleAvatarPress = () => {
    if (showEditIcon && userId) {
      setIsUploadModalVisible(true)
    }
  }

  const handleUploadSuccess = (newAvatarUrl: string) => {
    setCurrentAvatarUrl(newAvatarUrl)
    onAvatarUpdate?.(newAvatarUrl)
  }

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden' as const
  }

  const initialsStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#667eea',
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  }

  const textStyle = {
    color: '#ffffff',
    fontSize: Math.max(size * 0.3, 12),
    fontWeight: '700' as const,
    textAlign: 'center' as const
  }

  return (
    <>
      {/* Container with extra space for edit icon */}
      <View style={{
        position: 'relative',
        width: showEditIcon && userId ? size + 16 : size,
        height: showEditIcon && userId ? size + 16 : size,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Pressable
          onPress={handleAvatarPress}
          disabled={!showEditIcon || !userId}
          style={[
            avatarStyle,
            showEditIcon && userId && {
              // @ts-ignore - React Native Web hover
              ':hover': {
                transform: [{ scale: 1.05 }],
                transition: 'transform 0.2s ease-in-out'
              }
            }
          ]}
        >
          {currentAvatarUrl ? (
            <Image
              source={{ uri: currentAvatarUrl }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={initialsStyle}>
              <Text style={textStyle}>
                {getInitials()}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Edit Icon Overlay - Outside the avatar container */}
        {showEditIcon && userId && (
          <Pressable
            onPress={handleAvatarPress}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: size * 0.3,
              height: size * 0.3,
              minWidth: 20,
              minHeight: 20,
              backgroundColor: '#667eea',
              borderRadius: (size * 0.3) / 2,
              borderWidth: 2,
              borderColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
              zIndex: 10,
              // @ts-ignore - React Native Web hover effects
              ':hover': {
                backgroundColor: '#5b6cf0',
                transform: [{ scale: 1.1 }],
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: Math.max(size * 0.15, 8),
                fontWeight: '600'
              }}
            >
              ✏️
            </Text>
          </Pressable>
        )}
      </View>

      {/* Upload Modal */}
      {userId && (
        <AvatarUploadModal
          isVisible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          onUploadSuccess={handleUploadSuccess}
          userId={userId}
          currentAvatarUrl={currentAvatarUrl || undefined}
        />
      )}
    </>
  )
} 