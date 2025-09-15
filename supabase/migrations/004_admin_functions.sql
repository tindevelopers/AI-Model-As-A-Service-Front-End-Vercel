-- AI Model as a Service - Admin Functions
-- Run this AFTER running all previous migration files

-- =============================================
-- ADMIN USER MANAGEMENT FUNCTIONS
-- =============================================

-- Function to promote user to admin (superadmin only)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_exists BOOLEAN;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can promote users to admin';
  END IF;
  
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = target_user_id) 
  INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Promote user
  UPDATE public.user_profiles 
  SET role = 'admin', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to user (superadmin only)
CREATE OR REPLACE FUNCTION public.demote_admin_to_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can demote admins';
  END IF;
  
  -- Check target user role
  SELECT role INTO target_user_role 
  FROM public.user_profiles 
  WHERE id = target_user_id;
  
  IF target_user_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot demote superadmin';
  END IF;
  
  -- Demote user
  UPDATE public.user_profiles 
  SET role = 'user', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Function to get user statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  admin_users BIGINT,
  users_today BIGINT,
  users_this_week BIGINT,
  users_this_month BIGINT
) AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    COUNT(CASE WHEN up.is_active THEN 1 END)::BIGINT as active_users,
    COUNT(CASE WHEN up.role IN ('admin', 'superadmin') THEN 1 END)::BIGINT as admin_users,
    COUNT(CASE WHEN up.created_at >= CURRENT_DATE THEN 1 END)::BIGINT as users_today,
    COUNT(CASE WHEN up.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::BIGINT as users_this_week,
    COUNT(CASE WHEN up.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::BIGINT as users_this_month
  FROM public.user_profiles up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_usage_statistics()
RETURNS TABLE (
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  requests_today BIGINT,
  tokens_today BIGINT,
  cost_today NUMERIC,
  requests_this_week BIGINT,
  tokens_this_week BIGINT,
  cost_this_week NUMERIC
) AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COALESCE(SUM(us.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(us.cost_usd), 0)::NUMERIC as total_cost,
    COUNT(CASE WHEN us.created_at >= CURRENT_DATE THEN 1 END)::BIGINT as requests_today,
    COALESCE(SUM(CASE WHEN us.created_at >= CURRENT_DATE THEN us.total_tokens END), 0)::BIGINT as tokens_today,
    COALESCE(SUM(CASE WHEN us.created_at >= CURRENT_DATE THEN us.cost_usd END), 0)::NUMERIC as cost_today,
    COUNT(CASE WHEN us.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::BIGINT as requests_this_week,
    COALESCE(SUM(CASE WHEN us.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN us.total_tokens END), 0)::BIGINT as tokens_this_week,
    COALESCE(SUM(CASE WHEN us.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN us.cost_usd END), 0)::NUMERIC as cost_this_week
  FROM public.usage_stats us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top users by usage (admin only)
CREATE OR REPLACE FUNCTION public.get_top_users_by_usage(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  last_request_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id as user_id,
    up.email,
    up.full_name,
    COUNT(us.id)::BIGINT as total_requests,
    COALESCE(SUM(us.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(us.cost_usd), 0)::NUMERIC as total_cost,
    MAX(us.created_at) as last_request_at
  FROM public.user_profiles up
  LEFT JOIN public.usage_stats us ON up.id = us.user_id
  WHERE up.is_active = true
  GROUP BY up.id, up.email, up.full_name
  ORDER BY total_requests DESC, total_tokens DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- API KEY MANAGEMENT FUNCTIONS
-- =============================================

-- Function to get all API keys (admin only)
CREATE OR REPLACE FUNCTION public.get_all_api_keys()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  name TEXT,
  key_prefix TEXT,
  permissions TEXT[],
  is_active BOOLEAN,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    ak.id,
    ak.user_id,
    up.email as user_email,
    ak.name,
    ak.key_prefix,
    ak.permissions,
    ak.is_active,
    ak.last_used_at,
    ak.expires_at,
    ak.created_at
  FROM public.api_keys ak
  JOIN public.user_profiles up ON ak.user_id = up.id
  ORDER BY ak.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable API key (admin only)
CREATE OR REPLACE FUNCTION public.admin_disable_api_key(key_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  UPDATE public.api_keys 
  SET is_active = false, updated_at = NOW()
  WHERE id = key_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
