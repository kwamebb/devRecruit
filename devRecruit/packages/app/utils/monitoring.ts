/**
 * DevRecruit Monitoring System - Hybrid Approach
 * 
 * This system provides:
 * - Enhanced console logging for development
 * - Structured error tracking
 * - Performance monitoring
 * - Security event logging
 * - Easy migration path to Sentry
 */

export interface LogLevel {
  DEBUG: 'debug'
  INFO: 'info'
  WARN: 'warn'
  ERROR: 'error'
  CRITICAL: 'critical'
}

export interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'privacy_change' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  details: Record<string, any>
  timestamp: string
  userAgent?: string
  ipAddress?: string
}

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: string
  metadata?: Record<string, any>
}

export interface ErrorEvent {
  message: string
  stack?: string
  level: keyof LogLevel
  component: string
  userId?: string
  timestamp: string
  metadata?: Record<string, any>
}

class MonitoringSystem {
  private static instance: MonitoringSystem
  private isDevelopment: boolean
  private errorCount: number = 0
  private performanceMetrics: PerformanceMetric[] = []
  private securityEvents: SecurityEvent[] = []

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.initializeMonitoring()
  }

  public static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem()
    }
    return MonitoringSystem.instance
  }

  private initializeMonitoring() {
    // Global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message,
          stack: event.error?.stack,
          level: 'error',
          component: 'global',
          timestamp: new Date().toISOString(),
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          level: 'error',
          component: 'promise',
          timestamp: new Date().toISOString(),
          metadata: {
            reason: event.reason
          }
        })
      })
    }

    // Performance observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.logPerformance({
              name: entry.name,
              duration: entry.duration,
              timestamp: new Date().toISOString(),
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            })
          }
        })
        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] })
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }
  }

  /**
   * Log general information
   */
  public logInfo(message: string, metadata?: Record<string, any>) {
    const logData = {
      level: 'info' as const,
      message,
      timestamp: new Date().toISOString(),
      metadata
    }

    if (this.isDevelopment) {
      console.log(
        `%c[INFO] ${logData.timestamp}`,
        'color: #3b82f6; font-weight: bold',
        message,
        metadata ? metadata : ''
      )
    }

    // In production, this would be sent to external service
    this.storeLog(logData)
  }

  /**
   * Log warnings
   */
  public logWarning(message: string, metadata?: Record<string, any>) {
    const logData = {
      level: 'warn' as const,
      message,
      timestamp: new Date().toISOString(),
      metadata
    }

    if (this.isDevelopment) {
      console.warn(
        `%c[WARN] ${logData.timestamp}`,
        'color: #f59e0b; font-weight: bold',
        message,
        metadata ? metadata : ''
      )
    }

    this.storeLog(logData)
  }

  /**
   * Log errors with enhanced formatting
   */
  public logError(errorEvent: ErrorEvent) {
    this.errorCount++

    if (this.isDevelopment) {
      console.group(`%c[${errorEvent.level.toUpperCase()}] ${errorEvent.timestamp}`, 
        errorEvent.level === 'critical' ? 'color: #dc2626; font-weight: bold; font-size: 14px' : 
        errorEvent.level === 'error' ? 'color: #ef4444; font-weight: bold' : 
        'color: #f59e0b; font-weight: bold'
      )
      console.error('Message:', errorEvent.message)
      console.error('Component:', errorEvent.component)
      if (errorEvent.userId) console.error('User ID:', errorEvent.userId)
      if (errorEvent.stack) console.error('Stack:', errorEvent.stack)
      if (errorEvent.metadata) console.error('Metadata:', errorEvent.metadata)
      console.groupEnd()
    }

    this.storeLog(errorEvent)

    // Alert for critical errors in development
    if (this.isDevelopment && errorEvent.level === 'critical') {
      setTimeout(() => {
        alert(`Critical Error: ${errorEvent.message}\nComponent: ${errorEvent.component}`)
      }, 100)
    }
  }

  /**
   * Log security events
   */
  public logSecurityEvent(event: SecurityEvent) {
    this.securityEvents.push(event)

    if (this.isDevelopment) {
      const color = event.severity === 'critical' ? '#dc2626' :
                   event.severity === 'high' ? '#ef4444' :
                   event.severity === 'medium' ? '#f59e0b' : '#6b7280'

      console.group(`%c[SECURITY] ${event.timestamp}`, `color: ${color}; font-weight: bold`)
      console.log('Type:', event.type)
      console.log('Severity:', event.severity)
      if (event.userId) console.log('User ID:', event.userId)
      console.log('Details:', event.details)
      if (event.userAgent) console.log('User Agent:', event.userAgent)
      if (event.ipAddress) console.log('IP Address:', event.ipAddress)
      console.groupEnd()
    }

    // Alert for high/critical security events
    if (this.isDevelopment && (event.severity === 'high' || event.severity === 'critical')) {
      console.warn(`🚨 Security Alert: ${event.type} - ${event.severity}`)
    }

    this.storeLog({ ...event, level: 'security' })
  }

  /**
   * Log performance metrics
   */
  public logPerformance(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric)

    if (this.isDevelopment && metric.duration > 1000) { // Log slow operations
      console.log(
        `%c[PERF] ${metric.timestamp}`,
        'color: #8b5cf6; font-weight: bold',
        `${metric.name}: ${metric.duration.toFixed(2)}ms`,
        metric.metadata ? metric.metadata : ''
      )
    }

    this.storeLog({ ...metric, level: 'performance' })
  }

  /**
   * Measure function execution time
   */
  public async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      this.logPerformance({
        name,
        duration,
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, status: 'success' }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.logPerformance({
        name,
        duration,
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, status: 'error', error: error instanceof Error ? error.message : String(error) }
      })
      
      throw error
    }
  }

  /**
   * Measure synchronous function execution time
   */
  public measure<T>(
    name: string, 
    fn: () => T, 
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - startTime
      
      this.logPerformance({
        name,
        duration,
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, status: 'success' }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.logPerformance({
        name,
        duration,
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, status: 'error', error: error instanceof Error ? error.message : String(error) }
      })
      
      throw error
    }
  }

  /**
   * Get monitoring statistics
   */
  public getStats() {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)

    const recentErrors = this.errorCount
    const recentSecurityEvents = this.securityEvents.filter(
      event => new Date(event.timestamp).getTime() > oneHourAgo
    ).length
    const recentPerformanceIssues = this.performanceMetrics.filter(
      metric => new Date(metric.timestamp).getTime() > oneHourAgo && metric.duration > 1000
    ).length

    return {
      totalErrors: recentErrors,
      securityEvents: recentSecurityEvents,
      performanceIssues: recentPerformanceIssues,
      uptime: this.getUptime()
    }
  }

  /**
   * Get application uptime
   */
  private getUptime(): string {
    if (typeof window !== 'undefined' && window.performance) {
      const uptimeMs = window.performance.now()
      const uptimeSeconds = Math.floor(uptimeMs / 1000)
      const hours = Math.floor(uptimeSeconds / 3600)
      const minutes = Math.floor((uptimeSeconds % 3600) / 60)
      const seconds = uptimeSeconds % 60
      return `${hours}h ${minutes}m ${seconds}s`
    }
    return 'Unknown'
  }

  /**
   * Store log data (in production, this would send to external service)
   */
  private storeLog(logData: any) {
    // In development, we just store in memory
    // In production, this would send to Sentry, LogRocket, etc.
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('devrecruit_logs') || '[]')
      logs.push(logData)
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000)
      }
      
      localStorage.setItem('devrecruit_logs', JSON.stringify(logs))
    }
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string {
    if (typeof window !== 'undefined') {
      const logs = localStorage.getItem('devrecruit_logs') || '[]'
      return logs
    }
    return '[]'
  }

  /**
   * Clear stored logs
   */
  public clearLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('devrecruit_logs')
    }
    this.errorCount = 0
    this.performanceMetrics = []
    this.securityEvents = []
  }

  /**
   * Future: Migrate to Sentry
   * This method will be used when upgrading to Sentry
   */
  public async migrateToSentry(sentryDsn: string) {
    // Implementation for Sentry migration
    console.log('Migrating to Sentry with DSN:', sentryDsn)
    // This would initialize Sentry and transfer existing logs
  }
}

// Export singleton instance
export const monitoring = MonitoringSystem.getInstance()

// Convenience functions
export const logInfo = (message: string, metadata?: Record<string, any>) => 
  monitoring.logInfo(message, metadata)

export const logWarning = (message: string, metadata?: Record<string, any>) => 
  monitoring.logWarning(message, metadata)

export const logError = (errorEvent: ErrorEvent) => 
  monitoring.logError(errorEvent)

export const logSecurityEvent = (event: SecurityEvent) => 
  monitoring.logSecurityEvent(event)

export const logPerformance = (metric: PerformanceMetric) => 
  monitoring.logPerformance(metric)

export const measureAsync = <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>) => 
  monitoring.measureAsync(name, fn, metadata)

export const measure = <T>(name: string, fn: () => T, metadata?: Record<string, any>) => 
  monitoring.measure(name, fn, metadata)

// React hook for monitoring
export const useMonitoring = () => {
  return {
    logInfo,
    logWarning,
    logError,
    logSecurityEvent,
    logPerformance,
    measureAsync,
    measure,
    getStats: () => monitoring.getStats(),
    exportLogs: () => monitoring.exportLogs(),
    clearLogs: () => monitoring.clearLogs()
  }
} 