-- Temporarily disable RLS to fix infinite recursion
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats DISABLE ROW LEVEL SECURITY;

-- Create a simple tenant admin user for testing
INSERT INTO public.user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'tenantadmin@tin.info',
  'Tenant Admin',
  'tenant_admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Create a test tenant
INSERT INTO public.tenants (id, name, slug, description, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Tenant',
  'test-tenant',
  'Test tenant for development',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Create tenant user relationship
INSERT INTO public.tenant_users (id, tenant_id, user_id, role, permissions, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'tenant_admin',
  ARRAY['tenant:read', 'tenant:write', 'tenant:delete', 'users:read', 'users:write', 'api_keys:read', 'api_keys:write'],
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
