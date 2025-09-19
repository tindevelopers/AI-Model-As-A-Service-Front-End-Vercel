-- AI Model as a Service - Tenant Admin Setup Test Script
-- Run this AFTER running all migration files to test the tenant admin functionality

-- =============================================
-- TEST DATA SETUP
-- =============================================

-- Create test users (these would normally be created through Supabase Auth)
-- Note: In a real scenario, these would be created through the auth system
-- This is just for testing the database structure

-- Test superadmin user (assuming auth.users entry exists)
-- INSERT INTO public.user_profiles (id, email, full_name, role) 
-- VALUES ('11111111-1111-1111-1111-111111111111', 'superadmin@test.com', 'Super Admin', 'superadmin');

-- Test regular user (assuming auth.users entry exists)
-- INSERT INTO public.user_profiles (id, email, full_name, role) 
-- VALUES ('22222222-2222-2222-2222-222222222222', 'user@test.com', 'Regular User', 'user');

-- =============================================
-- TEST SUPERADMIN FUNCTIONS
-- =============================================

-- Test 1: Check if superadmin functions work
-- SELECT public.is_superadmin() as is_superadmin_check;
-- SELECT public.is_admin() as is_admin_check;

-- Test 2: Create a test tenant (requires superadmin role)
-- SELECT public.create_tenant(
--   'Test Company',
--   'test-company',
--   'A test tenant for development',
--   '22222222-2222-2222-2222-222222222222' -- owner user ID
-- ) as new_tenant_id;

-- Test 3: Get all tenants (superadmin only)
-- SELECT * FROM public.get_all_tenants();

-- =============================================
-- TEST TENANT ADMIN FUNCTIONS
-- =============================================

-- Test 4: Get tenant admin menu structure
-- SELECT public.get_tenant_admin_menu('tenant-id-here') as menu_structure;

-- Test 5: Get tenant statistics
-- SELECT * FROM public.get_tenant_statistics('tenant-id-here');

-- Test 6: Get tenant billing summary
-- SELECT * FROM public.get_tenant_billing_summary('tenant-id-here');

-- =============================================
-- TEST TENANT USER MANAGEMENT
-- =============================================

-- Test 7: Invite user to tenant
-- SELECT public.invite_user_to_tenant(
--   'tenant-id-here',
--   'user-id-here',
--   'member'
-- ) as invite_result;

-- Test 8: Get user's tenant roles
-- SELECT * FROM public.get_user_tenant_roles();

-- =============================================
-- VERIFY TABLE STRUCTURE
-- =============================================

-- Check that all tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_users', 'tenant_api_keys', 'tenant_usage_stats', 'tenant_billing')
ORDER BY tablename;

-- Check that all functions were created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%tenant%'
ORDER BY routine_name;

-- =============================================
-- VERIFY RLS POLICIES
-- =============================================

-- Check RLS policies for tenant tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_users', 'tenant_api_keys', 'tenant_usage_stats', 'tenant_billing')
ORDER BY tablename, policyname;

-- =============================================
-- SAMPLE QUERIES FOR FRONTEND INTEGRATION
-- =============================================

-- Example: Get tenant admin menu for frontend
-- This would be called from the frontend with proper authentication
/*
SELECT public.get_tenant_admin_menu('your-tenant-id-here') as menu_data;
*/

-- Example: Get user's accessible tenants
/*
SELECT * FROM public.get_user_tenant_roles();
*/

-- Example: Get tenant statistics for dashboard
/*
SELECT * FROM public.get_tenant_statistics('your-tenant-id-here');
*/

-- =============================================
-- NOTES FOR IMPLEMENTATION
-- =============================================

/*
IMPLEMENTATION NOTES:

1. AUTHENTICATION:
   - All functions require proper Supabase authentication
   - User roles are checked through the user_profiles table
   - RLS policies enforce access control at the database level

2. FRONTEND INTEGRATION:
   - Use Supabase client to call these functions
   - Handle authentication errors gracefully
   - Cache menu structure on the frontend

3. API ENDPOINTS NEEDED:
   - GET /api/tenant/menu - Get tenant admin menu
   - GET /api/tenant/stats - Get tenant statistics
   - GET /api/tenant/billing - Get billing information
   - POST /api/tenant/invite - Invite user to tenant
   - DELETE /api/tenant/remove-user - Remove user from tenant

4. SECURITY CONSIDERATIONS:
   - All functions use SECURITY DEFINER
   - RLS policies provide additional security layer
   - Input validation should be done at the API level

5. TESTING:
   - Test with different user roles
   - Verify RLS policies work correctly
   - Test error handling for unauthorized access
*/
