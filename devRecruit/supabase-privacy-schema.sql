-- DevRecruit Privacy Controls Database Schema
-- This script adds the necessary tables and columns for GDPR compliance and privacy features

-- Add privacy-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profileVisibility": "public",
  "showEmail": false,
  "showGithub": true,
  "allowDirectMessages": true,
  "allowProjectInvites": true,
  "dataProcessingConsent": true,
  "marketingConsent": false,
  "analyticsConsent": true
}'::jsonb;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'pending_deletion', 'suspended', 'deleted'));

-- Add index for account status queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- Create account deletion requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_date TIMESTAMPTZ NOT NULL,
  actual_deletion_date TIMESTAMPTZ,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for deletion requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled_date ON account_deletion_requests(scheduled_deletion_date);

-- Create privacy audit log table
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS idx_privacy_audit_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_timestamp ON privacy_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_action ON privacy_audit_log(action);

-- Create data export requests table (for tracking export requests)
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  export_url TEXT, -- Temporary signed URL for download
  export_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for export requests
CREATE INDEX IF NOT EXISTS idx_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_export_requests_expires_at ON data_export_requests(export_expires_at);

-- Row Level Security Policies

-- Account deletion requests policies
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests"
ON account_deletion_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests"
ON account_deletion_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deletion requests"
ON account_deletion_requests FOR UPDATE
USING (auth.uid() = user_id);

-- Privacy audit log policies (read-only for users)
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own privacy audit log"
ON privacy_audit_log FOR SELECT
USING (auth.uid() = user_id);

-- Data export requests policies
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export requests"
ON data_export_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export requests"
ON data_export_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Functions for automated cleanup

-- Function to automatically delete expired export files
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired exports
  UPDATE data_export_requests 
  SET status = 'expired'
  WHERE status = 'completed' 
    AND export_expires_at < NOW()
    AND status != 'expired';
    
  -- Log cleanup action
  INSERT INTO privacy_audit_log (user_id, action, details)
  SELECT 
    user_id,
    'export_cleanup',
    'Expired data export automatically cleaned up'
  FROM data_export_requests 
  WHERE status = 'expired' 
    AND export_expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Function to process scheduled account deletions
CREATE OR REPLACE FUNCTION process_scheduled_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deletion_record RECORD;
BEGIN
  -- Find accounts scheduled for deletion
  FOR deletion_record IN 
    SELECT user_id, id 
    FROM account_deletion_requests 
    WHERE status = 'pending' 
      AND scheduled_deletion_date <= NOW()
  LOOP
    -- Log the deletion
    INSERT INTO privacy_audit_log (user_id, action, details)
    VALUES (
      deletion_record.user_id,
      'account_deleted',
      'Account automatically deleted after grace period'
    );
    
    -- Mark deletion as completed
    UPDATE account_deletion_requests 
    SET 
      status = 'completed',
      actual_deletion_date = NOW(),
      updated_at = NOW()
    WHERE id = deletion_record.id;
    
    -- Update profile status
    UPDATE profiles 
    SET 
      account_status = 'deleted',
      updated_at = NOW()
    WHERE id = deletion_record.user_id;
    
    -- Note: Actual user deletion from auth.users should be handled carefully
    -- and might require additional business logic
  END LOOP;
END;
$$;

-- Create scheduled jobs (if using pg_cron extension)
-- Note: These would need to be set up by a superuser
-- SELECT cron.schedule('cleanup-exports', '0 2 * * *', 'SELECT cleanup_expired_exports();');
-- SELECT cron.schedule('process-deletions', '0 3 * * *', 'SELECT process_scheduled_deletions();');

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_account_deletion_requests_updated_at 
  BEFORE UPDATE ON account_deletion_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE account_deletion_requests IS 'Tracks user account deletion requests with grace period';
COMMENT ON TABLE privacy_audit_log IS 'Audit log for privacy-related actions (GDPR compliance)';
COMMENT ON TABLE data_export_requests IS 'Tracks user data export requests and download links';

COMMENT ON COLUMN profiles.privacy_settings IS 'User privacy preferences and consent settings';
COMMENT ON COLUMN profiles.account_status IS 'Current account status (active, pending_deletion, suspended, deleted)';

COMMENT ON FUNCTION cleanup_expired_exports() IS 'Automatically cleans up expired data export files';
COMMENT ON FUNCTION process_scheduled_deletions() IS 'Processes accounts scheduled for deletion after grace period';

-- Grant necessary permissions
-- Note: Adjust these based on your specific role setup
-- GRANT SELECT, INSERT, UPDATE ON account_deletion_requests TO authenticated;
-- GRANT SELECT ON privacy_audit_log TO authenticated;
-- GRANT SELECT, INSERT ON data_export_requests TO authenticated;

-- Sample data for testing (remove in production)
-- INSERT INTO privacy_audit_log (user_id, action, details) 
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'schema_setup',
--   'Privacy controls schema initialized'
-- );

-- Verification queries (uncomment to test)
-- SELECT 'Privacy schema setup completed' as status;
-- SELECT COUNT(*) as deletion_requests_count FROM account_deletion_requests;
-- SELECT COUNT(*) as audit_log_count FROM privacy_audit_log;
-- SELECT COUNT(*) as export_requests_count FROM data_export_requests; 