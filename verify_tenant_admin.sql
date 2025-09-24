-- Quick verification script for tenant admin setup
-- Run this in Supabase SQL Editor or locally

-- Check if user profile exists and has correct role
SELECT 
  'User Profile Status' as check_type,
  email,
  role,
  full_name,
  is_active,
  created_at
FROM public.user_profiles 
WHERE email = 'tenantadmin@tin.info';

-- Check tenant association
SELECT 
  'Tenant Association Status' as check_type,
  t.name as tenant_name,
  t.slug as tenant_slug,
  tu.role as tenant_role,
  tu.permissions,
  tu.is_active,
  tu.created_at
FROM public.tenant_users tu
JOIN public.tenants t ON tu.tenant_id = t.id
JOIN public.user_profiles up ON tu.user_id = up.id
WHERE up.email = 'tenantadmin@tin.info';

-- Check if test tenant exists
SELECT 
  'Test Tenant Status' as check_type,
  name,
  slug,
  description,
  is_active,
  created_at
FROM public.tenants 
WHERE slug = 'test-tenant';

-- Test the helper functions
SELECT 
  'Helper Functions Test' as check_type,
  is_tenant_admin((SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')) as is_tenant_admin_result,
  get_user_platform_role((SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')) as platform_role_result;
