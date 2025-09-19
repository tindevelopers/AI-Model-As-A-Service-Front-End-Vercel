-- AI Model as a Service - Tenant Admin RLS Policies
-- Run this AFTER running 005_tenant_admin_schema.sql

-- =============================================
-- TENANTS POLICIES
-- =============================================

-- Superadmins can view all tenants
CREATE POLICY "Superadmins can view all tenants" ON public.tenants
  FOR SELECT USING (public.is_superadmin());

-- Superadmins can create tenants
CREATE POLICY "Superadmins can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (public.is_superadmin());

-- Superadmins can update all tenants
CREATE POLICY "Superadmins can update all tenants" ON public.tenants
  FOR UPDATE USING (public.is_superadmin());

-- Superadmins can delete tenants
CREATE POLICY "Superadmins can delete tenants" ON public.tenants
  FOR DELETE USING (public.is_superadmin());

-- Tenant owners and admins can view their tenant
CREATE POLICY "Tenant owners and admins can view their tenant" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenants.id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Tenant owners can update their tenant
CREATE POLICY "Tenant owners can update their tenant" ON public.tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenants.id 
      AND tu.user_id = auth.uid() 
      AND tu.role = 'owner'
      AND tu.is_active = true
    )
  );

-- =============================================
-- TENANT USERS POLICIES
-- =============================================

-- Superadmins can view all tenant users
CREATE POLICY "Superadmins can view all tenant users" ON public.tenant_users
  FOR SELECT USING (public.is_superadmin());

-- Superadmins can manage all tenant users
CREATE POLICY "Superadmins can manage all tenant users" ON public.tenant_users
  FOR ALL USING (public.is_superadmin());

-- Tenant owners and admins can view their tenant users
CREATE POLICY "Tenant owners and admins can view their tenant users" ON public.tenant_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Tenant owners and admins can manage their tenant users
CREATE POLICY "Tenant owners and admins can manage their tenant users" ON public.tenant_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Users can view their own tenant memberships
CREATE POLICY "Users can view their own tenant memberships" ON public.tenant_users
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- TENANT API KEYS POLICIES
-- =============================================

-- Superadmins can view all tenant API keys
CREATE POLICY "Superadmins can view all tenant API keys" ON public.tenant_api_keys
  FOR SELECT USING (public.is_superadmin());

-- Superadmins can manage all tenant API keys
CREATE POLICY "Superadmins can manage all tenant API keys" ON public.tenant_api_keys
  FOR ALL USING (public.is_superadmin());

-- Tenant owners and admins can view their tenant API keys
CREATE POLICY "Tenant owners and admins can view their tenant API keys" ON public.tenant_api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_api_keys.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Tenant owners and admins can manage their tenant API keys
CREATE POLICY "Tenant owners and admins can manage their tenant API keys" ON public.tenant_api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_api_keys.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- =============================================
-- TENANT USAGE STATS POLICIES
-- =============================================

-- Superadmins can view all tenant usage stats
CREATE POLICY "Superadmins can view all tenant usage stats" ON public.tenant_usage_stats
  FOR SELECT USING (public.is_superadmin());

-- Tenant owners and admins can view their tenant usage stats
CREATE POLICY "Tenant owners and admins can view their tenant usage stats" ON public.tenant_usage_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_usage_stats.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Users can view their own usage stats within their tenants
CREATE POLICY "Users can view their own tenant usage stats" ON public.tenant_usage_stats
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_usage_stats.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.is_active = true
    )
  );

-- System can insert tenant usage stats
CREATE POLICY "System can insert tenant usage stats" ON public.tenant_usage_stats
  FOR INSERT WITH CHECK (true);

-- =============================================
-- TENANT BILLING POLICIES
-- =============================================

-- Superadmins can view all tenant billing
CREATE POLICY "Superadmins can view all tenant billing" ON public.tenant_billing
  FOR SELECT USING (public.is_superadmin());

-- Superadmins can manage all tenant billing
CREATE POLICY "Superadmins can manage all tenant billing" ON public.tenant_billing
  FOR ALL USING (public.is_superadmin());

-- Tenant owners can view their tenant billing
CREATE POLICY "Tenant owners can view their tenant billing" ON public.tenant_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_billing.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role = 'owner'
      AND tu.is_active = true
    )
  );

-- =============================================
-- HELPER FUNCTIONS FOR TENANT ADMIN
-- =============================================

-- Function to check if current user is tenant owner
CREATE OR REPLACE FUNCTION public.is_tenant_owner(tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = $1 
    AND user_id = auth.uid() 
    AND role = 'owner'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = $1 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is tenant member
CREATE OR REPLACE FUNCTION public.is_tenant_member(tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = $1 
    AND user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's tenant roles
CREATE OR REPLACE FUNCTION public.get_user_tenant_roles()
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  role TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    tu.role,
    tu.permissions
  FROM public.tenants t
  JOIN public.tenant_users tu ON t.id = tu.tenant_id
  WHERE tu.user_id = auth.uid() 
  AND tu.is_active = true
  AND t.is_active = true
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
