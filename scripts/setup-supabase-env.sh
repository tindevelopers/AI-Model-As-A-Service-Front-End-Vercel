#!/bin/bash

# Supabase Environment Setup Script for Vercel
# This script helps configure Supabase environment variables in Vercel

set -e

echo "🚀 AI Model Service - Supabase Environment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed.${NC}"
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

echo -e "${BLUE}📋 Please provide your Supabase credentials:${NC}"
echo "You can find these in your Supabase project dashboard → Settings → API"
echo ""

# Get Supabase URL
echo -e "${YELLOW}🔗 Supabase Project URL:${NC}"
echo "Format: https://your-project-id.supabase.co"
read -p "Enter your Supabase URL: " SUPABASE_URL

if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo -e "${RED}❌ Invalid Supabase URL format. Should be: https://your-project-id.supabase.co${NC}"
    exit 1
fi

# Get Supabase Anon Key
echo ""
echo -e "${YELLOW}🔑 Supabase Anon/Public Key:${NC}"
echo "This key starts with 'eyJ' and is safe to expose publicly"
read -p "Enter your Supabase anon key: " SUPABASE_ANON_KEY

if [[ ! $SUPABASE_ANON_KEY =~ ^eyJ ]]; then
    echo -e "${RED}❌ Invalid anon key format. Should start with 'eyJ'${NC}"
    exit 1
fi

# Get Supabase Service Role Key
echo ""
echo -e "${YELLOW}🔐 Supabase Service Role Key:${NC}"
echo -e "${RED}⚠️  This is a SECRET key - never expose it publicly!${NC}"
echo "This key also starts with 'eyJ' but has admin privileges"
read -s -p "Enter your Supabase service role key: " SUPABASE_SERVICE_ROLE_KEY
echo ""

if [[ ! $SUPABASE_SERVICE_ROLE_KEY =~ ^eyJ ]]; then
    echo -e "${RED}❌ Invalid service role key format. Should start with 'eyJ'${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Configuring Vercel environment variables...${NC}"

# Set environment variables in Vercel
echo "Setting NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL"

echo "Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"

# Also set for preview environment
echo ""
echo -e "${BLUE}🔧 Setting up preview environment...${NC}"

vercel env add NEXT_PUBLIC_SUPABASE_URL preview <<< "$SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<< "$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo -e "${GREEN}✅ Supabase environment variables configured successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary of configured variables:${NC}"
echo "✅ NEXT_PUBLIC_SUPABASE_URL (production & preview)"
echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (production & preview)"
echo "✅ SUPABASE_SERVICE_ROLE_KEY (production & preview)"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Test your Supabase setup using the SQL queries in SUPABASE_SETUP_GUIDE.md"
echo "2. Create your super admin user"
echo "3. Deploy your frontend: git push origin main"
echo "4. Test authentication on your live site"
echo ""
echo -e "${BLUE}🔗 Your frontend URL:${NC}"
echo "https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
