-- Fix existing data before applying role constraint
-- This migration fixes any existing data that violates the role constraint

-- First, let's see what roles exist in the database
SELECT DISTINCT role FROM public.user_profiles;

-- Update any invalid roles to 'user' (the default)
UPDATE public.user_profiles 
SET role = 'user' 
WHERE role NOT IN ('user', 'admin', 'superadmin', 'tenant_admin');

-- Update any tenantadmin@tin.info users to have tenant_admin role
UPDATE public.user_profiles 
SET role = 'tenant_admin' 
WHERE email = 'tenantadmin@tin.info';

-- Verify the data is now clean
SELECT 
  role,
  COUNT(*) as count
FROM public.user_profiles 
GROUP BY role
ORDER BY role;
