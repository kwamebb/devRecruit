# DevRecruit Monitoring & Security Tools - Usage Guide

## 🚀 **Getting Started**

### **1. Console Logging System**

#### **Basic Import and Setup**
```typescript
// In any component or utility file
import { 
  logInfo, 
  logWarning, 
  logError, 
  logSecurityEvent, 
  measureAsync, 
  measure,
  useMonitoring 
} from '../utils/monitoring'
```

#### **Replace Existing Console Statements**
```typescript
// ❌ Before (basic console logging)
console.log('User logged in')
console.error('API error:', error)
console.warn('Slow response')

// ✅ After (enhanced structured logging)
logInfo('User logged in successfully', { 
  userId: user.id, 
  loginMethod: 'oauth',
  timestamp: new Date().toISOString()
})

logError({
  message: 'API request failed',
  level: 'error',
  component: 'api_client',
  userId: user?.id,
  timestamp: new Date().toISOString(),
  metadata: { 
    endpoint: '/api/profiles',
    statusCode: error.status,
    errorMessage: error.message
  }
})

logWarning('API response time exceeded threshold', {
  responseTime: 2500,
  threshold: 2000,
  endpoint: '/api/data'
})
```

#### **Security Event Logging**
```typescript
// Log privacy-related actions
logSecurityEvent({
  type: 'privacy_change',
  severity: 'medium',
  userId: user.id,
  details: { 
    setting: 'profileVisibility', 
    oldValue: 'public', 
    newValue: 'private' 
  },
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
})

// Log authentication events
logSecurityEvent({
  type: 'authentication',
  severity: 'high',
  userId: user.id,
  details: { 
    action: 'login_attempt',
    success: true,
    method: 'github_oauth'
  },
  timestamp: new Date().toISOString()
})
```

#### **Performance Monitoring**
```typescript
// Monitor async database operations
const fetchUserProfile = async (userId: string) => {
  return await measureAsync('fetch_user_profile', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }, { userId, operation: 'database_read' })
}

// Monitor synchronous operations
const processUserData = (userData: any) => {
  return measure('process_user_data', () => {
    // Your data processing logic
    return {
      ...userData,
      processed: true,
      processedAt: new Date().toISOString()
    }
  }, { dataSize: JSON.stringify(userData).length })
}
```

#### **React Hook Usage**
```typescript
import React, { useEffect } from 'react'
import { useMonitoring } from '../utils/monitoring'

const MyComponent = () => {
  const { logInfo, logError, getStats, exportLogs } = useMonitoring()
  
  useEffect(() => {
    logInfo('Component mounted', { 
      component: 'MyComponent',
      props: Object.keys(props)
    })
    
    return () => {
      logInfo('Component unmounted', { component: 'MyComponent' })
    }
  }, [])
  
  const handleAction = async () => {
    try {
      logInfo('User action started', { action: 'profile_update' })
      
      // Your action logic here
      await updateProfile()
      
      logInfo('User action completed successfully', { action: 'profile_update' })
    } catch (error) {
      logError({
        message: 'User action failed',
        level: 'error',
        component: 'MyComponent',
        timestamp: new Date().toISOString(),
        metadata: { action: 'profile_update', error: error.message }
      })
    }
  }
  
  const handleExportLogs = () => {
    const logs = exportLogs()
    console.log('📊 Exported logs:', JSON.parse(logs))
  }
  
  const handleViewStats = () => {
    const stats = getStats()
    console.log('📈 Current stats:', stats)
  }
  
  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      <button onClick={handleExportLogs}>Export Logs</button>
      <button onClick={handleViewStats}>View Stats</button>
    </div>
  )
}
```

### **2. Development-Time Security Tools**

