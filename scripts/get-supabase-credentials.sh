#!/bin/bash

# Get Supabase Credentials Script
# Uses Supabase CLI to extract credentials from your linked project

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Supabase Credentials Extractor${NC}"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if project is linked
PROJECT_REF="zxkazryizcxvhkibtpvc"
echo -e "${GREEN}✅ Using project: $PROJECT_REF${NC}"
echo ""

# Display the information needed
echo -e "${BLUE}📋 Your Supabase Credentials:${NC}"
echo ""
echo -e "${YELLOW}Project URL:${NC}"
echo "https://$PROJECT_REF.supabase.co"
echo ""
echo -e "${YELLOW}To get your API keys:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo "2. Copy the 'anon public' key (starts with eyJ)"
echo "3. Copy the 'service_role' key (starts with eyJ) - keep this secret!"
echo ""
echo -e "${BLUE}📝 Environment Variables Format:${NC}"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_REF.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_YOUR_ANON_KEY_HERE"
echo "SUPABASE_SERVICE_ROLE_KEY=eyJ_YOUR_SERVICE_ROLE_KEY_HERE"
echo ""
echo -e "${YELLOW}💡 Tip: Copy these values and run the complete setup script:${NC}"
echo "./scripts/setup-complete-env.sh"
