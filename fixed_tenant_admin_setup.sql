-- CORRECTED: Complete Tenant Admin Setup
-- Run these commands in your Supabase SQL Editor

-- =============================================
-- STEP 1: Fix the role system (add tenant_admin role)
-- =============================================

-- Drop the existing check constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new check constraint with all four roles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'superadmin', 'tenant_admin'));

-- =============================================
-- STEP 2: Create tenant admin user profile
-- =============================================

-- Insert tenant admin user profile
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'tenantadmin@tin.info',
  'Tenant Admin',
  'tenant_admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE email = 'tenantadmin@tin.info'
);

-- =============================================
-- STEP 3: Create test tenant
-- =============================================

-- Create test tenant if it doesn't exist
INSERT INTO public.tenants (
  id,
  name,
  slug,
  description,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Test Tenant',
  'test-tenant',
  'Test tenant for tenant admin testing',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE slug = 'test-tenant'
);

-- =============================================
-- STEP 4: Associate tenant admin with test tenant
-- =============================================

-- Associate tenant admin with test tenant (using 'admin' role in tenant_users)
INSERT INTO public.tenant_users (
  id,
  tenant_id,
  user_id,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.tenants WHERE slug = 'test-tenant'),
  (SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info'),
  'admin',  -- tenant_users role (NOT tenant_admin)
  '["tenant:read", "tenant:write", "tenant:delete", "users:read", "users:write", "api_keys:read", "api_keys:write"]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_users 
  WHERE user_id = (SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')
);

-- =============================================
-- STEP 5: Create helper functions
-- =============================================

-- Function to check if a user is a tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND role = 'tenant_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's platform role
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

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check the role system
SELECT 'Role system fixed' as status, 
       constraint_name, 
       check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_role_check';

-- Check tenant admin user
SELECT 'Tenant admin user' as status, email, role, full_name 
FROM public.user_profiles 
WHERE email = 'tenantadmin@tin.info';

-- Check test tenant
SELECT 'Test tenant' as status, name, slug, is_active 
FROM public.tenants 
WHERE slug = 'test-tenant';

-- Check tenant association
SELECT 'Tenant association' as status, 
       tu.role as tenant_role,
       up.email,
       t.name as tenant_name
FROM public.tenant_users tu
JOIN public.user_profiles up ON tu.user_id = up.id
JOIN public.tenants t ON tu.tenant_id = t.id
WHERE up.email = 'tenantadmin@tin.info';
