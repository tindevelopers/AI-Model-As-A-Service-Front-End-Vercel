-- Fix role constraint to allow tenant_admin
-- This migration ensures the role constraint allows tenant_admin

-- Drop the existing check constraint if it exists
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new check constraint with all four roles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'superadmin', 'tenant_admin'));

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  consrc as constraint_definition
FROM pg_constraint 
WHERE conname = 'user_profiles_role_check';
