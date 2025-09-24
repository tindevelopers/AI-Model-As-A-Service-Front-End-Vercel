-- Fix Role System - Add tenant_admin role
-- This migration adds the missing tenant_admin role to the user_profiles table

-- First, drop the existing check constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new check constraint with all four roles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'superadmin', 'tenant_admin'));

-- Create a comment explaining the role system
COMMENT ON COLUMN public.user_profiles.role IS 'Platform-level roles: user (basic user), admin (platform admin), superadmin (platform super admin), tenant_admin (tenant administrator)';

-- Update any existing tenant_admin users to have the correct role
-- (This handles the case where someone manually created a tenant_admin user)
UPDATE public.user_profiles 
SET role = 'tenant_admin' 
WHERE email = 'tenantadmin@tin.info' AND role != 'tenant_admin';

-- Create a function to check if a user is a tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND role = 'tenant_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's platform role
CREATE OR REPLACE FUNCTION public.get_user_platform_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.user_profiles 
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
