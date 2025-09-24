-- Update tenant creation authorization to allow both superadmin and tenant_admin
-- This migration updates the create_tenant function to allow tenant_admin users

-- Update the create_tenant function to allow tenant_admin users
CREATE OR REPLACE FUNCTION public.create_tenant(
  tenant_name TEXT,
  tenant_slug TEXT,
  tenant_description TEXT DEFAULT NULL,
  owner_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
  target_owner_id UUID;
  user_role TEXT;
BEGIN
  -- Check if current user is superadmin or tenant_admin
  SELECT role INTO user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF user_role NOT IN ('superadmin', 'tenant_admin') THEN
    RAISE EXCEPTION 'Access denied: Superadmin or Tenant Admin privileges required';
  END IF;
  
  -- Use current user as owner if not specified
  target_owner_id := COALESCE(owner_user_id, auth.uid());
  
  -- Create tenant
  INSERT INTO public.tenants (name, slug, description, created_by)
  VALUES (tenant_name, tenant_slug, tenant_description, auth.uid())
  RETURNING id INTO new_tenant_id;
  
  -- Add owner to tenant
  INSERT INTO public.tenant_users (tenant_id, user_id, role, joined_at)
  VALUES (new_tenant_id, target_owner_id, 'owner', NOW());
  
  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_all_tenants function to allow tenant_admin users
CREATE OR REPLACE FUNCTION public.get_all_tenants()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  subscription_plan TEXT,
  subscription_status TEXT,
  max_users INTEGER,
  max_api_calls_per_month INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  owner_email TEXT,
  member_count BIGINT
) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if current user is superadmin or tenant_admin
  SELECT role INTO user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF user_role NOT IN ('superadmin', 'tenant_admin') THEN
    RAISE EXCEPTION 'Access denied: Superadmin or Tenant Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.description,
    t.subscription_plan,
    t.subscription_status,
    t.max_users,
    t.max_api_calls_per_month,
    t.is_active,
    t.created_at,
    up.email as owner_email,
    COUNT(tu.id) as member_count
  FROM public.tenants t
  LEFT JOIN public.tenant_users tu ON t.id = tu.tenant_id AND tu.is_active = true
  LEFT JOIN public.user_profiles up ON t.created_by = up.id
  GROUP BY t.id, t.name, t.slug, t.description, t.subscription_plan, 
           t.subscription_status, t.max_users, t.max_api_calls_per_month, 
           t.is_active, t.created_at, up.email
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
