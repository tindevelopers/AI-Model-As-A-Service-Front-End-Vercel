#!/bin/bash

# Test Tenant Management Script
# This script helps test the tenant management functionality

echo "🔍 Testing Tenant Management Functionality"
echo "=========================================="

BASE_URL="https://ai-maas-develop.tinconnect.com"

echo ""
echo "📋 Available Test URLs:"
echo "======================="
echo "1. Debug Page: $BASE_URL/tenant-management/debug"
echo "2. Tenant Management: $BASE_URL/tenant-management"
echo "3. Create Tenant: $BASE_URL/tenant-management/create"
echo "4. API - Get Tenants: $BASE_URL/api/admin/tenants"
echo "5. API - Get Tenant Roles: $BASE_URL/api/tenant/roles"
echo "6. API - Test Tenant Roles: $BASE_URL/api/test-tenant-roles"

echo ""
echo "🧪 Testing API Endpoints (without authentication):"
echo "=================================================="

echo ""
echo "Testing /api/tenant/roles (should return 401):"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/api/tenant/roles" | head -1

echo ""
echo "Testing /api/admin/tenants (should return 401):"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/api/admin/tenants" | head -1

echo ""
echo "Testing /api/test-tenant-roles (should return 401):"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/api/test-tenant-roles" | head -1

echo ""
echo "📝 Instructions for Manual Testing:"
echo "==================================="
echo "1. Open your browser and go to: $BASE_URL"
echo "2. Sign in with: tenantadmin@tin.info"
echo "3. Look for the 'Auth Debug' button in the bottom right corner"
echo "4. Click it to see authentication status"
echo "5. Try to navigate to: $BASE_URL/tenant-management"
echo "6. If it redirects to dashboard, check the debug panel for role information"
echo "7. Visit the debug page: $BASE_URL/tenant-management/debug"

echo ""
echo "🔧 Troubleshooting Steps:"
echo "========================"
echo "1. Check if user has correct role in database"
echo "2. Verify session cookies are being set"
echo "3. Check browser console for errors"
echo "4. Use the Auth Debug panel to see authentication status"
echo "5. Check server logs for authentication errors"

echo ""
echo "✅ Test completed!"
