-- Create tenant admin user and role
-- This script creates the tenant admin user in the online Supabase database

-- Insert tenant admin user profile
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'tenantadmin@tin.info',
  'Tenant Admin',
  'tenant_admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test tenant if it doesn't exist
INSERT INTO public.tenants (
  id,
  name,
  slug,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Test Tenant',
  'test-tenant',
  'Test tenant for tenant admin testing',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Associate tenant admin with test tenant
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
  u.id,
  'tenant_admin',
  '["tenant:read", "tenant:write", "tenant:delete", "users:read", "users:write", "api_keys:read", "api_keys:write"]'::jsonb,
  true,
  NOW(),
  NOW()
FROM public.user_profiles u
CROSS JOIN public.tenants t
WHERE u.email = 'tenantadmin@tin.info'
  AND t.slug = 'test-tenant'
  AND NOT EXISTS (
    SELECT 1 FROM public.tenant_users tu 
    WHERE tu.user_id = u.id AND tu.tenant_id = t.id
  );
