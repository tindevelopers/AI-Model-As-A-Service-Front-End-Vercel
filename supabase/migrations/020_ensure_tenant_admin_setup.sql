-- Ensure tenant admin user is properly set up
-- This migration fixes any issues with the tenant admin user setup

-- Step 1: Create a function to ensure tenant admin user exists
CREATE OR REPLACE FUNCTION ensure_tenant_admin_user_exists()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  profile_exists BOOLEAN,
  tenant_access BOOLEAN
) AS $$
DECLARE
  auth_user_id UUID;
  profile_exists BOOLEAN := false;
  tenant_access BOOLEAN := false;
BEGIN
  -- Try to find the auth user
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'tenantadmin@tin.info' 
  LIMIT 1;
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found with email tenantadmin@tin.info';
    RETURN;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE id = auth_user_id
  ) INTO profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
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
    profile_exists := true;
  ELSE
    -- Update existing profile to ensure correct role
    UPDATE public.user_profiles 
    SET 
      role = 'tenant_admin',
      full_name = 'Tenant Admin',
      is_active = true,
      updated_at = NOW()
    WHERE id = auth_user_id;
  END IF;
  
  -- Check if user has tenant access
  SELECT EXISTS(
    SELECT 1 FROM public.tenant_users tu
    JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = auth_user_id 
    AND tu.is_active = true 
    AND t.is_active = true
  ) INTO tenant_access;
  
  -- If no tenant access, create test tenant and associate user
  IF NOT tenant_access THEN
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
    
    -- Associate user with test tenant
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
      auth_user_id,
      'tenant_admin',
      '["tenant:read", "tenant:write", "tenant:delete", "users:read", "users:write", "api_keys:read", "api_keys:write"]'::jsonb,
      true,
      NOW(),
      NOW()
    FROM public.tenants t
    WHERE t.slug = 'test-tenant'
    AND NOT EXISTS (
      SELECT 1 FROM public.tenant_users tu 
      WHERE tu.user_id = auth_user_id AND tu.tenant_id = t.id
    );
    
    tenant_access := true;
  END IF;
  
  RETURN QUERY SELECT auth_user_id, 'tenantadmin@tin.info', 'tenant_admin', profile_exists, tenant_access;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT * FROM ensure_tenant_admin_user_exists();

-- Step 2: Verify the setup
SELECT 
  'Tenant Admin Setup Verification' as status,
  up.email,
  up.role,
  up.full_name,
  up.is_active,
  COUNT(tu.id) as tenant_count,
  STRING_AGG(t.name, ', ') as tenant_names
FROM public.user_profiles up
LEFT JOIN public.tenant_users tu ON up.id = tu.user_id AND tu.is_active = true
LEFT JOIN public.tenants t ON tu.tenant_id = t.id AND t.is_active = true
WHERE up.email = 'tenantadmin@tin.info'
GROUP BY up.id, up.email, up.role, up.full_name, up.is_active;

-- Step 3: Test the get_user_tenant_roles function
-- This will only work if we're authenticated as the tenant admin user
-- But we can at least verify the function exists and has the right structure
SELECT 
  'Function Test' as test_type,
  proname as function_name,
  proargnames as argument_names,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_user_tenant_roles';

-- Clean up the function
DROP FUNCTION ensure_tenant_admin_user_exists();
