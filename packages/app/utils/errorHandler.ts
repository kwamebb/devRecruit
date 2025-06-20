/**
 * Centralized Error Handling System for DevRecruit
 * 
 * This system provides:
 * - User-friendly error messages
 * - Technical error logging for debugging
 * - Error categorization and tracking
 * - Security-conscious error disclosure
 */

export interface ErrorContext {
  userId?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

export interface ErrorResponse {
  userMessage: string
  shouldRetry: boolean
  errorCode?: string
}

export enum ErrorCategory {
  AUTHENTICATION = 'auth',
  AUTHORIZATION = 'authz',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  FILE_UPLOAD = 'upload',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ErrorLog {
  timestamp: string
  category: ErrorCategory
  severity: ErrorSeverity
  userMessage: string
  technicalError: string
  context: ErrorContext
  stackTrace?: string
  userAgent?: string
  url?: string
}

class ErrorHandler {
  private static instance: ErrorHandler
  private errorLogs: ErrorLog[] = []
  private isProduction = process.env.NODE_ENV === 'production'

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Main error handling method
   */
  handleError(
    error: any,
    context: ErrorContext = {},
    customUserMessage?: string
  ): ErrorResponse {
    const category = this.categorizeError(error)
    const severity = this.determineSeverity(error, category)
    const userMessage = customUserMessage || this.generateUserMessage(error, category)
    const shouldRetry = this.shouldAllowRetry(category, error)

    // Log technical details (always log, regardless of environment)
    this.logError({
      timestamp: new Date().toISOString(),
      category,
      severity,
      userMessage,
      technicalError: this.extractTechnicalMessage(error),
      context,
      stackTrace: error?.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location?.href : undefined
    })

    // In development, also log to console for immediate debugging
    if (!this.isProduction) {
      console.group(`🚨 Error [${category}/${severity}]`)
      console.error('User Message:', userMessage)
      console.error('Technical Error:', error)
      console.error('Context:', context)
      console.error('Stack:', error?.stack)
      console.groupEnd()
    }

    return {
      userMessage,
      shouldRetry,
      errorCode: this.generateErrorCode(category, severity)
    }
  }

  /**
   * Categorize errors based on type and message
   */
  private categorizeError(error: any): ErrorCategory {
    const message = this.extractTechnicalMessage(error).toLowerCase()

    // Authentication errors
    if (message.includes('auth') || message.includes('login') || message.includes('token') || 
        message.includes('session') || message.includes('unauthorized') || error?.status === 401) {
      return ErrorCategory.AUTHENTICATION
    }

    // Authorization errors
    if (message.includes('permission') || message.includes('forbidden') || 
        message.includes('access denied') || error?.status === 403) {
      return ErrorCategory.AUTHORIZATION
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('format') || 
        error?.status === 400 || message.includes('age') || message.includes('username')) {
      return ErrorCategory.VALIDATION
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || message.includes('timeout') ||
        error?.status >= 500 || message.includes('cors')) {
      return ErrorCategory.NETWORK
    }

    // Database errors
    if (message.includes('database') || message.includes('supabase') || 
        message.includes('postgres') || message.includes('sql') ||
        message.includes('relation') || message.includes('column')) {
      return ErrorCategory.DATABASE
    }

    // File upload errors
    if (message.includes('upload') || message.includes('file') || 
        message.includes('image') || message.includes('storage') ||
        message.includes('bucket') || message.includes('size')) {
      return ErrorCategory.FILE_UPLOAD
    }

    // System errors
    if (message.includes('system') || message.includes('server') || 
        message.includes('internal') || error?.status === 500) {
      return ErrorCategory.SYSTEM
    }

    return ErrorCategory.UNKNOWN
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: any, category: ErrorCategory): ErrorSeverity {
    // Critical errors that affect core functionality
    if (category === ErrorCategory.AUTHENTICATION && error?.message?.includes('Missing')) {
      return ErrorSeverity.CRITICAL
    }

    if (category === ErrorCategory.DATABASE && error?.status === 500) {
      return ErrorSeverity.CRITICAL
    }

    // High severity errors
    if (category === ErrorCategory.AUTHORIZATION || 
        category === ErrorCategory.SYSTEM ||
        error?.status >= 500) {
      return ErrorSeverity.HIGH
    }

    // Medium severity errors
    if (category === ErrorCategory.AUTHENTICATION ||
        category === ErrorCategory.DATABASE ||
        category === ErrorCategory.NETWORK) {
      return ErrorSeverity.MEDIUM
    }

    // Low severity errors
    return ErrorSeverity.LOW
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(error: any, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        if (error?.message?.includes('Missing')) {
          return 'Please log in to continue.'
        }
        return 'Authentication failed. Please try logging in again.'

      case ErrorCategory.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.'

      case ErrorCategory.VALIDATION:
        const message = this.extractTechnicalMessage(error)
        if (message.includes('age')) {
          return 'Please enter a valid age (13 or older).'
        }
        if (message.includes('username')) {
          return 'Please enter a valid username (3+ characters, letters and numbers only).'
        }
        if (message.includes('required')) {
          return 'Please fill in all required fields.'
        }
        if (message.includes('email')) {
          return 'Please enter a valid email address.'
        }
        return 'Please check your input and try again.'

      case ErrorCategory.NETWORK:
        if (error?.status >= 500) {
          return 'Our servers are experiencing issues. Please try again in a few minutes.'
        }
        return 'Connection problem. Please check your internet and try again.'

      case ErrorCategory.DATABASE:
        return 'We\'re having trouble saving your data. Please try again.'

      case ErrorCategory.FILE_UPLOAD:
        const uploadMessage = this.extractTechnicalMessage(error)
        if (uploadMessage.includes('size')) {
          return 'File is too large. Please use an image under 5MB.'
        }
        if (uploadMessage.includes('format') || uploadMessage.includes('type')) {
          return 'Invalid file format. Please use JPG or PNG images only.'
        }
        if (uploadMessage.includes('permission')) {
          return 'Upload failed. Please try logging in again.'
        }
        return 'Upload failed. Please try again with a different image.'

      case ErrorCategory.SYSTEM:
        return 'Something went wrong on our end. Please try again in a few minutes.'

      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  /**
   * Determine if user should be allowed to retry
   */
  private shouldAllowRetry(category: ErrorCategory, error: any): boolean {
    // Don't retry validation errors (user needs to fix input)
    if (category === ErrorCategory.VALIDATION) {
      return false
    }

    // Don't retry authorization errors (permission issue)
    if (category === ErrorCategory.AUTHORIZATION) {
      return false
    }

    // Don't retry certain authentication errors
    if (category === ErrorCategory.AUTHENTICATION && 
        error?.message?.includes('Invalid credentials')) {
      return false
    }

    // Allow retry for network, database, and system errors
    return true
  }

  /**
   * Generate error codes for tracking
   */
  private generateErrorCode(category: ErrorCategory, severity: ErrorSeverity): string {
    const timestamp = Date.now().toString(36)
    return `${category.toUpperCase()}_${severity.toUpperCase()}_${timestamp}`
  }

  /**
   * Extract technical error message safely
   */
  private extractTechnicalMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error) return error.error
    if (error?.details) return error.details
    return 'Unknown error'
  }

