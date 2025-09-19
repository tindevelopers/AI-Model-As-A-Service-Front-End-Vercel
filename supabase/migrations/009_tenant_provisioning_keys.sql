-- AI Model as a Service - Tenant Provisioning Keys
-- This file defines tables and functions for external LLM provider integration

-- =============================================
-- TENANT PROVISIONING KEYS TABLE
-- =============================================

CREATE TABLE public.tenant_provisioning_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'azure', 'aws', 'custom')),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('llm', 'embedding', 'image', 'audio', 'custom')),
  endpoint TEXT,
  api_key TEXT, -- Encrypted in production
  api_secret TEXT, -- For OAuth providers
  config JSONB DEFAULT '{}'::jsonb, -- Provider-specific configuration
  is_active BOOLEAN DEFAULT TRUE,
  usage_count BIGINT DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER tenant_provisioning_keys_updated_at
  BEFORE UPDATE ON public.tenant_provisioning_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_tenant_provisioning_keys_tenant_id ON public.tenant_provisioning_keys(tenant_id);
CREATE INDEX idx_tenant_provisioning_keys_provider ON public.tenant_provisioning_keys(provider);
CREATE INDEX idx_tenant_provisioning_keys_created_by ON public.tenant_provisioning_keys(created_by);

-- =============================================
-- TENANT API KEY USAGE TRACKING TABLE
-- =============================================

CREATE TABLE public.tenant_api_key_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.tenant_api_keys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tenant_api_key_usage_tenant_id ON public.tenant_api_key_usage(tenant_id);
CREATE INDEX idx_tenant_api_key_usage_api_key_id ON public.tenant_api_key_usage(api_key_id);
CREATE INDEX idx_tenant_api_key_usage_created_at ON public.tenant_api_key_usage(created_at);
CREATE INDEX idx_tenant_api_key_usage_endpoint ON public.tenant_api_key_usage(endpoint);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.tenant_provisioning_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_api_key_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR PROVISIONING KEYS
-- =============================================

-- Superadmins can view all provisioning keys
CREATE POLICY "Superadmins can view all provisioning keys" ON public.tenant_provisioning_keys
  FOR SELECT USING (public.is_superadmin());

-- Superadmins can manage all provisioning keys
CREATE POLICY "Superadmins can manage all provisioning keys" ON public.tenant_provisioning_keys
  FOR ALL USING (public.is_superadmin());

-- Tenant owners and admins can view their provisioning keys
CREATE POLICY "Tenant owners and admins can view their provisioning keys" ON public.tenant_provisioning_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_provisioning_keys.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Tenant owners and admins can manage their provisioning keys
CREATE POLICY "Tenant owners and admins can manage their provisioning keys" ON public.tenant_provisioning_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_provisioning_keys.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- =============================================
-- RLS POLICIES FOR API KEY USAGE
-- =============================================

-- Superadmins can view all usage data
CREATE POLICY "Superadmins can view all API key usage" ON public.tenant_api_key_usage
  FOR SELECT USING (public.is_superadmin());

-- Tenant owners and admins can view their usage data
CREATE POLICY "Tenant owners and admins can view their API key usage" ON public.tenant_api_key_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_api_key_usage.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin')
      AND tu.is_active = true
    )
  );

-- Users can view their own usage data
CREATE POLICY "Users can view their own API key usage" ON public.tenant_api_key_usage
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_api_key_usage.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.is_active = true
    )
  );

-- System can insert usage data
CREATE POLICY "System can insert API key usage" ON public.tenant_api_key_usage
  FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCTIONS FOR PROVISIONING KEYS
-- =============================================

