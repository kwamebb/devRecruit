'use client'

import React, { useState, useRef, useCallback } from 'react'
import { View, Text, Pressable, Modal } from 'react-native'
import { uploadAvatarImage, resizeImageToSquare, validateImageFile } from '../utils/imageUpload'

interface AvatarUploadModalProps {
  isVisible: boolean
  onClose: () => void
  onUploadSuccess: (avatarUrl: string) => void
  userId: string
  currentAvatarUrl?: string
}

export function AvatarUploadModal({
  isVisible,
  onClose,
  onUploadSuccess,
  userId,
  currentAvatarUrl
}: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploading(false)
    setUploadProgress(0)
    setError(null)
    setIsDragOver(false)
  }

  const handleClose = () => {
    if (!isUploading) {
      resetState()
      onClose()
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return
    }

    try {
      // Resize and crop to square
      const resizedFile = await resizeImageToSquare(file, 200)
      setSelectedFile(resizedFile)
      
      // Create preview URL
      const preview = URL.createObjectURL(resizedFile)
      setPreviewUrl(preview)
    } catch (error) {
      console.error('Error processing image:', error)
      setError('Failed to process image. Please try again.')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const result = await uploadAvatarImage(selectedFile, userId)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.url) {
        // Small delay to show 100% progress
        setTimeout(() => {
          onUploadSuccess(result.url!)
          handleClose()
        }, 500)
      } else {
        setError(result.error || 'Upload failed')
        setIsUploading(false)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRetry = () => {
    setError(null)
    if (selectedFile) {
      handleUpload()
    }
  }

  if (!isVisible) return null

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}
        onPress={handleClose}
      >
        {/* Modal Content */}
        <Pressable
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 32,
            width: '100%',
            maxWidth: 500,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 25,
            elevation: 25
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#0f172a'
            }}>
              Upload Profile Picture
            </Text>
            
            {!isUploading && (
              <Pressable
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#f1f5f9',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 18, color: '#64748b' }}>×</Text>
              </Pressable>
            )}
          </View>

          {/* Upload Area */}
          {!selectedFile && (
            <View
              // @ts-ignore - React Native Web drag events
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                borderWidth: 2,
                borderColor: isDragOver ? '#667eea' : '#e2e8f0',
                borderStyle: 'dashed',
                borderRadius: 16,
                padding: 40,
                alignItems: 'center',
                gap: 16,
                backgroundColor: isDragOver ? '#f8fafc' : '#fafbfc',
                marginBottom: 24
              }}
            >
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#f1f5f9',
                borderRadius: 32,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 24 }}>📷</Text>
              </View>
              
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center'
                }}>
                  Drag & drop your photo here
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#64748b',
                  textAlign: 'center'
                }}>
                  or click to browse files
                </Text>
              </View>

              <Pressable
                onPress={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: '#667eea',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: 14
                }}>
                  Choose File
                </Text>
              </Pressable>

              <Text style={{
                fontSize: 12,
                color: '#94a3b8',
                textAlign: 'center'
              }}>
                JPG or PNG • Max 5MB • Will be cropped to square
              </Text>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </View>
          )}

          {/* Preview */}
          {selectedFile && previewUrl && (
            <View style={{
              alignItems: 'center',
              gap: 20,
              marginBottom: 24
            }}>
              <View style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                overflow: 'hidden',
                borderWidth: 4,
                borderColor: '#e2e8f0'
              }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </View>
              
              <Text style={{
                fontSize: 14,
                color: '#64748b',
                textAlign: 'center'
              }}>
                Preview of your new profile picture
              </Text>

              {!isUploading && (
                <Pressable
                  onPress={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: '#f1f5f9'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Choose Different Photo
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <View style={{
              marginBottom: 24,
              gap: 12
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Uploading...
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#667eea'
                }}>
                  {uploadProgress}%
                </Text>
              </View>
              
              <View style={{
                height: 8,
                backgroundColor: '#f1f5f9',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  backgroundColor: '#667eea',
                  width: `${uploadProgress}%`,
                  borderRadius: 4,
                  // @ts-ignore - React Native Web transition
                  transition: 'width 0.3s ease-in-out'
                }} />
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={{
              backgroundColor: '#fef2f2',
              borderWidth: 1,
              borderColor: '#fecaca',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24
            }}>
              <Text style={{
                fontSize: 14,
                color: '#dc2626',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                {error}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: 12
          }}>
            {!isUploading && (
              <Pressable
                onPress={handleClose}
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  borderRadius: 12,
                  paddingVertical: 14,
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
            )}

            {error ? (
              <Pressable
                onPress={handleRetry}
                style={{
                  flex: 1,
                  backgroundColor: '#667eea',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#ffffff'
                }}>
                  Try Again
                </Text>
              </Pressable>
            ) : selectedFile && !isUploading ? (
              <Pressable
                onPress={handleUpload}
                style={{
                  flex: 1,
                  backgroundColor: '#667eea',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#ffffff'
                }}>
                  Upload Photo
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
} 