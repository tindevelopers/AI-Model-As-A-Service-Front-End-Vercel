-- AI Model as a Service - Add Tenant Admin Role
-- Run this AFTER running all previous migration files
-- This adds the tenant_admin role to the system-wide user profiles

-- =============================================
-- UPDATE USER PROFILES ROLE CONSTRAINT
-- =============================================

-- First, drop the existing constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new constraint with tenant_admin role
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('superadmin', 'admin', 'tenant_admin', 'user'));

-- =============================================
-- UPDATE ADMIN FUNCTIONS TO SUPPORT TENANT ADMIN
-- =============================================

-- Function to promote user to tenant admin (superadmin only)
CREATE OR REPLACE FUNCTION public.promote_user_to_tenant_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_exists BOOLEAN;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can promote users to tenant admin';
  END IF;
  
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = target_user_id) 
  INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Promote user to tenant admin
  UPDATE public.user_profiles 
  SET role = 'tenant_admin', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote tenant admin to user (superadmin only)
CREATE OR REPLACE FUNCTION public.demote_tenant_admin_to_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can demote tenant admins';
  END IF;
  
  -- Check target user role
  SELECT role INTO target_user_role 
  FROM public.user_profiles 
  WHERE id = target_user_id;
  
  IF target_user_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot demote superadmin';
  END IF;
  
  -- Demote user
  UPDATE public.user_profiles 
  SET role = 'user', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users with their roles (superadmin only)
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can view all users';
  END IF;
  
  -- Return all users
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new user with role (superadmin only)
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'user'
)
RETURNS TABLE (
  user_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  current_user_role TEXT;
  new_user_id UUID;
  new_auth_user_id UUID;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can create users';
  END IF;
  
  -- Validate role
  IF user_role NOT IN ('superadmin', 'admin', 'tenant_admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', user_role;
  END IF;
  
  -- Create auth user (this would typically be done through Supabase Auth)
  -- For now, we'll assume the user already exists in auth.users
  -- In a real implementation, you'd use the Supabase Admin API
  
  -- Check if user already exists in profiles
  SELECT id INTO new_user_id 
  FROM public.user_profiles 
  WHERE email = user_email;
  
  IF new_user_id IS NOT NULL THEN
    RETURN QUERY SELECT new_user_id, FALSE, 'User already exists';
    RETURN;
  END IF;
  
  -- Insert into user_profiles
  INSERT INTO public.user_profiles (email, full_name, role, is_active)
  VALUES (user_email, user_full_name, user_role, true)
  RETURNING id INTO new_user_id;
  
  RETURN QUERY SELECT new_user_id, TRUE, 'User created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user (superadmin only, but not superadmin)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can delete users';
  END IF;
  
  -- Check target user role
  SELECT role INTO target_user_role 
  FROM public.user_profiles 
  WHERE id = target_user_id;
  
  IF target_user_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot delete superadmin user';
  END IF;
  
  -- Delete user profile (this will cascade to related tables)
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