  /**
   * Log error details
   */
  private logError(errorLog: ErrorLog): void {
    // Add to in-memory log (for development and debugging)
    this.errorLogs.push(errorLog)

    // Keep only last 100 errors in memory
    if (this.errorLogs.length > 100) {
      this.errorLogs = this.errorLogs.slice(-100)
    }

    // In production, you might want to send to external logging service
    if (this.isProduction && errorLog.severity === ErrorSeverity.CRITICAL) {
      // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
      console.error('CRITICAL ERROR:', errorLog)
    }
  }

  /**
   * Get recent error logs (for debugging)
   */
  getRecentErrors(limit: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-limit)
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    this.errorLogs.forEach(log => {
      const key = `${log.category}_${log.severity}`
      stats[key] = (stats[key] || 0) + 1
    })

    return stats
  }

  /**
   * Clear error logs (for testing)
   */
  clearLogs(): void {
    this.errorLogs = []
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Convenience functions for common use cases
export const handleAuthError = (error: any, context?: ErrorContext) => 
  errorHandler.handleError(error, { ...context, action: 'authentication' })

export const handleValidationError = (error: any, context?: ErrorContext) => 
  errorHandler.handleError(error, { ...context, action: 'validation' })

export const handleUploadError = (error: any, context?: ErrorContext) => 
  errorHandler.handleError(error, { ...context, action: 'file_upload' })

export const handleDatabaseError = (error: any, context?: ErrorContext) => 
  errorHandler.handleError(error, { ...context, action: 'database_operation' })

export const handleNetworkError = (error: any, context?: ErrorContext) => 
  errorHandler.handleError(error, { ...context, action: 'network_request' })

// React hook for error handling in components
export const useErrorHandler = () => {
  return {
    handleError: (error: any, context?: ErrorContext, customMessage?: string) => 
      errorHandler.handleError(error, context, customMessage),
    handleAuthError: (error: any, context?: ErrorContext) => 
      handleAuthError(error, context),
    handleValidationError: (error: any, context?: ErrorContext) => 
      handleValidationError(error, context),
    handleUploadError: (error: any, context?: ErrorContext) => 
      handleUploadError(error, context),
    getRecentErrors: () => errorHandler.getRecentErrors(),
    getErrorStats: () => errorHandler.getErrorStats()
  }
} 