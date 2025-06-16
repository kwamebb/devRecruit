/**
 * Comprehensive Input Validation System for DevRecruit
 * 
 * This system provides:
 * - Security-focused validation rules
 * - Input sanitization
 * - Detailed validation error messages
 * - XSS prevention
 * - SQL injection prevention
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue?: any
  warnings?: string[]
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: any) => boolean | string
  sanitizer?: (value: any) => any
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

// Common validation patterns
export const ValidationPatterns = {
  // Username: 3-20 chars, letters, numbers, underscores only
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  
  // Email: standard email format
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Full name: letters, spaces, hyphens, apostrophes (2-50 chars)
  FULL_NAME: /^[a-zA-Z\s\-']{2,50}$/,
  
  // Age: 13-120 (reasonable human age range)
  AGE: /^(1[3-9]|[2-9][0-9]|1[01][0-9]|120)$/,
  
  // GitHub username: GitHub's rules (alphanumeric, hyphens, max 39 chars)
  GITHUB_USERNAME: /^[a-zA-Z0-9]([a-zA-Z0-9\-]){0,38}$/,
  
  // URL: basic URL validation
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // No HTML tags (XSS prevention)
  NO_HTML: /^[^<>]*$/,
  
  // No SQL injection patterns
  NO_SQL_INJECTION: /^(?!.*('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter|union|script)).+$/i
}

// Dangerous patterns to check for
const DANGEROUS_PATTERNS = [
  // XSS patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  
  // SQL injection patterns
  /('|(\\')|(;)|(\\;)|(--)|(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+)/gi,
  
  // Command injection patterns
  /(\||&|;|\$\(|\`)/g,
  
  // Path traversal
  /\.\.\//g,
  /\.\.\\/g
]

class InputValidator {
  private static instance: InputValidator

  private constructor() {}

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator()
    }
    return InputValidator.instance
  }

  /**
   * Validate a single field
   */
  validateField(value: any, fieldName: string, rules: ValidationRule): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let sanitizedValue = value

    // Convert to string for validation
    const stringValue = String(value || '').trim()

    // Required field validation
    if (rules.required && (!stringValue || stringValue.length === 0)) {
      errors.push(`${this.formatFieldName(fieldName)} is required`)
      return { isValid: false, errors, sanitizedValue: '' }
    }

    // Skip other validations if field is empty and not required
    if (!stringValue && !rules.required) {
      return { isValid: true, errors: [], sanitizedValue: '' }
    }

    // Length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors.push(`${this.formatFieldName(fieldName)} must be at least ${rules.minLength} characters`)
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors.push(`${this.formatFieldName(fieldName)} must be no more than ${rules.maxLength} characters`)
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push(this.getPatternErrorMessage(fieldName, rules.pattern))
    }

    // Security validations
    const securityCheck = this.checkForDangerousPatterns(stringValue)
    if (!securityCheck.isValid) {
      errors.push(`${this.formatFieldName(fieldName)} contains invalid characters`)
    }

    // Custom validator
    if (rules.customValidator) {
      const customResult = rules.customValidator(stringValue)
      if (typeof customResult === 'string') {
        errors.push(customResult)
      } else if (!customResult) {
        errors.push(`${this.formatFieldName(fieldName)} is invalid`)
      }
    }

    // Sanitization
    if (rules.sanitizer) {
      sanitizedValue = rules.sanitizer(stringValue)
    } else {
      sanitizedValue = this.defaultSanitize(stringValue)
    }

    // Additional warnings for suspicious content
    if (this.containsSuspiciousContent(stringValue)) {
      warnings.push(`${this.formatFieldName(fieldName)} contains potentially suspicious content`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Validate multiple fields using a schema
   */
  validateSchema(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const allErrors: string[] = []
    const allWarnings: string[] = []
    const sanitizedData: Record<string, any> = {}

    for (const [fieldName, rules] of Object.entries(schema)) {
      const fieldValue = data[fieldName]
      const result = this.validateField(fieldValue, fieldName, rules)
      
      if (!result.isValid) {
        allErrors.push(...result.errors)
      }
      
      if (result.warnings) {
        allWarnings.push(...result.warnings)
      }
      
      sanitizedData[fieldName] = result.sanitizedValue
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      sanitizedValue: sanitizedData,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    }
  }

  /**
   * Check for dangerous patterns
   */
  private checkForDangerousPatterns(value: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = []

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(value)) {
        if (pattern.source.includes('script|iframe|object')) {
          threats.push('XSS')
        } else if (pattern.source.includes('union|select|insert')) {
          threats.push('SQL_INJECTION')
        } else if (pattern.source.includes('\\|\\||&|;')) {
          threats.push('COMMAND_INJECTION')
        } else if (pattern.source.includes('\\.\\.')) {
          threats.push('PATH_TRAVERSAL')
        }
      }
    }

    return {
      isValid: threats.length === 0,
      threats
    }
  }

  /**
   * Check for suspicious content
   */
  private containsSuspiciousContent(value: string): boolean {
    const suspiciousPatterns = [
      /\b(password|passwd|pwd)\b/gi,
      /\b(admin|administrator|root)\b/gi,
      /\b(token|key|secret)\b/gi,
      /\b(hack|exploit|vulnerability)\b/gi
    ]

    return suspiciousPatterns.some(pattern => pattern.test(value))
  }

  /**
   * Default sanitization
   */
  private defaultSanitize(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 1000) // Limit length as safety measure
  }

  /**
   * Format field name for error messages
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
  }

  /**
   * Get pattern-specific error messages
   */
  private getPatternErrorMessage(fieldName: string, pattern: RegExp): string {
    const field = this.formatFieldName(fieldName)

    if (pattern === ValidationPatterns.USERNAME) {
      return `${field} must be 3-20 characters and contain only letters, numbers, and underscores`
    }
    if (pattern === ValidationPatterns.EMAIL) {
      return `${field} must be a valid email address`
    }
    if (pattern === ValidationPatterns.FULL_NAME) {
      return `${field} must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes`
    }
    if (pattern === ValidationPatterns.AGE) {
      return `${field} must be between 13 and 120`
    }
    if (pattern === ValidationPatterns.GITHUB_USERNAME) {
      return `${field} must be a valid GitHub username`
    }
    if (pattern === ValidationPatterns.URL) {
      return `${field} must be a valid URL`
    }

    return `${field} format is invalid`
  }
}

