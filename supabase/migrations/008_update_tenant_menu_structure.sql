-- AI Model as a Service - Update Tenant Menu Structure
-- Add API Keys section to tenant admin menu

-- Function to get updated tenant admin menu structure
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
      -- API Keys section (all members) - New dedicated section
      jsonb_build_object(
        'id', 'api-keys',
        'title', 'API Keys & Provisioning',
        'icon', 'api',
        'path', '/tenant/api-keys',
        'enabled', true,
        'subsections', jsonb_build_array(
          jsonb_build_object('title', 'API Keys', 'path', '/tenant/api-keys'),
          jsonb_build_object('title', 'Provisioning Keys', 'path', '/tenant/api-keys?tab=provisioning'),
          jsonb_build_object('title', 'Usage Analytics', 'path', '/tenant/api-keys?tab=analytics')
        )
      ),
      -- API section (all members) - Updated with better structure
      jsonb_build_object(
        'id', 'api',
        'title', 'API Management',
        'icon', 'api',
        'path', '/tenant/api',
        'enabled', true,
        'subsections', jsonb_build_array(
          jsonb_build_object('title', 'Usage Stats', 'path', '/tenant/api/usage'),
          jsonb_build_object('title', 'Rate Limits', 'path', '/tenant/api/limits'),
          jsonb_build_object('title', 'Documentation', 'path', '/tenant/api/docs'),
          jsonb_build_object('title', 'Webhooks', 'path', '/tenant/api/webhooks')
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
          jsonb_build_object('title', 'Subscription', 'path', '/tenant/billing/subscription'),
          jsonb_build_object('title', 'Invoices', 'path', '/tenant/billing/invoices')
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
          jsonb_build_object('title', 'Settings', 'path', '/tenant/configuration/settings'),
          jsonb_build_object('title', 'Security', 'path', '/tenant/configuration/security')
        )
      )
    )
  );
  
  RETURN menu_structure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