#### **Basic Security Scanning**
```typescript
// In browser console or component
import { 
  runSecurityScan, 
  testXSSInput, 
  exportSecurityReport,
  useSecurityTools 
} from '../utils/securityTools'

// Run comprehensive security scan
const performSecurityScan = async () => {
  console.log('🔍 Starting security scan...')
  
  const report = await runSecurityScan()
  
  console.log('📋 Security scan results:')
  console.log(`Total issues: ${report.totalIssues}`)
  console.log(`Critical: ${report.criticalIssues}`)
  console.log(`High: ${report.highIssues}`)
  console.log(`Medium: ${report.mediumIssues}`)
  console.log(`Low: ${report.lowIssues}`)
  console.log(`Summary: ${report.summary}`)
  
  // Export report for detailed review
  exportSecurityReport(report)
  
  return report
}

// Test specific inputs for XSS
const testUserInput = (input: string) => {
  const xssResults = testXSSInput(input)
  
  if (xssResults.length > 0) {
    console.warn('⚠️ XSS vulnerabilities detected:', xssResults)
  } else {
    console.log('✅ Input appears safe from XSS')
  }
  
  return xssResults
}
```

#### **React Component with Security Tools**
```typescript
import React, { useState } from 'react'
import { useSecurityTools } from '../utils/securityTools'
import { logSecurityEvent } from '../utils/monitoring'

const SecurityDashboard = () => {
  const { runSecurityScan, testXSSInput, exportSecurityReport } = useSecurityTools()
  const [scanResults, setScanResults] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [testInput, setTestInput] = useState('')
  
  const handleSecurityScan = async () => {
    setIsScanning(true)
    
    try {
      logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'low',
        details: { action: 'manual_security_scan_initiated' },
        timestamp: new Date().toISOString()
      })
      
      const report = await runSecurityScan()
      setScanResults(report)
      
      // Alert for critical issues
      if (report.criticalIssues > 0) {
        alert(`🚨 Critical security issues found: ${report.criticalIssues}`)
      }
      
      // Export report automatically
      exportSecurityReport(report)
      
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
      
    } catch (error) {
      console.error('Security scan failed:', error)
    } finally {
      setIsScanning(false)
    }
  }
  
  const handleTestInput = () => {
    const results = testXSSInput(testInput)
    
    if (results.length > 0) {
      alert(`⚠️ XSS vulnerabilities detected: ${results.length}`)
      console.warn('XSS test results:', results)
    } else {
      alert('✅ Input appears safe')
    }
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>🛡️ Security Tools Dashboard</h2>
      
      {/* Security Scan Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h3>🔍 Security Scan</h3>
        <button 
          onClick={handleSecurityScan}
          disabled={isScanning}
          style={{
            padding: '10px 20px',
            backgroundColor: isScanning ? '#94a3b8' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isScanning ? 'not-allowed' : 'pointer'
          }}
        >
          {isScanning ? 'Scanning...' : 'Run Security Scan'}
        </button>
        
        {scanResults && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
            <h4>📋 Scan Results</h4>
            <p><strong>Total Issues:</strong> {scanResults.totalIssues}</p>
            <p><strong>Critical:</strong> {scanResults.criticalIssues}</p>
            <p><strong>High:</strong> {scanResults.highIssues}</p>
            <p><strong>Medium:</strong> {scanResults.mediumIssues}</p>
            <p><strong>Low:</strong> {scanResults.lowIssues}</p>
            <p><strong>Summary:</strong> {scanResults.summary}</p>
          </div>
        )}
      </div>
      
      {/* XSS Testing Section */}
      <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h3>🧪 XSS Input Testing</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter input to test for XSS..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          />
          <button 
            onClick={handleTestInput}
            disabled={!testInput.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: testInput.trim() ? '#10b981' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: testInput.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Test Input
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          Try inputs like: &lt;script&gt;alert('xss')&lt;/script&gt; or javascript:alert('xss')
        </p>
      </div>
    </div>
  )
}

export default SecurityDashboard
```

### **3. Integration with Existing Components**