-- Function to get tenant provisioning keys
CREATE OR REPLACE FUNCTION public.get_tenant_provisioning_keys(target_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  provider TEXT,
  provider_type TEXT,
  endpoint TEXT,
  is_active BOOLEAN,
  usage_count BIGINT,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  config JSONB
) AS $$
BEGIN
  -- Check if current user has access to this tenant
  IF NOT (public.is_superadmin() OR public.is_tenant_admin(target_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges';
  END IF;
  
  RETURN QUERY
  SELECT 
    tpk.id,
    tpk.name,
    tpk.provider,
    tpk.provider_type,
    tpk.endpoint,
    tpk.is_active,
    tpk.usage_count,
    tpk.last_used,
    tpk.created_at,
    tpk.config
  FROM public.tenant_provisioning_keys tpk
  WHERE tpk.tenant_id = target_tenant_id
  ORDER BY tpk.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create provisioning key
CREATE OR REPLACE FUNCTION public.create_tenant_provisioning_key(
  target_tenant_id UUID,
  key_name TEXT,
  key_provider TEXT,
  key_provider_type TEXT,
  key_endpoint TEXT DEFAULT NULL,
  key_config JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  new_key_id UUID;
BEGIN
  -- Check if current user has access to this tenant
  IF NOT (public.is_superadmin() OR public.is_tenant_admin(target_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges';
  END IF;
  
  -- Create provisioning key
  INSERT INTO public.tenant_provisioning_keys (
    tenant_id,
    name,
    provider,
    provider_type,
    endpoint,
    config,
    created_by
  ) VALUES (
    target_tenant_id,
    key_name,
    key_provider,
    key_provider_type,
    key_endpoint,
    key_config,
    auth.uid()
  ) RETURNING id INTO new_key_id;
  
  RETURN new_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTIONS FOR API KEY USAGE ANALYTICS
-- =============================================

-- Function to get API key usage statistics
CREATE OR REPLACE FUNCTION public.get_tenant_api_usage_stats(
  target_tenant_id UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  avg_response_time_ms NUMERIC,
  total_request_size_bytes BIGINT,
  total_response_size_bytes BIGINT,
  unique_users BIGINT,
  top_endpoints JSONB,
  hourly_usage JSONB
) AS $$
BEGIN
  -- Check if current user has access to this tenant
  IF NOT (public.is_superadmin() OR public.is_tenant_admin(target_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges';
  END IF;
  
  -- Set default date range if not provided
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := CURRENT_DATE + INTERVAL '1 day';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END)::BIGINT as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END)::BIGINT as failed_requests,
    ROUND(AVG(response_time_ms), 2)::NUMERIC as avg_response_time_ms,
    COALESCE(SUM(request_size_bytes), 0)::BIGINT as total_request_size_bytes,
    COALESCE(SUM(response_size_bytes), 0)::BIGINT as total_response_size_bytes,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'endpoint', endpoint,
          'count', count
        )
      )
      FROM (
        SELECT endpoint, COUNT(*) as count
        FROM public.tenant_api_key_usage
        WHERE tenant_id = target_tenant_id
        AND created_at >= start_date
        AND created_at < end_date
        GROUP BY endpoint
        ORDER BY count DESC
        LIMIT 10
      ) top_endpoints
    ) as top_endpoints,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'hour', hour,
          'count', count
        )
      )
      FROM (
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as count
        FROM public.tenant_api_key_usage
        WHERE tenant_id = target_tenant_id
        AND created_at >= start_date
        AND created_at < end_date
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour
      ) hourly_data
    ) as hourly_usage
  FROM public.tenant_api_key_usage
  WHERE tenant_id = target_tenant_id
  AND created_at >= start_date
  AND created_at < end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API key usage
CREATE OR REPLACE FUNCTION public.log_api_key_usage(
  target_tenant_id UUID,
  target_api_key_id UUID,
  target_user_id UUID DEFAULT NULL,
  request_endpoint TEXT,
  request_method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER DEFAULT NULL,
  response_size_bytes INTEGER DEFAULT NULL,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO public.tenant_api_key_usage (
    tenant_id,
    api_key_id,
    user_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    request_size_bytes,
    response_size_bytes,
    ip_address,
    user_agent
  ) VALUES (
    target_tenant_id,
    target_api_key_id,
    target_user_id,
    request_endpoint,
    request_method,
    status_code,
    response_time_ms,
    request_size_bytes,
    response_size_bytes,
    ip_address,
    user_agent
  ) RETURNING id INTO usage_id;
  
  -- Update last used timestamp on the API key
  UPDATE public.tenant_api_keys
  SET last_used = NOW()
  WHERE id = target_api_key_id;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
