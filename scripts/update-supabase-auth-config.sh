#!/bin/bash

# Update Supabase Auth Configuration Script
# This script updates the auth settings for the remote Supabase project

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Updating Supabase Auth Configuration${NC}"
echo "========================================"
echo ""

PROJECT_REF="zxkazryizcxvhkibtpvc"
SITE_URL="https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app"

echo -e "${YELLOW}📋 Configuration to apply:${NC}"
echo "- Site URL: $SITE_URL"
echo "- Additional redirect URLs:"
echo "  - https://127.0.0.1:3000"
echo "  - http://localhost:3000"
echo "  - $SITE_URL"
echo "  - $SITE_URL/auth/reset-password"
echo ""

# Note: The Supabase CLI doesn't have direct commands to update auth settings
# These need to be updated via the dashboard or management API
echo -e "${BLUE}📝 Manual Configuration Required:${NC}"
echo ""
echo -e "${YELLOW}Please update these settings in your Supabase Dashboard:${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
echo ""
echo "2. Update 'Site URL' to:"
echo "   $SITE_URL"
echo ""
echo "3. Update 'Redirect URLs' to include:"
echo "   - https://127.0.0.1:3000"
echo "   - http://localhost:3000"
echo "   - $SITE_URL"
echo "   - $SITE_URL/auth/reset-password"
echo ""
echo "4. Scroll to 'Email Templates' section"
echo "5. For 'Reset Password' template:"
echo "   - Subject: 'Reset Your Password - AI Model as a Service'"
echo "   - Use the custom template we created in supabase/templates/recovery.html"
echo ""

# Check if we can open the browser
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Opening Supabase Dashboard...${NC}"
    open "https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
elif command -v xdg-open &> /dev/null; then
    echo -e "${BLUE}🌐 Opening Supabase Dashboard...${NC}"
    xdg-open "https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
else
    echo -e "${YELLOW}💡 Please manually open: https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings${NC}"
fi

echo ""
echo -e "${GREEN}✅ Configuration files updated locally${NC}"
echo -e "${YELLOW}⚠️  Manual dashboard configuration required for auth settings${NC}"
echo ""
echo -e "${BLUE}📋 Files updated:${NC}"
echo "- supabase/config.toml (auth settings)"
echo "- supabase/templates/recovery.html (password reset email template)"
echo ""
echo -e "${GREEN}🎉 Once you update the dashboard settings, password reset will be fully functional!${NC}"