// Export singleton instance
export const inputValidator = InputValidator.getInstance()

// Predefined validation schemas for common forms
export const ValidationSchemas = {
  // User registration/profile
  USER_PROFILE: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: ValidationPatterns.USERNAME,
      sanitizer: (value: string) => value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    },
    full_name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: ValidationPatterns.FULL_NAME
    },
    email: {
      required: true,
      pattern: ValidationPatterns.EMAIL,
      sanitizer: (value: string) => value.toLowerCase().trim()
    },
    age: {
      required: true,
      pattern: ValidationPatterns.AGE,
      customValidator: (value: string) => {
        const age = parseInt(value)
        if (age < 13) return 'You must be at least 13 years old to use DevRecruit'
        if (age > 120) return 'Please enter a valid age'
        return true
      }
    },
    github_username: {
      required: false,
      pattern: ValidationPatterns.GITHUB_USERNAME
    }
  },

  // Onboarding form
  ONBOARDING: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: ValidationPatterns.USERNAME
    },
    fullName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: ValidationPatterns.FULL_NAME
    },
    age: {
      required: true,
      pattern: ValidationPatterns.AGE,
      customValidator: (value: string) => {
        const age = parseInt(value)
        return age >= 13 && age <= 120
      }
    },
    educationStatus: {
      required: true,
      customValidator: (value: string) => {
        const validStatuses = ['highschool', 'college', 'professional', 'not_in_school']
        return validStatuses.includes(value)
      }
    },
    codingLanguages: {
      required: true,
      customValidator: (value: string[]) => {
        return Array.isArray(value) && value.length > 0 && value.length <= 10
      }
    }
  },

  // File upload validation
  FILE_UPLOAD: {
    filename: {
      required: true,
      maxLength: 255,
      pattern: /^[a-zA-Z0-9._-]+$/,
      customValidator: (value: string) => {
        const dangerousExtensions = [
          '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar',
          '.php', '.asp', '.jsp', '.js', '.vbs', '.ps1', '.sh'
        ]
        const ext = value.toLowerCase().substring(value.lastIndexOf('.'))
        return !dangerousExtensions.includes(ext)
      }
    }
  }
}

