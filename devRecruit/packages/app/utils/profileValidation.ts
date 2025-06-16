// DevRecruit Profile & Onboarding Validation
// Clean, focused validation with specific requirements

export interface ValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

export interface ProfileValidation {
  fullName: ValidationResult
  username: ValidationResult
  age: ValidationResult
  aboutMe: ValidationResult
  educationStatus: ValidationResult
  codingLanguages: ValidationResult
  overall: boolean
}

/**
 * Validate full name (must be at least 2 words)
 */
export const validateFullName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: "Full name is required"
    }
  }

  const trimmedName = name.trim()
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0)

  if (words.length < 2) {
    return {
      isValid: false,
      error: "Please enter your first and last name",
      suggestion: "Example: John Smith"
    }
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const validNameRegex = /^[a-zA-Z\s\-']+$/
  if (!validNameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes"
    }
  }

  // Check minimum length per word (at least 2 characters)
  const hasShortWords = words.some(word => word.replace(/[-']/g, '').length < 2)
  if (hasShortWords) {
    return {
      isValid: false,
      error: "Each part of your name must be at least 2 characters long"
    }
  }

  // Check maximum total length
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: "Full name must be less than 50 characters"
    }
  }

  return { isValid: true }
}

/**
 * Auto-format full name (capitalize each word)
 */
export const formatFullName = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ')
}

/**
 * Validate username (3-22 characters, specific rules)
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: "Username is required"
    }
  }

  const trimmedUsername = username.trim().toLowerCase()

  // Length check (3-22 characters as requested)
  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters long"
    }
  }

  if (trimmedUsername.length > 22) {
    return {
      isValid: false,
      error: "Username must be less than 22 characters long"
    }
  }

  // Character validation (letters, numbers, underscore, hyphen)
  const validUsernameRegex = /^[a-z0-9_-]+$/
  if (!validUsernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens"
    }
  }

  // Must start with letter or number
  if (!/^[a-z0-9]/.test(trimmedUsername)) {
    return {
      isValid: false,
      error: "Username must start with a letter or number"
    }
  }

  // Cannot end with special characters
  if (/[-_]$/.test(trimmedUsername)) {
    return {
      isValid: false,
      error: "Username cannot end with a hyphen or underscore"
    }
  }

  // Reserved words
  const reservedWords = [
    'admin', 'administrator', 'root', 'devrecruit', 'api', 'www', 'mail', 
    'support', 'help', 'info', 'contact', 'about', 'team', 'staff',
    'moderator', 'test', 'demo', 'example', 'null', 'undefined'
  ]
  
  if (reservedWords.includes(trimmedUsername)) {
    return {
      isValid: false,
      error: "This username is reserved. Please choose a different one."
    }
  }

  return { isValid: true }
}

/**
 * Format username (convert to lowercase, remove invalid chars)
 */
export const formatUsername = (username: string): string => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '') // Remove invalid characters
}

/**
 * Validate age (13+ years old as requested)
 */
export const validateAge = (age: string | number): ValidationResult => {
  if (!age || age === '') {
    return {
      isValid: false,
      error: "Age is required"
    }
  }

  const ageNum = typeof age === 'string' ? parseInt(age) : age

  if (isNaN(ageNum)) {
    return {
      isValid: false,
      error: "Please enter a valid age"
    }
  }

  if (ageNum < 13) {
    return {
      isValid: false,
      error: "You must be at least 13 years old to use DevRecruit"
    }
  }

  if (ageNum > 120) {
    return {
      isValid: false,
      error: "Please enter a realistic age"
    }
  }

  return { isValid: true }
}

/**
 * Validate About Me section (optional, max 500 chars as requested)
 */
export const validateAboutMe = (aboutMe: string): ValidationResult => {
  // About Me is optional
  if (!aboutMe || aboutMe.trim().length === 0) {
    return { isValid: true }
  }

  const trimmedAboutMe = aboutMe.trim()

  // Max 500 characters as requested
  if (trimmedAboutMe.length > 500) {
    return {
      isValid: false,
      error: `About Me must be less than 500 characters (currently ${trimmedAboutMe.length})`
    }
  }

  // Check for minimum meaningful content if provided
  if (trimmedAboutMe.length > 0 && trimmedAboutMe.length < 10) {
    return {
      isValid: false,
      error: "If provided, About Me should be at least 10 characters long",
      suggestion: "Tell us about your coding interests and experience"
    }
  }

  // Basic content quality check
  const suspiciousPatterns = [
    /(.)\1{4,}/, // Repeated characters (aaaaa)
    /^[^a-zA-Z]*$/, // Only special characters/numbers
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedAboutMe)) {
      return {
        isValid: false,
        error: "Please write a meaningful description about yourself"
      }
    }
  }

  return { isValid: true }
}

/**
 * Validate education status
 */
export const validateEducationStatus = (status: string): ValidationResult => {
  if (!status || status.trim().length === 0) {
    return {
      isValid: false,
      error: "Please select your education status"
    }
  }

  const validStatuses = ['highschool', 'college', 'professional', 'not_in_school']
  if (!validStatuses.includes(status)) {
    return {
      isValid: false,
      error: "Please select a valid education status"
    }
  }

  return { isValid: true }
}

/**
 * Validate coding languages (must select at least 1)
 */
export const validateCodingLanguages = (languages: string[]): ValidationResult => {
  if (!languages || languages.length === 0) {
    return {
      isValid: false,
      error: "Please select at least one coding language"
    }
  }

  if (languages.length > 15) {
    return {
      isValid: false,
      error: "Please select no more than 15 coding languages to keep your profile focused"
    }
  }

  return { isValid: true }
}

/**
 * Validate entire profile at once
 */
export const validateCompleteProfile = (profile: {
  full_name?: string
  username?: string
  age?: string | number
  about_me?: string
  education_status?: string
  coding_languages?: string[]
}): ProfileValidation => {
  const fullName = validateFullName(profile.full_name || '')
  const username = validateUsername(profile.username || '')
  const age = validateAge(profile.age || '')
  const aboutMe = validateAboutMe(profile.about_me || '')
  const educationStatus = validateEducationStatus(profile.education_status || '')
  const codingLanguages = validateCodingLanguages(profile.coding_languages || [])

  return {
    fullName,
    username,
    age,
    aboutMe,
    educationStatus,
    codingLanguages,
    overall: fullName.isValid && username.isValid && age.isValid && 
             aboutMe.isValid && educationStatus.isValid && codingLanguages.isValid
  }
}

/**
 * Get character count with color coding for limits
 */
export const getCharacterCountInfo = (text: string, maxLength: number) => {
  const length = text.length
  const remaining = maxLength - length
  
  let color = '#64748b' // Default gray
  if (remaining < 0) {
    color = '#dc2626' // Red - over limit
  } else if (remaining < maxLength * 0.1) {
    color = '#f59e0b' // Orange - near limit (10% remaining)
  } else if (length > 0) {
    color = '#059669' // Green - has content
  }

  return {
    current: length,
    max: maxLength,
    remaining,
    color,
    isOverLimit: remaining < 0
  }
}

/**
 * Real-time validation for form fields
 */
export const getFieldValidationState = (
  value: string, 
  validator: (value: string) => ValidationResult
) => {
  const result = validator(value)
  
  return {
    isValid: result.isValid,
    error: result.error,
    suggestion: result.suggestion,
    borderColor: result.isValid ? '#10b981' : '#ef4444', // Green or red
    textColor: result.isValid ? '#059669' : '#dc2626'
  }
} 