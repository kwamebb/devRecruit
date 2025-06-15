# Deploy Privacy Schema to Supabase

## 🚀 Quick Deployment Guide

To enable all privacy features in your DevRecruit application, you need to run the privacy schema in your Supabase database.

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your DevRecruit project
4. Navigate to the **SQL Editor** tab

### Step 2: Run Privacy Schema
1. Click **"New Query"**
2. Copy the entire contents of `supabase-privacy-schema.sql`
3. Paste it into the SQL editor
4. Click **"Run"** to execute the schema

### Step 3: Verify Installation
After running the schema, verify these tables exist:
- `profiles` (updated with privacy columns)
- `account_deletion_requests`
- `privacy_audit_log`
- `data_export_requests`

### Step 4: Test Privacy Features
1. Start your development server: `yarn dev`
2. Navigate to the Settings tab
3. Test privacy toggles
4. Try data export functionality
5. Verify settings save to database

## 🔧 Manual SQL Commands

If you prefer to run commands individually:

```sql
-- Add privacy settings column
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

-- Add account status column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' 
CHECK (account_status IN ('active', 'pending_deletion', 'suspended', 'deleted'));

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

-- Create privacy audit log table
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled_date ON account_deletion_requests(scheduled_deletion_date);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_created_at ON privacy_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_data_export_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_status ON data_export_requests(status);

-- Enable Row Level Security
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own deletion requests" ON account_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON account_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deletion requests" ON account_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own privacy audit log" ON privacy_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert privacy audit logs" ON privacy_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own data export requests" ON data_export_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data export requests" ON data_export_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data export requests" ON data_export_requests
  FOR UPDATE USING (auth.uid() = user_id);
```

## ✅ Verification Checklist

After deployment, verify:
- [ ] Privacy settings load in the Settings tab
- [ ] Toggle switches update the database
- [ ] Profile visibility options work
- [ ] Data export generates JSON file
- [ ] Account deletion shows warning
- [ ] All database tables exist
- [ ] RLS policies are active
- [ ] Indexes are created

## 🆘 Troubleshooting

### Common Issues:

**1. "Column already exists" error**
- This is normal if you've run the schema before
- The `IF NOT EXISTS` clauses prevent conflicts

**2. "Permission denied" error**
- Make sure you're running as the database owner
- Check that RLS policies allow the operations

**3. "Function not found" error**
- Ensure you're using a recent version of Supabase
- Some functions require specific PostgreSQL versions

**4. Privacy settings not loading**
- Check browser console for errors
- Verify the privacy_settings column exists
- Ensure RLS policies allow SELECT operations

### Getting Help:
- Check the Supabase logs in the dashboard
- Review the browser console for JavaScript errors
- Verify environment variables are set correctly
- Test database connections in the Supabase SQL editor

## 🎯 Next Steps

Once the schema is deployed:
1. Test all privacy features in development
2. Deploy to staging environment
3. Run user acceptance testing
4. Deploy to production
5. Monitor privacy audit logs
6. Set up automated backups

Your privacy implementation is now complete and ready for production use! 