#### **Dashboard Integration Example**
```typescript
// In your existing dashboard component
import { logInfo, logSecurityEvent, measureAsync } from '../utils/monitoring'
import { runSecurityScan } from '../utils/securityTools'

// Enhanced privacy settings handler
const handlePrivacySettingChange = async (setting: keyof PrivacySettings, value: any) => {
  if (!user || !privacySettings) return
  
  // Log the privacy change
  logSecurityEvent({
    type: 'privacy_change',
    severity: 'medium',
    userId: user.id,
    details: { 
      setting, 
      oldValue: privacySettings[setting], 
      newValue: value 
    },
    timestamp: new Date().toISOString()
  })
  
  const updatedSettings = { ...privacySettings, [setting]: value }
  setPrivacySettings(updatedSettings)
  
  // Measure database update performance
  setIsSavingPrivacy(true)
  try {
    const result = await measureAsync('update_privacy_settings', async () => {
      return await privacyControls.updatePrivacySettings(user.id, { [setting]: value })
    }, { userId: user.id, setting, value })
    
    if (!result.success) {
      // Revert on error
      setPrivacySettings(privacySettings)
      logError({
        message: 'Failed to update privacy settings',
        level: 'error',
        component: 'privacy_controls',
        userId: user.id,
        timestamp: new Date().toISOString(),
        metadata: { setting, value, error: result.error }
      })
      Alert.alert('Error', result.error || 'Failed to update privacy settings')
    } else {
      logInfo('Privacy settings updated successfully', {
        userId: user.id,
        setting,
        newValue: value
      })
    }
  } catch (error) {
    // Revert on error
    setPrivacySettings(privacySettings)
    logError({
      message: 'Privacy settings update failed',
      level: 'error',
      component: 'privacy_controls',
      userId: user.id,
      timestamp: new Date().toISOString(),
      metadata: { setting, value, error: error.message }
    })
    Alert.alert('Error', 'Failed to update privacy settings')
  } finally {
    setIsSavingPrivacy(false)
  }
}
```

### **4. Browser Console Usage**

#### **Quick Commands for Development**
```javascript
// In browser console during development

// Run security scan
await runSecurityScan()

// Test XSS input
testXSSInput('<script>alert("test")</script>')

// Export logs
const logs = monitoring.exportLogs()
console.log('Logs:', JSON.parse(logs))

// Get current stats
const stats = monitoring.getStats()
console.log('Stats:', stats)

// Clear logs
monitoring.clearLogs()

// Log custom events
logInfo('Testing console logging', { test: true })
logSecurityEvent({
  type: 'suspicious_activity',
  severity: 'low',
  details: { action: 'manual_test' },
  timestamp: new Date().toISOString()
})
```

### **5. Automated Integration**

#### **Add to Your Development Workflow**
```typescript
// In your main app component or provider
import { useEffect } from 'react'
import { logInfo, runSecurityScan } from '../utils/monitoring'

const App = () => {
  useEffect(() => {
    // Log app startup
    logInfo('Application started', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
    
    // Run security scan on development startup
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        console.log('🔍 Running automatic security scan...')
        const report = await runSecurityScan()
        
        if (report.criticalIssues > 0 || report.highIssues > 0) {
          console.warn('⚠️ Security issues detected! Check the report.')
        }
      }, 5000) // Run after 5 seconds
    }
  }, [])
  
  // Rest of your app
}
```

## 🎯 **Quick Start Checklist**

### **Console Logging**
- [ ] Import monitoring functions in your components
- [ ] Replace console.log/error with structured logging
- [ ] Add performance monitoring to slow operations
- [ ] Log security events for privacy changes
- [ ] Use React hooks for component-level monitoring

### **Security Tools**
- [ ] Add security scan button to development interface
- [ ] Test XSS inputs during development
- [ ] Run security scans before deployments
- [ ] Export and review security reports
- [ ] Monitor for new security issues

### **Integration**
- [ ] Add monitoring to existing error handlers
- [ ] Integrate with privacy controls
- [ ] Add performance monitoring to database operations
- [ ] Set up automated security scanning

## 🚀 **Next Steps**

1. **Start with Basic Logging**: Replace a few console statements with structured logging
2. **Add Security Scanning**: Create a simple security dashboard component
3. **Monitor Performance**: Add performance monitoring to slow operations
4. **Review Logs**: Check the enhanced console output and exported logs
5. **Iterate**: Gradually add more monitoring and security checks

The systems are now ready to use! Start with basic logging and gradually add more features as you become comfortable with the tools. 