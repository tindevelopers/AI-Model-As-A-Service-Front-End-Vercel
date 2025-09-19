-- AI Model as a Service - Tenant Admin Schema
-- Run this AFTER running all previous migration files
-- This creates the multi-tenant structure for tenant admin functionality

-- =============================================
-- TENANTS TABLE
-- =============================================

CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  description TEXT,
  settings JSONB DEFAULT '{}',
  billing_email TEXT,
  billing_address JSONB DEFAULT '{}',
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial')),
  subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  max_users INTEGER DEFAULT 5,
  max_api_calls_per_month INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_created_by ON public.tenants(created_by);
CREATE INDEX idx_tenants_subscription_status ON public.tenants(subscription_status);

-- =============================================
-- TENANT USERS TABLE (Many-to-Many relationship)
-- =============================================

CREATE TABLE public.tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Add updated_at trigger
CREATE TRIGGER tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON public.tenant_users(role);

-- =============================================
-- TENANT API KEYS TABLE
-- =============================================

CREATE TABLE public.tenant_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER tenant_api_keys_updated_at
  BEFORE UPDATE ON public.tenant_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_tenant_api_keys_tenant_id ON public.tenant_api_keys(tenant_id);
CREATE INDEX idx_tenant_api_keys_created_by ON public.tenant_api_keys(created_by);

-- =============================================
-- TENANT USAGE STATS TABLE
-- =============================================

CREATE TABLE public.tenant_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES public.tenant_api_keys(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  request_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (request_tokens + response_tokens) STORED,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  request_duration_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tenant_usage_stats_tenant_id ON public.tenant_usage_stats(tenant_id);
CREATE INDEX idx_tenant_usage_stats_user_id ON public.tenant_usage_stats(user_id);
CREATE INDEX idx_tenant_usage_stats_created_at ON public.tenant_usage_stats(created_at);
CREATE INDEX idx_tenant_usage_stats_api_key_id ON public.tenant_usage_stats(api_key_id);
CREATE INDEX idx_tenant_usage_stats_model_provider ON public.tenant_usage_stats(model_name, provider);

-- =============================================
-- TENANT BILLING TABLE
-- =============================================

CREATE TABLE public.tenant_billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_api_calls BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10,2) DEFAULT 0,
  subscription_fee_usd DECIMAL(10,2) DEFAULT 0,
  total_amount_usd DECIMAL(10,2) GENERATED ALWAYS AS (total_cost_usd + subscription_fee_usd) STORED,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER tenant_billing_updated_at
  BEFORE UPDATE ON public.tenant_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_tenant_billing_tenant_id ON public.tenant_billing(tenant_id);
CREATE INDEX idx_tenant_billing_period ON public.tenant_billing(billing_period_start, billing_period_end);
CREATE INDEX idx_tenant_billing_payment_status ON public.tenant_billing(payment_status);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_billing ENABLE ROW LEVEL SECURITY;
