import { supabase } from '../lib/supabase'

export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface ImageValidationResult {
  isValid: boolean
  error?: string
}

// Validate image file
export const validateImageFile = (file: File): ImageValidationResult => {
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB'
    }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPG and PNG files are allowed'
    }
  }

  // Check for executable content in filename
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
  const fileName = file.name.toLowerCase()
  if (dangerousExtensions.some(ext => fileName.includes(ext))) {
    return {
      isValid: false,
      error: 'Invalid file type detected'
    }
  }

  return { isValid: true }
}

// Generate unique filename
export const generateAvatarFilename = (userId: string, fileExtension: string): string => {
  const timestamp = Date.now()
  const cleanExtension = fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`
  return `${userId}_${timestamp}${cleanExtension}`
}

// Upload image to Supabase Storage
export const uploadAvatarImage = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResult> => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return {
        success: false,
        error: 'Please log in to upload a profile picture.'
      }
    }
    
    if (user.id !== userId) {
      return {
        success: false,
        error: 'You can only upload your own profile picture.'
      }
    }

    // Validate file first
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Generate filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = generateAvatarFilename(userId, fileExtension)

    // Delete old avatar if exists
    await deleteOldAvatar(userId)

    // Upload file
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      // Log technical details to console for debugging
      console.error('Upload error:', error)
      
      // Provide user-friendly error messages based on common issues
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        return {
          success: false,
          error: 'Storage not configured. Please contact support.'
        }
      } else if (error.message?.includes('size') || error.statusCode === 413) {
        return {
          success: false,
          error: 'File too large. Please use an image under 5MB.'
        }
      } else if (error.statusCode === 400) {
        return {
          success: false,
          error: 'Invalid file format. Please use JPG or PNG.'
        }
      } else if (error.statusCode === 401) {
        return {
          success: false,
          error: 'Please log in again to upload your profile picture.'
        }
      } else if (error.statusCode === 403 || error.message?.includes('policy') || error.message?.includes('permission')) {
        return {
          success: false,
          error: 'Permission denied. Please try logging in again.'
        }
      } else {
        // Generic error for any other technical issues
        return {
          success: false,
          error: 'Upload failed. Please try again.'
        }
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filename)

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to get image URL'
      }
    }

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

// Delete old avatar files for a user
export const deleteOldAvatar = async (userId: string): Promise<void> => {
  try {
    // List all files for this user
    const { data: files, error } = await supabase.storage
      .from('profile-pictures')
      .list('', {
        search: userId
      })

    if (error || !files) {
      // Silently fail - this is not critical for the upload process
      return
    }

    // Filter files that match our naming pattern
    const userFiles = files.filter(file => 
      file.name.startsWith(`${userId}_`) && 
      (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png'))
    )

    if (userFiles.length > 0) {
      const filesToDelete = userFiles.map(file => file.name)
      
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove(filesToDelete)

      if (deleteError) {
        // Log error but don't fail the upload process
        console.error('Could not delete old avatar files:', deleteError)
      }
    }
  } catch (error) {
    // Log error but don't fail the upload process
    console.error('Error cleaning up old avatars:', error)
  }
}

// Resize image to square and compress
export const resizeImageToSquare = (
  file: File,
  size: number = 200
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Set canvas size to square
      canvas.width = size
      canvas.height = size

      // Calculate crop dimensions for square
      const minDimension = Math.min(img.width, img.height)
      const cropX = (img.width - minDimension) / 2
      const cropY = (img.height - minDimension) / 2

      // Draw cropped and resized image
      ctx?.drawImage(
        img,
        cropX, cropY, minDimension, minDimension, // Source crop
        0, 0, size, size // Destination
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        0.8 // Compression quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
} 