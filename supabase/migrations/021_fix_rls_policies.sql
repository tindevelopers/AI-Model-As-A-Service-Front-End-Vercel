-- Fix RLS policies to allow tenant admin setup
-- This migration addresses the RLS policy issues preventing tenant admin creation

-- Step 1: Temporarily disable RLS for user_profiles to allow setup
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create a more permissive RLS policy for user_profiles
-- Allow users to read their own profile and admins to read all profiles
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role IN ('superadmin', 'tenant_admin')
    )
  );

-- Allow users to insert their own profile (for first-time setup)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to insert/update any profile
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role IN ('superadmin', 'tenant_admin')
    )
  );

-- Step 3: Fix tenant_users RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view own tenant access" ON public.tenant_users;
DROP POLICY IF EXISTS "Admins can view all tenant access" ON public.tenant_users;

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

-- Step 4: Create tenant admin user if auth user exists
DO $$
DECLARE
  auth_user_id UUID;
  existing_profile RECORD;
BEGIN
  -- Try to find an existing user with tenantadmin@tin.info email
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'tenantadmin@tin.info' 
  LIMIT 1;
  
  -- If auth user exists, create profile
  IF auth_user_id IS NOT NULL THEN
    -- Check if user profile exists
    SELECT * INTO existing_profile 
    FROM public.user_profiles 
    WHERE id = auth_user_id;
    
    -- If profile doesn't exist, create it
    IF existing_profile IS NULL THEN
      INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        auth_user_id,
        'tenantadmin@tin.info',
        'Tenant Admin',
        'tenant_admin',
        true,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created tenant admin profile for user %', auth_user_id;
    ELSE
      -- Update existing profile to ensure correct role
      UPDATE public.user_profiles 
      SET 
        role = 'tenant_admin',
        full_name = 'Tenant Admin',
        is_active = true,
        updated_at = NOW()
      WHERE id = auth_user_id;
      
      RAISE NOTICE 'Updated tenant admin profile for user %', auth_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'No auth user found with email tenantadmin@tin.info';
  END IF;
END $$;

-- Step 5: Ensure test tenant exists
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

-- Step 6: Associate tenant admin with test tenant
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

-- Step 7: Re-enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Verify the setup
SELECT 
  'Setup Verification' as status,
  up.email,
  up.role,
  up.full_name,
  up.is_active,
  CASE 
    WHEN tu.id IS NOT NULL THEN 'Has tenant access'
    ELSE 'No tenant access'
  END as tenant_access
FROM public.user_profiles up
LEFT JOIN public.tenant_users tu ON up.id = tu.user_id
WHERE up.email = 'tenantadmin@tin.info'
ORDER BY up.email;
