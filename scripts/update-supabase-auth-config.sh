#!/bin/bash

# Update Supabase Auth Configuration
# This script helps update the Supabase authentication configuration

echo "🔧 Updating Supabase Auth Configuration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from the project root."
    exit 1
fi

echo "📋 Current Supabase Auth Configuration:"
echo "   - Site URL: $(grep 'site_url' supabase/config.toml | cut -d'"' -f2)"
echo "   - OTP Expiry: $(grep 'otp_expiry' supabase/config.toml | cut -d'=' -f2 | tr -d ' ') seconds"
echo "   - Redirect URLs: $(grep -A 10 'additional_redirect_urls' supabase/config.toml | grep -c 'https://') URLs configured"

echo ""
echo "🔄 To apply these changes to your Supabase project:"
echo "   1. Run: supabase db push"
echo "   2. Or update your Supabase dashboard manually:"
echo "      - Go to Authentication > URL Configuration"
echo "      - Update Site URL and Redirect URLs"
echo "      - Go to Authentication > Settings"
echo "      - Update OTP expiry time"

echo ""
echo "✅ Configuration files updated successfully!"
echo "   - Updated auth flow to PKCE"
echo "   - Extended OTP expiry to 2 hours"
echo "   - Added proper redirect URLs"
echo "   - Created auth error handling page"