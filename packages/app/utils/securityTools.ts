/**
 * DevRecruit Security Tools - Development Time
 * 
 * This system provides:
 * - Manual security scanning tools
 * - Vulnerability detection
 * - Security best practices validation
 * - Code security analysis
 * - Input validation testing
 */

import { logSecurityEvent, logError } from './monitoring'

export interface SecurityScanResult {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  issue: string
  description: string
  recommendation: string
  location?: string
  evidence?: any
}

export interface SecurityReport {
  timestamp: string
  totalIssues: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  results: SecurityScanResult[]
  summary: string
}

class SecurityTools {
  private static instance: SecurityTools

  private constructor() {}

  public static getInstance(): SecurityTools {
    if (!SecurityTools.instance) {
      SecurityTools.instance = new SecurityTools()
    }
    return SecurityTools.instance
  }

  /**
   * Run comprehensive security scan
   */
  public async runSecurityScan(): Promise<SecurityReport> {
    const results: SecurityScanResult[] = []
    
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'low',
      details: { action: 'security_scan_started' },
      timestamp: new Date().toISOString()
    })

    // Run all security checks
    results.push(...this.checkEnvironmentVariables())
    results.push(...this.checkLocalStorage())
    results.push(...this.checkSessionStorage())
    results.push(...this.checkCookies())
    results.push(...this.checkConsoleExposure())
    results.push(...this.checkXSSVulnerabilities())
    results.push(...this.checkCSRFProtection())
    results.push(...this.checkHTTPSUsage())
    results.push(...this.checkContentSecurityPolicy())
    results.push(...this.checkInputValidation())
    results.push(...await this.checkDependencyVulnerabilities())

    // Generate report
    const report = this.generateReport(results)
    
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'low',
      details: { 
        action: 'security_scan_completed',
        totalIssues: report.totalIssues,
        criticalIssues: report.criticalIssues
      },
      timestamp: new Date().toISOString()
    })

    return report
  }

  /**
   * Check environment variables for security issues
   */
  private checkEnvironmentVariables(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    // Check for exposed secrets in client-side code
    if (typeof window !== 'undefined') {
      const windowKeys = Object.keys(window as any)
      const suspiciousKeys = windowKeys.filter(key => 
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('password')
      )

      if (suspiciousKeys.length > 0) {
        results.push({
          category: 'Environment Security',
          severity: 'high',
          issue: 'Potential secrets exposed in window object',
          description: 'Sensitive keys or tokens may be exposed in the global window object',
          recommendation: 'Remove sensitive data from client-side code and use server-side environment variables',
          location: 'window object',
          evidence: suspiciousKeys
        })
      }
    }

    return results
  }

  /**
   * Check localStorage for sensitive data
   */
  private checkLocalStorage(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          
          // Check for sensitive data patterns
          if (value && (
            value.includes('password') ||
            value.includes('token') ||
            value.includes('secret') ||
            value.includes('jwt') ||
            /[A-Za-z0-9]{32,}/.test(value) // Long strings that might be tokens
          )) {
            results.push({
              category: 'Data Storage Security',
              severity: 'medium',
              issue: `Potentially sensitive data in localStorage: ${key}`,
              description: 'Sensitive information stored in localStorage is accessible to all scripts',
              recommendation: 'Use secure storage methods or encrypt sensitive data',
              location: `localStorage.${key}`,
              evidence: { key, valueLength: value.length }
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Check sessionStorage for sensitive data
   */
  private checkSessionStorage(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof window !== 'undefined' && window.sessionStorage) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const value = sessionStorage.getItem(key)
          
          if (value && (
            value.includes('password') ||
            value.includes('token') ||
            value.includes('secret') ||
            /[A-Za-z0-9]{32,}/.test(value)
          )) {
            results.push({
              category: 'Data Storage Security',
              severity: 'medium',
              issue: `Potentially sensitive data in sessionStorage: ${key}`,
              description: 'Sensitive information in sessionStorage is accessible to scripts',
              recommendation: 'Use secure storage methods or encrypt sensitive data',
              location: `sessionStorage.${key}`,
              evidence: { key, valueLength: value.length }
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Check cookies for security issues
   */
  private checkCookies(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        
        if (name && value) {
          // Check for insecure cookie attributes
          if (!cookie.includes('Secure')) {
            results.push({
              category: 'Cookie Security',
              severity: 'medium',
              issue: `Cookie without Secure flag: ${name}`,
              description: 'Cookies without Secure flag can be transmitted over HTTP',
              recommendation: 'Add Secure flag to all cookies in production',
              location: `document.cookie`,
              evidence: { cookieName: name }
            })
          }

          if (!cookie.includes('HttpOnly')) {
            results.push({
              category: 'Cookie Security',
              severity: 'medium',
              issue: `Cookie without HttpOnly flag: ${name}`,
              description: 'Cookies without HttpOnly flag are accessible to JavaScript',
              recommendation: 'Add HttpOnly flag to sensitive cookies',
              location: `document.cookie`,
              evidence: { cookieName: name }
            })
          }

          if (!cookie.includes('SameSite')) {
            results.push({
              category: 'Cookie Security',
              severity: 'low',
              issue: `Cookie without SameSite attribute: ${name}`,
              description: 'Cookies without SameSite attribute are vulnerable to CSRF attacks',
              recommendation: 'Add SameSite attribute to all cookies',
              location: `document.cookie`,
              evidence: { cookieName: name }
            })
          }
        }
      })
    }

    return results
  }

  /**
   * Check for console exposure
   */
  private checkConsoleExposure(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof window !== 'undefined') {
      // Check if sensitive objects are exposed to console
      const globalKeys = Object.keys(window as any)
      const suspiciousGlobals = globalKeys.filter(key => 
        key.toLowerCase().includes('config') ||
        key.toLowerCase().includes('env') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('api')
      )

      if (suspiciousGlobals.length > 0) {
        results.push({
          category: 'Information Disclosure',
          severity: 'medium',
          issue: 'Potentially sensitive objects exposed globally',
          description: 'Sensitive configuration or API objects are accessible via browser console',
          recommendation: 'Remove sensitive objects from global scope',
          location: 'window object',
          evidence: suspiciousGlobals
        })
      }

      // Check for debug mode indicators
      if ((window as any).DEBUG || (window as any).__DEV__ || process.env.NODE_ENV === 'development') {
        results.push({
          category: 'Information Disclosure',
          severity: 'low',
          issue: 'Debug mode enabled',
          description: 'Debug mode may expose sensitive information',
          recommendation: 'Ensure debug mode is disabled in production',
          location: 'global scope'
        })
      }
    }

    return results
  }

  /**
   * Check for XSS vulnerabilities
   */
  private checkXSSVulnerabilities(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof document !== 'undefined') {
      // Check for dangerous innerHTML usage
      const elements = document.querySelectorAll('*')
      let dangerousElements = 0

      elements.forEach(element => {
        if (element.innerHTML.includes('<script>') || 
            element.innerHTML.includes('javascript:') ||
            element.innerHTML.includes('onload=') ||
            element.innerHTML.includes('onerror=')) {
          dangerousElements++
        }
      })

      if (dangerousElements > 0) {
        results.push({
          category: 'XSS Vulnerability',
          severity: 'high',
          issue: 'Potentially dangerous HTML content detected',
          description: 'Elements contain potentially dangerous HTML that could lead to XSS',
          recommendation: 'Sanitize all user input and use safe DOM manipulation methods',
          location: 'DOM elements',
          evidence: { dangerousElements }
        })
      }
    }

    return results
  }

  /**
   * Check CSRF protection
   */
  private checkCSRFProtection(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    // Check for CSRF tokens in forms
    if (typeof document !== 'undefined') {
      const forms = document.querySelectorAll('form')
      let formsWithoutCSRF = 0

      forms.forEach(form => {
        const hasCSRFToken = form.querySelector('input[name*="csrf"]') ||
                           form.querySelector('input[name*="token"]') ||
                           form.querySelector('meta[name="csrf-token"]')

        if (!hasCSRFToken && form.method.toLowerCase() === 'post') {
          formsWithoutCSRF++
        }
      })

      if (formsWithoutCSRF > 0) {
        results.push({
          category: 'CSRF Vulnerability',
          severity: 'medium',
          issue: 'Forms without CSRF protection',
          description: 'POST forms without CSRF tokens are vulnerable to cross-site request forgery',
          recommendation: 'Add CSRF tokens to all state-changing forms',
          location: 'HTML forms',
          evidence: { formsWithoutCSRF }
        })
      }
    }

    return results
  }

  /**
   * Check HTTPS usage
   */
  private checkHTTPSUsage(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof window !== 'undefined' && window.location) {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        results.push({
          category: 'Transport Security',
          severity: 'high',
          issue: 'Site not served over HTTPS',
          description: 'The application is not using HTTPS, making it vulnerable to man-in-the-middle attacks',
          recommendation: 'Enable HTTPS for all environments except local development',
          location: window.location.href
        })
      }
    }

    return results
  }

  /**
   * Check Content Security Policy
   */
  private checkContentSecurityPolicy(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof document !== 'undefined') {
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      const cspHeader = document.querySelector('meta[name="Content-Security-Policy"]')

      if (!cspMeta && !cspHeader) {
        results.push({
          category: 'Content Security Policy',
          severity: 'high',
          issue: 'No Content Security Policy detected',
          description: 'Missing CSP makes the application vulnerable to XSS and data injection attacks',
          recommendation: 'Implement a strict Content Security Policy',
          location: 'HTTP headers or meta tags'
        })
      }
    }

    return results
  }

  /**
   * Check input validation
   */
  private checkInputValidation(): SecurityScanResult[] {
    const results: SecurityScanResult[] = []

    if (typeof document !== 'undefined') {
      const inputs = document.querySelectorAll('input, textarea')
      let inputsWithoutValidation = 0

      inputs.forEach(input => {
        const hasValidation = input.hasAttribute('pattern') ||
                            input.hasAttribute('minlength') ||
                            input.hasAttribute('maxlength') ||
                            input.hasAttribute('min') ||
                            input.hasAttribute('max') ||
                            input.hasAttribute('required')

        if (!hasValidation && input.getAttribute('type') !== 'hidden') {
          inputsWithoutValidation++
        }
      })

      if (inputsWithoutValidation > 0) {
        results.push({
          category: 'Input Validation',
          severity: 'medium',
          issue: 'Input fields without validation',
          description: 'Input fields without proper validation can lead to security vulnerabilities',
          recommendation: 'Add appropriate validation attributes and server-side validation',
          location: 'form inputs',
          evidence: { inputsWithoutValidation }
        })
      }
    }

    return results
  }

  /**
   * Check for dependency vulnerabilities (basic check)
   */
  private async checkDependencyVulnerabilities(): Promise<SecurityScanResult[]> {
    const results: SecurityScanResult[] = []

    try {
      // Check for known vulnerable patterns in loaded scripts
      if (typeof document !== 'undefined') {
        const scripts = document.querySelectorAll('script[src]')
        const externalScripts = Array.from(scripts).filter(script => {
          const src = script.getAttribute('src')
          return src && (src.startsWith('http') || src.startsWith('//'))
        })

        if (externalScripts.length > 0) {
          results.push({
            category: 'Dependency Security',
            severity: 'low',
            issue: 'External scripts detected',
            description: 'External scripts can introduce security vulnerabilities',
            recommendation: 'Audit all external dependencies and use SRI (Subresource Integrity)',
            location: 'script tags',
            evidence: { externalScriptCount: externalScripts.length }
          })
        }
      }
    } catch (error) {
      logError({
        message: 'Error checking dependency vulnerabilities',
        stack: error instanceof Error ? error.stack : undefined,
        level: 'error',
        component: 'security_tools',
        timestamp: new Date().toISOString(),
        metadata: { error: String(error) }
      })
    }

    return results
  }

  /**
   * Generate security report
   */
  private generateReport(results: SecurityScanResult[]): SecurityReport {
    const criticalIssues = results.filter(r => r.severity === 'critical').length
    const highIssues = results.filter(r => r.severity === 'high').length
    const mediumIssues = results.filter(r => r.severity === 'medium').length
    const lowIssues = results.filter(r => r.severity === 'low').length

    let summary = 'Security scan completed. '
    if (criticalIssues > 0) {
      summary += `🚨 ${criticalIssues} critical issues found! `
    }
    if (highIssues > 0) {
      summary += `⚠️ ${highIssues} high-severity issues found. `
    }
    if (mediumIssues > 0) {
      summary += `⚡ ${mediumIssues} medium-severity issues found. `
    }
    if (lowIssues > 0) {
      summary += `ℹ️ ${lowIssues} low-severity issues found. `
    }
    if (results.length === 0) {
      summary += '✅ No security issues detected.'
    }

    return {
      timestamp: new Date().toISOString(),
      totalIssues: results.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      results,
      summary
    }
  }

  /**
   * Test specific input for XSS vulnerabilities
   */
  public testXSSInput(input: string): SecurityScanResult[] {
    const results: SecurityScanResult[] = []
    
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^>]*>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi
    ]

    xssPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        results.push({
          category: 'XSS Vulnerability',
          severity: 'high',
          issue: `Potential XSS pattern detected`,
          description: `Input contains potentially dangerous XSS pattern: ${pattern.source}`,
          recommendation: 'Sanitize input and validate against XSS patterns',
          location: 'user input',
          evidence: { input: input.substring(0, 100), pattern: pattern.source }
        })
      }
    })

    return results
  }

  /**
   * Export security report
   */
  public exportReport(report: SecurityReport): void {
    const reportData = JSON.stringify(report, null, 2)
    const blob = new Blob([reportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `security-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Export singleton instance
export const securityTools = SecurityTools.getInstance()

// Convenience functions
export const runSecurityScan = () => securityTools.runSecurityScan()
export const testXSSInput = (input: string) => securityTools.testXSSInput(input)
export const exportSecurityReport = (report: SecurityReport) => securityTools.exportReport(report)

// React hook for security tools
export const useSecurityTools = () => {
  return {
    runSecurityScan,
    testXSSInput,
    exportSecurityReport
  }
} 