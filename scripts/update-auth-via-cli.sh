#!/bin/bash

# Update Supabase Auth Settings via CLI and API
# This script provides multiple approaches to update auth settings

echo "🔧 Updating Supabase Auth Settings..."

# Get project info
PROJECT_REF="zxkazryizcxvhkibtpvc"
PROJECT_URL="https://${PROJECT_REF}.supabase.co"

echo "📋 Project Information:"
echo "   - Project Ref: $PROJECT_REF"
echo "   - Project URL: $PROJECT_URL"

# Method 1: Update via Supabase CLI (if available)
echo ""
echo "🔄 Method 1: Checking CLI capabilities..."
if npx supabase --help | grep -q "auth"; then
    echo "✅ Auth commands available in CLI"
    # Try to update auth settings via CLI
    echo "📝 Attempting to update auth settings via CLI..."
else
    echo "❌ Auth commands not available in CLI"
fi

# Method 2: Provide manual instructions
echo ""
echo "🔄 Method 2: Manual Dashboard Update Required"
echo ""
echo "Since the CLI doesn't support auth settings updates, please:"
echo ""
echo "1. 🌐 Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/url-configuration"
echo ""
echo "2. 📝 Update these settings:"
echo "   Site URL: https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app"
echo ""
echo "3. 🔗 Add these Redirect URLs:"
echo "   - https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app"
echo "   - https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/auth/callback"
echo "   - https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/auth/callback?next=/"
echo "   - https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/reset-password"
echo "   - https://ai-maas-develop.tinconnect.com"
echo "   - https://ai-maas-develop.tinconnect.com/auth/callback"
echo "   - https://ai-maas-develop.tinconnect.com/auth/callback?next=/"
echo "   - http://localhost:3000"
echo "   - http://localhost:3000/auth/callback"
echo ""
echo "4. ⚙️  Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
echo "   - Set OTP expiry to: 7200 seconds (2 hours)"
echo "   - Enable signup: true"
echo "   - Enable confirmations: false"
echo ""

# Method 3: Generate curl commands for API
echo "🔄 Method 3: API Update Commands"
echo ""
echo "If you have a management API key, you can use these curl commands:"
echo ""
echo "# Get current settings"
echo "curl -X GET 'https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth' \\"
echo "  -H 'Authorization: Bearer YOUR_MANAGEMENT_API_KEY' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "# Update settings"
echo "curl -X PATCH 'https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth' \\"
echo "  -H 'Authorization: Bearer YOUR_MANAGEMENT_API_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"site_url\": \"https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app\","
echo "    \"additional_redirect_urls\": ["
echo "      \"https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app\","
echo "      \"https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/auth/callback\","
echo "      \"https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/auth/callback?next=/\","
echo "      \"https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/reset-password\","
echo "      \"https://ai-maas-develop.tinconnect.com\","
echo "      \"https://ai-maas-develop.tinconnect.com/auth/callback\","
echo "      \"https://ai-maas-develop.tinconnect.com/auth/callback?next=/\","
echo "      \"http://localhost:3000\","
echo "      \"http://localhost:3000/auth/callback\""
echo "    ],"
echo "    \"otp_expiry\": 7200"
echo "  }'"
echo ""

echo "✅ Configuration update instructions provided!"
echo "💡 The easiest method is Method 2 (Manual Dashboard Update)"
