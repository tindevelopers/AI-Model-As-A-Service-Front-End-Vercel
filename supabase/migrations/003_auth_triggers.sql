-- AI Model as a Service - Authentication Triggers
-- Run this AFTER running 001_initial_schema.sql and 002_rls_policies.sql

-- =============================================
-- USER PROFILE CREATION TRIGGER
-- =============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- USER PROFILE UPDATE TRIGGER
-- =============================================

-- Function to sync user profile with auth changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email if it changed
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.user_profiles 
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  -- Update metadata if it changed
  IF OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
    UPDATE public.user_profiles 
    SET 
      full_name = COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        full_name
      ),
      avatar_url = COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        avatar_url
      ),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profile on user update
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- =============================================
-- USER DELETION CLEANUP TRIGGER
-- =============================================

-- Function to clean up user data on deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete user profile instead of hard delete
  UPDATE public.user_profiles 
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE id = OLD.id;
  
  -- Deactivate all user's API keys
  UPDATE public.api_keys 
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup on user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- =============================================
-- API KEY USAGE TRACKING
-- =============================================

-- Function to update API key last_used_at
CREATE OR REPLACE FUNCTION public.update_api_key_usage(key_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.api_keys 
  SET last_used_at = NOW()
  WHERE id = key_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
