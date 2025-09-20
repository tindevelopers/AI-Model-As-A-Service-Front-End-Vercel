-- Create tenant admin user in auth.users (this must be done first)
-- Note: This will create the user in Supabase Auth

-- Step 1: Create the user in auth.users table
-- We need to use the Supabase Auth API or dashboard for this
-- For now, let's prepare the user profile and tenant association

-- Step 2: Update user profile with tenant_admin role
UPDATE public.user_profiles 
SET 
  role = 'tenant_admin',
  full_name = 'Tenant Admin',
  updated_at = NOW()
WHERE email = 'tenantadmin@tin.info';

-- If the user doesn't exist in user_profiles, create them
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
  'tenantadmin@tin.info',
  'Tenant Admin',
  'tenant_admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE email = 'tenantadmin@tin.info'
);

-- Step 3: Associate with test tenant as admin
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
  'admin',
  '["tenant:read", "tenant:write", "tenant:delete", "users:read", "users:write", "api_keys:read", "api_keys:write"]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_users 
  WHERE user_id = (SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')
);

-- Verify the setup
SELECT 
  'User Profile' as component,
  email,
  role,
  full_name,
  is_active
FROM public.user_profiles 
WHERE email = 'tenantadmin@tin.info'

UNION ALL

SELECT 
  'Tenant Association' as component,
  t.name as email,
  tu.role,
  t.slug as full_name,
  tu.is_active
FROM public.tenant_users tu
JOIN public.tenants t ON tu.tenant_id = t.id
JOIN public.user_profiles up ON tu.user_id = up.id
WHERE up.email = 'tenantadmin@tin.info';
