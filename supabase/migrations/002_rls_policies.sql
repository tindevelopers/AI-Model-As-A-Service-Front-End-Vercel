-- AI Model as a Service - Row Level Security Policies
-- Run this AFTER running 001_initial_schema.sql

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Admins can update user roles (except other admins)
CREATE POLICY "Admins can update user roles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    AND (
      -- Can't modify other admins unless you're superadmin
      role = 'user' OR 
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

-- =============================================
-- API KEYS POLICIES
-- =============================================

-- Users can manage their own API keys
CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all API keys (but not the actual key values)
CREATE POLICY "Admins can view all API keys" ON public.api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Admins can disable API keys
CREATE POLICY "Admins can disable API keys" ON public.api_keys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- =============================================
-- USAGE STATS POLICIES
-- =============================================

-- Users can view their own usage stats
CREATE POLICY "Users can view own usage stats" ON public.usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage stats (for API tracking)
CREATE POLICY "Users can insert own usage stats" ON public.usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all usage stats
CREATE POLICY "Admins can view all usage stats" ON public.usage_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- System can insert usage stats (for backend tracking)
CREATE POLICY "System can insert usage stats" ON public.usage_stats
  FOR INSERT WITH CHECK (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
