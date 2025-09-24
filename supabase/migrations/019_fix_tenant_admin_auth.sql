-- Fix tenant admin authentication issues
-- This migration ensures the tenant admin user is properly set up

-- First, let's check if we have any user profiles and what their structure looks like
-- We'll create a more robust tenant admin setup

-- Step 1: Ensure we have a proper tenant admin user profile
-- We'll use a more flexible approach that works with the actual auth user ID

-- Create a function to get or create tenant admin user
CREATE OR REPLACE FUNCTION ensure_tenant_admin_user()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  created BOOLEAN
) AS $$
DECLARE
  auth_user_id UUID;
  existing_profile RECORD;
BEGIN
  -- Try to find an existing user with tenantadmin@tin.info email
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'tenantadmin@tin.info' 
  LIMIT 1;
  
  -- If no auth user exists, we can't proceed
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found with email tenantadmin@tin.info';
    RETURN;
  END IF;
  
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
    
    RETURN QUERY SELECT auth_user_id, 'tenantadmin@tin.info', 'tenant_admin', true;
  ELSE
    -- Update existing profile to ensure correct role
    UPDATE public.user_profiles 
    SET 
      role = 'tenant_admin',
      full_name = 'Tenant Admin',
      is_active = true,
      updated_at = NOW()
    WHERE id = auth_user_id;
    
    RETURN QUERY SELECT auth_user_id, 'tenantadmin@tin.info', 'tenant_admin', false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT * FROM ensure_tenant_admin_user();

-- Step 2: Ensure test tenant exists
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

-- Step 3: Associate tenant admin with test tenant
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

-- Step 4: Create a superadmin user if needed (for testing)
-- This will help us test the full tenant management flow
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
  gen_random_uuid(),
  'superadmin@tin.info',
  'Super Admin',
  'superadmin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE email = 'superadmin@tin.info'
);

-- Step 5: Verify the setup
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
WHERE up.email IN ('tenantadmin@tin.info', 'superadmin@tin.info')
ORDER BY up.email;

-- Clean up the function
DROP FUNCTION ensure_tenant_admin_user();
