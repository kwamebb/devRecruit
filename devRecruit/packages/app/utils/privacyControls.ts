/**
 * Privacy Controls System for DevRecruit
 * 
 * This system provides:
 * - GDPR compliance features
 * - Data export functionality
 * - Account deletion with grace period
 * - Privacy settings management
 * - Data retention policies
 */

import { supabase } from '../lib/supabase'
import { errorHandler } from './errorHandler'

export interface UserDataExport {
  profile: any
  authData: any
  activityLogs: any[]
  uploadedFiles: string[]
  exportDate: string
  exportVersion: string
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'limited'
  showEmail: boolean
  showGithub: boolean
  allowDirectMessages: boolean
  allowProjectInvites: boolean
  dataProcessingConsent: boolean
  marketingConsent: boolean
  analyticsConsent: boolean
}

export interface AccountDeletionRequest {
  userId: string
  requestDate: string
  scheduledDeletionDate: string
  reason?: string
  status: 'pending' | 'cancelled' | 'completed'
}

class PrivacyControlsManager {
  private static instance: PrivacyControlsManager
  private readonly GRACE_PERIOD_DAYS = 30

  private constructor() {}

  static getInstance(): PrivacyControlsManager {
    if (!PrivacyControlsManager.instance) {
      PrivacyControlsManager.instance = new PrivacyControlsManager()
    }
    return PrivacyControlsManager.instance
  }

