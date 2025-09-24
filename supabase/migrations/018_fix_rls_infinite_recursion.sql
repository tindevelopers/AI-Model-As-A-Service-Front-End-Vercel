-- Fix infinite recursion in RLS policies
-- This migration fixes the RLS policies that cause infinite recursion

-- =============================================
-- DROP PROBLEMATIC POLICIES
-- =============================================

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_profiles;

-- =============================================
-- CREATE FIXED POLICIES
-- =============================================

-- Create a simple admin check function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use a direct check without referencing user_profiles table in policy
  RETURN auth.jwt() ->> 'role' = 'superadmin' OR auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simple tenant admin check function
CREATE OR REPLACE FUNCTION public.is_user_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use a direct check without referencing user_profiles table in policy
  RETURN auth.jwt() ->> 'role' = 'tenant_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can view all profiles (fixed to avoid recursion)
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    -- Allow if user is admin/superadmin based on JWT claims
    auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'tenant_admin')
    OR 
    -- Allow users to view their own profile
    auth.uid() = id
  );

-- Admins can update user roles (fixed to avoid recursion)
CREATE POLICY "Admins can update user roles" ON public.user_profiles
  FOR UPDATE USING (
    -- Allow if user is admin/superadmin based on JWT claims
    auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'tenant_admin')
    OR 
    -- Allow users to update their own profile (but not role)
    (auth.uid() = id AND role = 'user')
  );

-- =============================================
-- TENANT POLICIES (FIXED)
-- =============================================

-- Drop existing tenant policies first
DROP POLICY IF EXISTS "Superadmins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Superadmins can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Superadmins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Superadmins can delete tenants" ON public.tenants;

-- Superadmins can view all tenants
CREATE POLICY "Superadmins can view all tenants" ON public.tenants
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Superadmins can create tenants
CREATE POLICY "Superadmins can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Superadmins can update tenants
CREATE POLICY "Superadmins can update tenants" ON public.tenants
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Superadmins can delete tenants
CREATE POLICY "Superadmins can delete tenants" ON public.tenants
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- =============================================
-- TENANT USERS POLICIES (FIXED)
-- =============================================

-- Drop existing tenant users policies first
DROP POLICY IF EXISTS "Superadmins can view all tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Superadmins can create tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Superadmins can update tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Superadmins can delete tenant users" ON public.tenant_users;

-- Superadmins can view all tenant users
CREATE POLICY "Superadmins can view all tenant users" ON public.tenant_users
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Superadmins can create tenant users
CREATE POLICY "Superadmins can create tenant users" ON public.tenant_users
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Superadmins can update tenant users
CREATE POLICY "Superadmins can update tenant users" ON public.tenant_users
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- Superadmins can delete tenant users
CREATE POLICY "Superadmins can delete tenant users" ON public.tenant_users
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

-- =============================================
-- API KEYS POLICIES (FIXED)
-- =============================================

-- Drop problematic API key policies
DROP POLICY IF EXISTS "Admins can view all API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can disable API keys" ON public.api_keys;

-- Create fixed API key policies
CREATE POLICY "Admins can view all API keys" ON public.api_keys
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'tenant_admin')
    OR 
    auth.uid() = user_id
  );

CREATE POLICY "Admins can disable API keys" ON public.api_keys
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'tenant_admin')
    OR 
    auth.uid() = user_id
  );

-- =============================================
-- USAGE STATS POLICIES (FIXED)
-- =============================================

-- Drop problematic usage stats policies
DROP POLICY IF EXISTS "Admins can view all usage stats" ON public.usage_stats;

-- Create fixed usage stats policies
CREATE POLICY "Admins can view all usage stats" ON public.usage_stats
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'tenant_admin')
    OR 
    auth.uid() = user_id
  );