// Convenience functions
export const validateUserProfile = (data: Record<string, any>) =>
  inputValidator.validateSchema(data, ValidationSchemas.USER_PROFILE)

export const validateOnboarding = (data: Record<string, any>) =>
  inputValidator.validateSchema(data, ValidationSchemas.ONBOARDING)

export const validateFileUpload = (filename: string) =>
  inputValidator.validateField(filename, 'filename', ValidationSchemas.FILE_UPLOAD.filename)

// React hook for validation
export const useValidation = () => {
  return {
    validateField: (value: any, fieldName: string, rules: ValidationRule) =>
      inputValidator.validateField(value, fieldName, rules),
    validateSchema: (data: Record<string, any>, schema: ValidationSchema) =>
      inputValidator.validateSchema(data, schema),
    validateUserProfile,
    validateOnboarding,
    validateFileUpload
  }
}

// Age validation helper
export const validateAge = (age: string | number): ValidationResult => {
  const ageNum = typeof age === 'string' ? parseInt(age) : age
  
  if (isNaN(ageNum)) {
    return { isValid: false, errors: ['Age must be a number'] }
  }
  
  if (ageNum < 13) {
    return { isValid: false, errors: ['You must be at least 13 years old to use DevRecruit'] }
  }
  
  if (ageNum > 120) {
    return { isValid: false, errors: ['Please enter a valid age'] }
  }
  
  return { isValid: true, errors: [], sanitizedValue: ageNum }
}

// Username validation helper
export const validateUsername = (username: string): ValidationResult => {
  return inputValidator.validateField(username, 'username', {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: ValidationPatterns.USERNAME,
    sanitizer: (value: string) => value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    customValidator: (value: string) => {
      // Additional checks
      if (value.startsWith('_') || value.endsWith('_')) {
        return 'Username cannot start or end with underscore'
      }
      if (value.includes('__')) {
        return 'Username cannot contain consecutive underscores'
      }
      // Reserved usernames
      const reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'devrecruit']
      if (reserved.includes(value.toLowerCase())) {
        return 'This username is reserved'
      }
      return true
    }
  })
}

// Email validation helper
export const validateEmail = (email: string): ValidationResult => {
  return inputValidator.validateField(email, 'email', {
    required: true,
    pattern: ValidationPatterns.EMAIL,
    sanitizer: (value: string) => value.toLowerCase().trim(),
    customValidator: (value: string) => {
      // Additional email checks
      if (value.length > 254) {
        return 'Email address is too long'
      }
      const parts = value.split('@')
      if (parts[0].length > 64) {
        return 'Email username part is too long'
      }
      return true
    }
  })
}

// DevRecruit Form Validation Utilities
// Comprehensive validation for onboarding and profile creation

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

  // Length check
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
 * Validate age (13+ years old)
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
 * Validate About Me section (optional, max 500 chars)
 */
export const validateAboutMe = (aboutMe: string): ValidationResult => {
  // About Me is optional
  if (!aboutMe || aboutMe.trim().length === 0) {
    return { isValid: true }
  }

  const trimmedAboutMe = aboutMe.trim()

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

  // Basic profanity/spam check (simple version)
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
export const validateProfile = (profile: {
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
    color = '#f59e0b' // Orange - near limit
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