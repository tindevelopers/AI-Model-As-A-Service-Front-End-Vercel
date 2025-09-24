-- Simple tenant admin setup without complex functions
-- This migration directly sets up the tenant admin user

-- Step 1: Temporarily disable RLS for user_profiles to allow setup
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create tenant admin user profile if auth user exists
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'tenantadmin@tin.info',
  'Tenant Admin',
  'tenant_admin',
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'tenantadmin@tin.info'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = au.id
  );

-- Step 3: Update existing profile if it exists but has wrong role
UPDATE public.user_profiles 
SET 
  role = 'tenant_admin',
  full_name = 'Tenant Admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'tenantadmin@tin.info'
  AND role != 'tenant_admin';

-- Step 4: Create test tenant if it doesn't exist
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

-- Step 5: Associate tenant admin with test tenant
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
  t.id,
  up.id,
  'tenant_admin',
  '["tenant:read", "tenant:write", "tenant:delete", "users:read", "users:write", "api_keys:read", "api_keys:write"]'::jsonb,
  true,
  NOW(),
  NOW()
FROM public.user_profiles up
CROSS JOIN public.tenants t
WHERE up.email = 'tenantadmin@tin.info'
  AND t.slug = 'test-tenant'
  AND NOT EXISTS (
    SELECT 1 FROM public.tenant_users tu 
    WHERE tu.user_id = up.id AND tu.tenant_id = t.id
  );

-- Step 6: Re-enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create permissive RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile (for first-time setup)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role IN ('superadmin', 'tenant_admin')
    )
  );

-- Step 8: Fix tenant_users RLS policies
DROP POLICY IF EXISTS "Users can view own tenant access" ON public.tenant_users;
DROP POLICY IF EXISTS "Admins can view all tenant access" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can insert own tenant access" ON public.tenant_users;
DROP POLICY IF EXISTS "Admins can manage all tenant access" ON public.tenant_users;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view own tenant access" ON public.tenant_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tenant access" ON public.tenant_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role IN ('superadmin', 'tenant_admin')
    )
  );

CREATE POLICY "Users can insert own tenant access" ON public.tenant_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tenant access" ON public.tenant_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role IN ('superadmin', 'tenant_admin')
    )
  );

-- Step 9: Verify the setup
SELECT 
  'Tenant Admin Setup Complete' as status,
  up.email as user_email,
  up.role,
  up.full_name,
  up.is_active,
  COUNT(tu.id) as tenant_count
FROM public.user_profiles up
LEFT JOIN public.tenant_users tu ON up.id = tu.user_id AND tu.is_active = true
WHERE up.email = 'tenantadmin@tin.info'
GROUP BY up.id, up.email, up.role, up.full_name, up.is_active;
