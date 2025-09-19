-- AI Model as a Service - Tenant Admin Functions
-- Run this AFTER running 006_tenant_admin_rls_policies.sql

-- =============================================
-- TENANT MANAGEMENT FUNCTIONS (Superadmin Only)
-- =============================================

-- Function to create a new tenant (superadmin only)
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
BEGIN
  -- Check if current user is superadmin
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
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

-- Function to get all tenants (superadmin only)
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
BEGIN
  -- Check if current user is superadmin
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
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
  LEFT JOIN public.tenant_users tu_owner ON t.id = tu_owner.tenant_id AND tu_owner.role = 'owner'
  LEFT JOIN public.user_profiles up ON tu_owner.user_id = up.id
  GROUP BY t.id, t.name, t.slug, t.description, t.subscription_plan, 
           t.subscription_status, t.max_users, t.max_api_calls_per_month, 
           t.is_active, t.created_at, up.email
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TENANT USER MANAGEMENT FUNCTIONS
-- =============================================

-- Function to invite user to tenant
CREATE OR REPLACE FUNCTION public.invite_user_to_tenant(
  target_tenant_id UUID,
  target_user_id UUID,
  target_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is tenant admin
  IF NOT public.is_tenant_admin(target_tenant_id) THEN
    RAISE EXCEPTION 'Access denied: Tenant admin privileges required';
  END IF;
  
  -- Get current user's role in this tenant
  SELECT role INTO current_user_role
  FROM public.tenant_users
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid();
  
  -- Only owners can invite admins
  IF target_role = 'admin' AND current_user_role != 'owner' THEN
    RAISE EXCEPTION 'Only tenant owners can invite admins';
  END IF;
  
  -- Insert or update tenant user
  INSERT INTO public.tenant_users (tenant_id, user_id, role, invited_by, joined_at)
  VALUES (target_tenant_id, target_user_id, target_role, auth.uid(), NOW())
  ON CONFLICT (tenant_id, user_id) 
  DO UPDATE SET 
    role = target_role,
    invited_by = auth.uid(),
    joined_at = NOW(),
    is_active = true,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove user from tenant
CREATE OR REPLACE FUNCTION public.remove_user_from_tenant(
  target_tenant_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
BEGIN
  -- Check if current user is tenant admin
  IF NOT public.is_tenant_admin(target_tenant_id) THEN
    RAISE EXCEPTION 'Access denied: Tenant admin privileges required';
  END IF;
  
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM public.tenant_users
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid();
  
  -- Get target user's role
  SELECT role INTO target_user_role
  FROM public.tenant_users
  WHERE tenant_id = target_tenant_id AND user_id = target_user_id;
  
  -- Only owners can remove admins
  IF target_user_role = 'admin' AND current_user_role != 'owner' THEN
    RAISE EXCEPTION 'Only tenant owners can remove admins';
  END IF;
  
  -- Can't remove the last owner
  IF target_user_role = 'owner' THEN
    IF (SELECT COUNT(*) FROM public.tenant_users 
        WHERE tenant_id = target_tenant_id AND role = 'owner' AND is_active = true) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from tenant';
    END IF;
  END IF;
  
  -- Deactivate user
  UPDATE public.tenant_users 
  SET is_active = false, updated_at = NOW()
  WHERE tenant_id = target_tenant_id AND user_id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TENANT ANALYTICS FUNCTIONS
-- =============================================

-- Function to get tenant statistics
CREATE OR REPLACE FUNCTION public.get_tenant_statistics(target_tenant_id UUID)
RETURNS TABLE (
  total_members BIGINT,
  active_members BIGINT,
  total_api_keys BIGINT,
  active_api_keys BIGINT,
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  requests_today BIGINT,
  tokens_today BIGINT,
  cost_today NUMERIC,
  requests_this_month BIGINT,
  tokens_this_month BIGINT,
  cost_this_month NUMERIC
) AS $$
BEGIN
  -- Check if current user has access to this tenant
  IF NOT (public.is_superadmin() OR public.is_tenant_admin(target_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT tu.id)::BIGINT as total_members,
    COUNT(DISTINCT CASE WHEN tu.is_active THEN tu.id END)::BIGINT as active_members,
    COUNT(DISTINCT tak.id)::BIGINT as total_api_keys,
    COUNT(DISTINCT CASE WHEN tak.is_active THEN tak.id END)::BIGINT as active_api_keys,
    COUNT(tus.id)::BIGINT as total_requests,
    COALESCE(SUM(tus.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(tus.cost_usd), 0)::NUMERIC as total_cost,
    COUNT(CASE WHEN tus.created_at >= CURRENT_DATE THEN tus.id END)::BIGINT as requests_today,
    COALESCE(SUM(CASE WHEN tus.created_at >= CURRENT_DATE THEN tus.total_tokens END), 0)::BIGINT as tokens_today,
    COALESCE(SUM(CASE WHEN tus.created_at >= CURRENT_DATE THEN tus.cost_usd END), 0)::NUMERIC as cost_today,
    COUNT(CASE WHEN tus.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN tus.id END)::BIGINT as requests_this_month,
    COALESCE(SUM(CASE WHEN tus.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN tus.total_tokens END), 0)::BIGINT as tokens_this_month,
    COALESCE(SUM(CASE WHEN tus.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN tus.cost_usd END), 0)::NUMERIC as cost_this_month
  FROM public.tenant_users tu
  LEFT JOIN public.tenant_api_keys tak ON tu.tenant_id = tak.tenant_id
  LEFT JOIN public.tenant_usage_stats tus ON tu.tenant_id = tus.tenant_id
  WHERE tu.tenant_id = target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant billing summary
CREATE OR REPLACE FUNCTION public.get_tenant_billing_summary(target_tenant_id UUID)
RETURNS TABLE (
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  total_api_calls BIGINT,
  total_tokens BIGINT,
  total_cost_usd NUMERIC,
  subscription_fee_usd NUMERIC,
  total_amount_usd NUMERIC,
  payment_status TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if current user has access to this tenant
  IF NOT (public.is_superadmin() OR public.is_tenant_owner(target_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges';
  END IF;
  
  RETURN QUERY
  SELECT 
    tb.billing_period_start,
    tb.billing_period_end,
    tb.total_api_calls,
    tb.total_tokens,
    tb.total_cost_usd,
    tb.subscription_fee_usd,
    tb.total_amount_usd,
    tb.payment_status,
    tb.payment_date
  FROM public.tenant_billing tb
  WHERE tb.tenant_id = target_tenant_id
  ORDER BY tb.billing_period_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TENANT MENU STRUCTURE FUNCTIONS
-- =============================================

-- Function to get tenant admin menu structure
CREATE OR REPLACE FUNCTION public.get_tenant_admin_menu(target_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
  is_owner BOOLEAN;
  is_admin BOOLEAN;
  menu_structure JSONB;
BEGIN
  -- Check if current user has access to this tenant
  IF NOT public.is_tenant_member(target_tenant_id) THEN
    RAISE EXCEPTION 'Access denied: Not a member of this tenant';
  END IF;
  
  -- Get user's role in this tenant
  SELECT role INTO user_role
  FROM public.tenant_users
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid() AND is_active = true;
  
  is_owner := (user_role = 'owner');
  is_admin := (user_role IN ('owner', 'admin'));
  
  -- Build menu structure based on role
  menu_structure := jsonb_build_object(
    'tenant_id', target_tenant_id,
    'user_role', user_role,
    'sections', jsonb_build_array(
      -- Dashboard section (all members)
      jsonb_build_object(
        'id', 'dashboard',
        'title', 'Dashboard',
        'icon', 'dashboard',
        'path', '/tenant/dashboard',
        'enabled', true
      ),
      -- API section (all members)
      jsonb_build_object(
        'id', 'api',
        'title', 'API Management',
        'icon', 'api',
        'path', '/tenant/api',
        'enabled', true,
        'subsections', jsonb_build_array(
          jsonb_build_object('title', 'API Keys', 'path', '/tenant/api/keys'),
          jsonb_build_object('title', 'Usage Stats', 'path', '/tenant/api/usage'),
          jsonb_build_object('title', 'Documentation', 'path', '/tenant/api/docs')
        )
      ),
      -- Billing section (owners only)
      jsonb_build_object(
        'id', 'billing',
        'title', 'Billing',
        'icon', 'billing',
        'path', '/tenant/billing',
        'enabled', is_owner,
        'subsections', jsonb_build_array(
          jsonb_build_object('title', 'Current Usage', 'path', '/tenant/billing/usage'),
          jsonb_build_object('title', 'Payment History', 'path', '/tenant/billing/history'),
          jsonb_build_object('title', 'Subscription', 'path', '/tenant/billing/subscription')
        )
      ),
      -- Configuration section (admins only)
      jsonb_build_object(
        'id', 'configuration',
        'title', 'Configuration',
        'icon', 'settings',
        'path', '/tenant/configuration',
        'enabled', is_admin,
        'subsections', jsonb_build_array(
          jsonb_build_object('title', 'Team Members', 'path', '/tenant/configuration/team'),
          jsonb_build_object('title', 'Permissions', 'path', '/tenant/configuration/permissions'),
          jsonb_build_object('title', 'Settings', 'path', '/tenant/configuration/settings')
        )
      )
    )
  );
  
  RETURN menu_structure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
