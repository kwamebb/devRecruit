-- DevRecruit: Complete Profiles Table Fix
-- This script will fix your profiles table structure and ensure it works properly

-- First, let's see what we're working with
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if id column exists, if not add it
DO $$
BEGIN
    -- Check if id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'id'
    ) THEN
        -- Add id column as primary key
        ALTER TABLE public.profiles 
        ADD COLUMN id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added id column to profiles table';
    ELSE
        RAISE NOTICE 'ID column already exists';
    END IF;
END $$;

-- Check if username column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN username TEXT UNIQUE;
        
        RAISE NOTICE 'Added username column to profiles table';
    ELSE
        RAISE NOTICE 'Username column already exists';
    END IF;
END $$;

-- Check if about_me column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'about_me'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN about_me TEXT;
        
        RAISE NOTICE 'Added about_me column to profiles table';
    ELSE
        RAISE NOTICE 'About_me column already exists';
    END IF;
END $$;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON public.profiles(github_username) WHERE github_username IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Create or replace the trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    avatar_url,
    about_me,
    github_username,
    github_repository_count,
    github_commit_count,
    onboarding_completed,
    account_status,
    privacy_settings,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'login',
      NEW.raw_user_meta_data->>'preferred_username',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name'
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NULL, -- about_me starts empty
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'login'
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'public_repos')::INTEGER,
      0
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'public_repos')::INTEGER * 10,
      0
    ),
    false,
    'active',
    jsonb_build_object(
      'showEmail', false,
      'showGithub', true,
      'analyticsConsent', true
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now create a profile for your current user if it doesn't exist
-- Replace the user ID with your actual ID from the error messages
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  email,
  about_me,
  github_username,
  github_repository_count,
  github_commit_count,
  onboarding_completed,
  account_status,
  privacy_settings,
  created_at,
  updated_at
)
VALUES (
  '8a14493c-a2cb-4d47-ae5e-0852665443e8', -- Your user ID from the error
  'devrecruit_user',
  'DevRecruit User',
  'your.email@example.com',
  'Welcome to my DevRecruit profile! I''m passionate about coding and always looking for exciting projects to work on.',
  'your_github_username', -- Replace with your actual GitHub username
  0,
  0,
  true, -- Set to true so you can access the dashboard
  'active',
  '{"showEmail": false, "showGithub": true, "analyticsConsent": true}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  onboarding_completed = true,
  updated_at = NOW();

-- Verify the profile was created
SELECT id, username, email, github_username, onboarding_completed 
FROM public.profiles 
WHERE id = '8a14493c-a2cb-4d47-ae5e-0852665443e8';

-- Show all profiles to confirm everything is working
SELECT id, username, email, onboarding_completed, created_at FROM public.profiles; 