  /**
   * Export all user data in GDPR-compliant format
   */
  async exportUserData(userId: string): Promise<{ success: boolean; data?: UserDataExport; error?: string }> {
    try {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        return { success: false, error: 'Authentication required' }
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        const errorResponse = errorHandler.handleError(profileError, { 
          userId, 
          action: 'data_export',
          component: 'privacy_controls' 
        })
        return { success: false, error: errorResponse.userMessage }
      }

      // Get auth data (limited to non-sensitive information)
      const authData = {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        provider: user.app_metadata?.provider
      }

      // Get activity logs (if implemented)
      const activityLogs: any[] = []
      // TODO: Implement activity logging system
      // const { data: logs } = await supabase
      //   .from('activity_logs')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .order('created_at', { ascending: false })

      // Get uploaded files list
      const uploadedFiles: string[] = []
      try {
        const { data: files } = await supabase.storage
          .from('profile-pictures')
          .list('', { search: userId })
        
        if (files) {
          uploadedFiles.push(...files.map(file => file.name))
        }
      } catch (storageError) {
        // Non-critical error, continue with export
        console.warn('Could not retrieve file list:', storageError)
      }

      const exportData: UserDataExport = {
        profile: this.sanitizeProfileForExport(profile),
        authData,
        activityLogs,
        uploadedFiles,
        exportDate: new Date().toISOString(),
        exportVersion: '1.0'
      }

      // Log the export request
      await this.logPrivacyAction(userId, 'data_export', 'User exported their data')

      return { success: true, data: exportData }

    } catch (error) {
      const errorResponse = errorHandler.handleError(error, { 
        userId, 
        action: 'data_export',
        component: 'privacy_controls' 
      })
      return { success: false, error: errorResponse.userMessage }
    }
  }

  /**
   * Request account deletion with grace period
   */
  async requestAccountDeletion(
    userId: string, 
    reason?: string
  ): Promise<{ success: boolean; deletionDate?: string; error?: string }> {
    try {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        return { success: false, error: 'Authentication required' }
      }

      // Check if there's already a pending deletion request
      const { data: existingRequest } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        return { 
          success: false, 
          error: 'Account deletion already requested. Check your email for details.' 
        }
      }

      // Calculate deletion date (30 days from now)
      const deletionDate = new Date()
      deletionDate.setDate(deletionDate.getDate() + this.GRACE_PERIOD_DAYS)

      // Create deletion request
      const deletionRequest: Partial<AccountDeletionRequest> = {
        userId,
        requestDate: new Date().toISOString(),
        scheduledDeletionDate: deletionDate.toISOString(),
        reason,
        status: 'pending'
      }

      const { error: insertError } = await supabase
        .from('account_deletion_requests')
        .insert([deletionRequest])

      if (insertError) {
        const errorResponse = errorHandler.handleError(insertError, { 
          userId, 
          action: 'account_deletion_request',
          component: 'privacy_controls' 
        })
        return { success: false, error: errorResponse.userMessage }
      }

      // Update profile to mark as pending deletion
      await supabase
        .from('profiles')
        .update({ 
          account_status: 'pending_deletion',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      // Log the deletion request
      await this.logPrivacyAction(userId, 'deletion_requested', `Account deletion requested. Reason: ${reason || 'Not specified'}`)

      // TODO: Send confirmation email
      // await this.sendDeletionConfirmationEmail(user.email, deletionDate)

      return { 
        success: true, 
        deletionDate: deletionDate.toISOString() 
      }

    } catch (error) {
      const errorResponse = errorHandler.handleError(error, { 
        userId, 
        action: 'account_deletion_request',
        component: 'privacy_controls' 
      })
      return { success: false, error: errorResponse.userMessage }
    }
  }

  /**
   * Cancel account deletion request (within grace period)
   */
  async cancelAccountDeletion(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        return { success: false, error: 'Authentication required' }
      }

      // Find pending deletion request
      const { data: deletionRequest, error: findError } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

      if (findError || !deletionRequest) {
        return { success: false, error: 'No pending deletion request found' }
      }

      // Check if still within grace period
      const scheduledDate = new Date(deletionRequest.scheduledDeletionDate)
      const now = new Date()
      
      if (now >= scheduledDate) {
        return { success: false, error: 'Grace period has expired. Please contact support.' }
      }

      // Cancel the deletion request
      const { error: updateError } = await supabase
        .from('account_deletion_requests')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'pending')

      if (updateError) {
        const errorResponse = errorHandler.handleError(updateError, { 
          userId, 
          action: 'cancel_account_deletion',
          component: 'privacy_controls' 
        })
        return { success: false, error: errorResponse.userMessage }
      }

      // Restore profile status
      await supabase
        .from('profiles')
        .update({ 
          account_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      // Log the cancellation
      await this.logPrivacyAction(userId, 'deletion_cancelled', 'Account deletion request cancelled')

      return { success: true }

    } catch (error) {
      const errorResponse = errorHandler.handleError(error, { 
        userId, 
        action: 'cancel_account_deletion',
        component: 'privacy_controls' 
      })
      return { success: false, error: errorResponse.userMessage }
    }
  }

  /**
   * Get privacy settings for user
   */
  async getPrivacySettings(userId: string): Promise<{ success: boolean; settings?: PrivacySettings; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        return { success: false, error: 'Authentication required' }
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', userId)
        .single()

      if (profileError) {
        const errorResponse = errorHandler.handleError(profileError, { 
          userId, 
          action: 'get_privacy_settings',
          component: 'privacy_controls' 
        })
        return { success: false, error: errorResponse.userMessage }
      }

      // Default privacy settings
      const defaultSettings: PrivacySettings = {
        profileVisibility: 'public',
        showEmail: false,
        showGithub: true,
        allowDirectMessages: true,
        allowProjectInvites: true,
        dataProcessingConsent: true,
        marketingConsent: false,
        analyticsConsent: true
      }

      const settings = profile?.privacy_settings || defaultSettings

      return { success: true, settings }

    } catch (error) {
      const errorResponse = errorHandler.handleError(error, { 
        userId, 
        action: 'get_privacy_settings',
        component: 'privacy_controls' 
      })
      return { success: false, error: errorResponse.userMessage }
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string, 
    settings: Partial<PrivacySettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        return { success: false, error: 'Authentication required' }
      }

      // Get current settings
      const currentResult = await this.getPrivacySettings(userId)
      if (!currentResult.success) {
        return { success: false, error: currentResult.error }
      }

      // Merge with new settings
      const updatedSettings = { ...currentResult.settings, ...settings }

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          privacy_settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        const errorResponse = errorHandler.handleError(updateError, { 
          userId, 
          action: 'update_privacy_settings',
          component: 'privacy_controls' 
        })
        return { success: false, error: errorResponse.userMessage }
      }

      // Log the settings update
      await this.logPrivacyAction(userId, 'privacy_settings_updated', 'Privacy settings updated')

      return { success: true }

    } catch (error) {
      const errorResponse = errorHandler.handleError(error, { 
        userId, 
        action: 'update_privacy_settings',
        component: 'privacy_controls' 
      })
      return { success: false, error: errorResponse.userMessage }
    }
  }

  /**
   * Get account deletion status
   */
  async getAccountDeletionStatus(userId: string): Promise<{ 
    success: boolean; 
    status?: 'none' | 'pending' | 'cancelled' | 'completed';
    scheduledDate?: string;
    daysRemaining?: number;
    error?: string;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        return { success: false, error: 'Authentication required' }
      }

      const { data: deletionRequest } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requestDate', { ascending: false })
        .limit(1)
        .single()

      if (!deletionRequest) {
        return { success: true, status: 'none' }
      }

      if (deletionRequest.status === 'pending') {
        const scheduledDate = new Date(deletionRequest.scheduledDeletionDate)
        const now = new Date()
        const daysRemaining = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return {
          success: true,
          status: 'pending',
          scheduledDate: deletionRequest.scheduledDeletionDate,
          daysRemaining: Math.max(0, daysRemaining)
        }
      }

      return { success: true, status: deletionRequest.status }

    } catch (error) {
      const errorResponse = errorHandler.handleError(error, { 
        userId, 
        action: 'get_deletion_status',
        component: 'privacy_controls' 
      })
      return { success: false, error: errorResponse.userMessage }
    }
  }

  /**
   * Sanitize profile data for export
   */
  private sanitizeProfileForExport(profile: any): any {
    // Remove sensitive internal fields
    const { 
      created_at, 
      updated_at, 
      account_status,
      privacy_settings,
      ...publicProfile 
    } = profile

    return {
      ...publicProfile,
      accountCreated: created_at,
      lastUpdated: updated_at,
      privacySettings: privacy_settings
    }
  }

  /**
   * Log privacy-related actions
   */
  private async logPrivacyAction(userId: string, action: string, details: string): Promise<void> {
    try {
      // TODO: Implement privacy action logging
      // This would go to a separate audit log table
      console.log(`Privacy Action [${userId}]: ${action} - ${details}`)
      
      // In production, you might want to log to external service
      // await supabase
      //   .from('privacy_audit_log')
      //   .insert([{
      //     user_id: userId,
      //     action,
      //     details,
      //     timestamp: new Date().toISOString(),
      //     ip_address: req?.ip,
      //     user_agent: req?.headers['user-agent']
      //   }])
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Failed to log privacy action:', error)
    }
  }
}

// Export singleton instance
export const privacyControls = PrivacyControlsManager.getInstance()

// Convenience functions
export const exportUserData = (userId: string) => privacyControls.exportUserData(userId)
export const requestAccountDeletion = (userId: string, reason?: string) => 
  privacyControls.requestAccountDeletion(userId, reason)
export const cancelAccountDeletion = (userId: string) => privacyControls.cancelAccountDeletion(userId)
export const getPrivacySettings = (userId: string) => privacyControls.getPrivacySettings(userId)
export const updatePrivacySettings = (userId: string, settings: Partial<PrivacySettings>) => 
  privacyControls.updatePrivacySettings(userId, settings)
export const getAccountDeletionStatus = (userId: string) => privacyControls.getAccountDeletionStatus(userId)

// React hook for privacy controls
export const usePrivacyControls = () => {
  return {
    exportUserData,
    requestAccountDeletion,
    cancelAccountDeletion,
    getPrivacySettings,
    updatePrivacySettings,
    getAccountDeletionStatus
  }
} 