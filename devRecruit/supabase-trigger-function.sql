-- DevRecruit: Trigger function to handle new user profiles
-- This function creates a profile record when a new user signs up via OAuth

-- Create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a new profile record for the user
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    avatar_url,
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
    -- Extract username from GitHub metadata or use a default
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'login',
      NEW.raw_user_meta_data->>'preferred_username',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    -- Extract full name from metadata
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name'
    ),
    NEW.email,
    -- Extract avatar URL from metadata
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    -- Extract GitHub username specifically
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'login'
    ),
    -- Initialize GitHub stats from metadata if available
    COALESCE(
      (NEW.raw_user_meta_data->>'public_repos')::INTEGER,
      0
    ),
    -- Estimate commits based on repos (will be updated later via API)
    COALESCE(
      (NEW.raw_user_meta_data->>'public_repos')::INTEGER * 10,
      0
    ),
    -- Mark onboarding as incomplete initially
    false,
    'active',
    -- Default privacy settings
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

-- Create the trigger (drop first if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Enable RLS (Row Level Security) on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON public.profiles(github_username) WHERE github_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status); 