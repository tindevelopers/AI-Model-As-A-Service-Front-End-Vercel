// Tenant Admin Types

export interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial'
  max_users: number
  max_api_calls_per_month: number
  is_active: boolean
  created_at: string
  owner_email?: string
  member_count?: number
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: Record<string, unknown>
  invited_by?: string
  invited_at: string
  joined_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TenantApiKey {
  id: string
  tenant_id: string
  name: string
  key_prefix: string
  permissions: string[]
  is_active: boolean
  last_used_at?: string
  expires_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TenantUsageStats {
  id: string
  tenant_id: string
  user_id?: string
  api_key_id?: string
  model_name: string
  provider: string
  request_tokens: number
  response_tokens: number
  total_tokens: number
  cost_usd: number
  request_duration_ms?: number
  status: 'success' | 'error' | 'timeout'
  error_message?: string
  created_at: string
}

export interface TenantBilling {
  id: string
  tenant_id: string
  billing_period_start: string
  billing_period_end: string
  total_api_calls: number
  total_tokens: number
  total_cost_usd: number
  subscription_fee_usd: number
  total_amount_usd: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_date?: string
  invoice_url?: string
  created_at: string
  updated_at: string
}

export interface TenantStatistics {
  total_members: number
  active_members: number
  total_api_keys: number
  active_api_keys: number
  total_requests: number
  total_tokens: number
  total_cost: number
  requests_today: number
  tokens_today: number
  cost_today: number
  requests_this_month: number
  tokens_this_month: number
  cost_this_month: number
}

export interface TenantBillingSummary {
  current_period_start: string
  current_period_end: string
  total_api_calls: number
  total_tokens: number
  total_cost_usd: number
  subscription_fee_usd: number
  total_amount_usd: number
  payment_status: string
  last_payment_date?: string
}

export interface UserTenantRole {
  tenant_id: string
  tenant_name: string
  tenant_slug: string
  role: string
  permissions: Record<string, unknown>
}

export interface MenuSection {
  id: string
  title: string
  icon: string
  path: string
  enabled: boolean
  subsections?: Array<{
    title: string
    path: string
  }>
}

export interface TenantAdminMenu {
  tenant_id: string
  user_role: string
  sections: MenuSection[]
}

// API Request/Response Types
export interface CreateTenantRequest {
  name: string
  slug: string
  description?: string
  owner_user_id?: string
}

export interface InviteUserRequest {
  tenant_id: string
  user_id: string
  role?: 'owner' | 'admin' | 'member' | 'viewer'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
