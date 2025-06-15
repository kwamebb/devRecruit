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