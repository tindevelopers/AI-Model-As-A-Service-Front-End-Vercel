# Tenant Admin Implementation Guide

## Overview

This document outlines the multi-tenant admin structure implemented for the AI Model as a Service platform. The system provides role-based access control with three main user types: **Superadmin**, **Tenant Admin**, and **Tenant Member**.

## Database Schema

### Core Tables

#### 1. `tenants`
Stores tenant information and subscription details.
- **Primary Key**: `id` (UUID)
- **Unique Identifier**: `slug` (URL-friendly)
- **Subscription Management**: Plan, status, limits
- **Billing Information**: Email, address, payment details

#### 2. `tenant_users`
Many-to-many relationship between users and tenants with roles.
- **Roles**: `owner`, `admin`, `member`, `viewer`
- **Permissions**: JSONB field for granular permissions
- **Invitation System**: Tracks who invited whom

#### 3. `tenant_api_keys`
API keys specific to tenants (separate from user API keys).
- **Tenant-scoped**: Keys belong to tenants, not individual users
- **Usage Tracking**: Last used, expiration dates
- **Permissions**: Array of allowed operations

#### 4. `tenant_usage_stats`
Usage statistics aggregated by tenant.
- **Token Tracking**: Request/response tokens
- **Cost Calculation**: USD cost per request
- **Performance Metrics**: Request duration, error tracking

#### 5. `tenant_billing`
Billing information and payment history.
- **Billing Periods**: Monthly billing cycles
- **Cost Breakdown**: API usage + subscription fees
- **Payment Status**: Pending, paid, failed, refunded

## User Roles & Permissions

### Superadmin
- **Access**: Full system access
- **Capabilities**:
  - Create/manage all tenants
  - View all tenant data
  - Manage user roles across tenants
  - Access system-wide analytics

### Tenant Owner
- **Access**: Full tenant access
- **Capabilities**:
  - Manage tenant settings
  - Invite/remove users
  - Access billing information
  - Manage API keys
  - View all tenant analytics

### Tenant Admin
- **Access**: Limited tenant access
- **Capabilities**:
  - Manage team members (except owners)
  - Manage API keys
  - View tenant analytics
  - Configure tenant settings

### Tenant Member
- **Access**: Basic tenant access
- **Capabilities**:
  - View dashboard
  - Manage own API keys
  - View own usage stats

### Tenant Viewer
- **Access**: Read-only access
- **Capabilities**:
  - View dashboard
  - View usage stats (read-only)

## API Functions

### Tenant Management (Superadmin Only)

#### `create_tenant(name, slug, description, owner_user_id)`
Creates a new tenant with the specified owner.

#### `get_all_tenants()`
Returns all tenants with member counts and owner information.

### Tenant User Management

#### `invite_user_to_tenant(tenant_id, user_id, role)`
Invites a user to a tenant with a specific role.

#### `remove_user_from_tenant(tenant_id, user_id)`
Removes a user from a tenant (deactivates membership).

#### `get_user_tenant_roles()`
Returns all tenants the current user belongs to with their roles.

### Analytics & Reporting

#### `get_tenant_statistics(tenant_id)`
Returns comprehensive statistics for a tenant including:
- Member counts
- API key usage
- Request/token statistics
- Cost breakdowns

#### `get_tenant_billing_summary(tenant_id)`
Returns billing information for the current period.

### Menu Structure

#### `get_tenant_admin_menu(tenant_id)`
Returns the complete menu structure for tenant admin interface based on user role.

**Menu Sections**:
1. **Dashboard** - Overview and key metrics
2. **API Management** - API keys, usage stats, documentation
3. **Billing** - Usage, payment history, subscription (owners only)
4. **Configuration** - Team management, permissions, settings (admins only)

## Row Level Security (RLS)

All tenant tables have comprehensive RLS policies:

- **Superadmins**: Full access to all tenant data
- **Tenant Owners/Admins**: Access to their tenant's data only
- **Tenant Members**: Access to their own data within their tenants
- **System**: Can insert usage statistics

## Frontend Integration

### Required API Endpoints

```typescript
// Get tenant admin menu
GET /api/tenant/menu?tenant_id={id}

// Get tenant statistics
GET /api/tenant/stats?tenant_id={id}

// Get billing information
GET /api/tenant/billing?tenant_id={id}

// Invite user to tenant
POST /api/tenant/invite
{
  "tenant_id": "uuid",
  "user_id": "uuid", 
  "role": "member|admin"
}

// Remove user from tenant
DELETE /api/tenant/users/{user_id}?tenant_id={id}
```

### Menu Structure Response

```json
{
  "tenant_id": "uuid",
  "user_role": "owner|admin|member|viewer",
  "sections": [
    {
      "id": "dashboard",
      "title": "Dashboard",
      "icon": "dashboard",
      "path": "/tenant/dashboard",
      "enabled": true
    },
    {
      "id": "api",
      "title": "API Management", 
      "icon": "api",
      "path": "/tenant/api",
      "enabled": true,
      "subsections": [
        {"title": "API Keys", "path": "/tenant/api/keys"},
        {"title": "Usage Stats", "path": "/tenant/api/usage"},
        {"title": "Documentation", "path": "/tenant/api/docs"}
      ]
    },
    {
      "id": "billing",
      "title": "Billing",
      "icon": "billing", 
      "path": "/tenant/billing",
      "enabled": true,
      "subsections": [
        {"title": "Current Usage", "path": "/tenant/billing/usage"},
        {"title": "Payment History", "path": "/tenant/billing/history"},
        {"title": "Subscription", "path": "/tenant/billing/subscription"}
      ]
    },
    {
      "id": "configuration",
      "title": "Configuration",
      "icon": "settings",
      "path": "/tenant/configuration", 
      "enabled": true,
      "subsections": [
        {"title": "Team Members", "path": "/tenant/configuration/team"},
        {"title": "Permissions", "path": "/tenant/configuration/permissions"},
        {"title": "Settings", "path": "/tenant/configuration/settings"}
      ]
    }
  ]
}
```

## Migration Files

1. **005_tenant_admin_schema.sql** - Creates all tenant-related tables
2. **006_tenant_admin_rls_policies.sql** - Implements RLS policies
3. **007_tenant_admin_functions.sql** - Creates all admin functions
4. **test_tenant_admin_setup.sql** - Test script for verification

## Testing

Run the test script to verify the implementation:

```sql
-- Execute in Supabase SQL Editor
\i supabase/test_tenant_admin_setup.sql
```

## Security Considerations

1. **Authentication**: All functions require valid Supabase authentication
2. **Authorization**: Role-based access control at function and RLS level
3. **Input Validation**: Validate all inputs at the API layer
4. **Audit Trail**: Track all admin actions for compliance
5. **Rate Limiting**: Implement rate limiting for admin functions

## Next Steps

1. **Phase 2**: Implement frontend components for tenant admin interface
2. **API Integration**: Create REST endpoints for all functions
3. **Testing**: Comprehensive testing with different user roles
4. **Documentation**: API documentation and user guides
5. **Monitoring**: Implement logging and monitoring for admin actions

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user role and tenant membership
2. **RLS Violations**: Verify RLS policies are correctly applied
3. **Function Errors**: Check function parameters and authentication
4. **Menu Not Loading**: Verify tenant_id and user permissions

### Debug Queries

```sql
-- Check user's tenant roles
SELECT * FROM public.get_user_tenant_roles();

-- Verify tenant membership
SELECT * FROM public.tenant_users WHERE user_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```
