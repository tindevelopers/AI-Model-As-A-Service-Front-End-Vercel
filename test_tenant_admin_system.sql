-- COMPREHENSIVE TENANT ADMIN SYSTEM TEST
-- Run this in your Supabase SQL Editor to verify everything is working

-- =============================================
-- TEST 1: Verify Role System is Fixed
-- =============================================

SELECT 'TEST 1: Role System Check' as test_name;

SELECT 
  'Role constraint check' as test,
  cc.constraint_name, 
  cc.check_clause 
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_profiles' AND tc.constraint_name = 'user_profiles_role_check';

-- =============================================
-- TEST 2: Check if tenant_admin role exists in user_profiles
-- =============================================

SELECT 'TEST 2: Tenant Admin Role Check' as test_name;

SELECT DISTINCT
  'Available roles in user_profiles' as test,
  role
FROM public.user_profiles
ORDER BY role;

-- =============================================
-- TEST 3: Check if tenantadmin@tin.info user exists
-- =============================================

SELECT 'TEST 3: Tenant Admin User Check' as test_name;

SELECT 
  'User profile check' as test,
  up.id,
  up.email,
  up.role,
  up.full_name,
  up.is_active,
  au.email_confirmed_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE up.email = 'tenantadmin@tin.info';

-- =============================================
-- TEST 4: Check Test Tenant
-- =============================================

SELECT 'TEST 4: Test Tenant Check' as test_name;

SELECT 
  'Test tenant check' as test,
  id,
  name,
  slug,
  is_active,
  created_at
FROM public.tenants 
WHERE slug = 'test-tenant';

-- =============================================
-- TEST 5: Check Tenant Association
-- =============================================

SELECT 'TEST 5: Tenant Association Check' as test_name;

SELECT 
  'Tenant association check' as test,
  tu.id,
  tu.role as tenant_role,
  tu.permissions,
  tu.is_active,
  up.email,
  t.name as tenant_name
FROM public.tenant_users tu
JOIN public.user_profiles up ON tu.user_id = up.id
JOIN public.tenants t ON tu.tenant_id = t.id
WHERE up.email = 'tenantadmin@tin.info';

-- =============================================
-- TEST 6: Test Helper Functions
-- =============================================

SELECT 'TEST 6: Helper Functions Test' as test_name;

-- Test is_tenant_admin function
SELECT 
  'is_tenant_admin function test' as test,
  public.is_tenant_admin((SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')) as is_tenant_admin_result;

-- Test get_user_platform_role function
SELECT 
  'get_user_platform_role function test' as test,
  public.get_user_platform_role((SELECT id FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')) as platform_role;

-- =============================================
-- TEST 7: Test get_user_tenant_roles function
-- =============================================

SELECT 'TEST 7: Tenant Roles Function Test' as test_name;

-- This should work if the user exists and has tenant associations
SELECT 
  'get_user_tenant_roles function test' as test,
  public.get_user_tenant_roles() as tenant_roles;

-- =============================================
-- TEST 8: Verify All Required Tables Exist
-- =============================================

SELECT 'TEST 8: Table Structure Check' as test_name;

SELECT 
  'Table existence check' as test,
  table_name,
  CASE 
    WHEN table_name IN ('user_profiles', 'tenants', 'tenant_users', 'tenant_api_keys') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'tenants', 'tenant_users', 'tenant_api_keys')
ORDER BY table_name;

-- =============================================
-- SUMMARY
-- =============================================

SELECT 'SUMMARY: System Status' as test_name;

SELECT 
  'System Status Summary' as summary,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints cc
      JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'user_profiles' AND tc.constraint_name = 'user_profiles_role_check' AND cc.check_clause LIKE '%tenant_admin%'
    )
    THEN '✅ Role system includes tenant_admin'
    ELSE '❌ Role system missing tenant_admin'
  END as role_system_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE email = 'tenantadmin@tin.info')
    THEN '✅ Tenant admin user exists'
    ELSE '❌ Tenant admin user missing'
  END as user_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'test-tenant')
    THEN '✅ Test tenant exists'
    ELSE '❌ Test tenant missing'
  END as tenant_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.user_profiles up ON tu.user_id = up.id
      WHERE up.email = 'tenantadmin@tin.info'
    )
    THEN '✅ Tenant association exists'
    ELSE '❌ Tenant association missing'
  END as association_status;
