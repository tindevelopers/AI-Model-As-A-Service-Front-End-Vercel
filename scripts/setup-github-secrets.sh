#!/bin/bash

# Setup GitHub Secrets for AI Model Service Frontend
# This script helps configure all required secrets for GitHub Actions deployment

set -e  # Exit on any error

echo "🔐 Setting up GitHub Secrets for AI Model Service Frontend"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if GitHub CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI not authenticated. Please login first:${NC}"
    echo "gh auth login"
    exit 1
fi

# Get repository information
REPO_INFO=$(gh repo view --json owner,name)
REPO_OWNER=$(echo $REPO_INFO | jq -r '.owner.login')
REPO_NAME=$(echo $REPO_INFO | jq -r '.name')

echo -e "${BLUE}📋 Repository: ${REPO_OWNER}/${REPO_NAME}${NC}"

# Check if .vercel directory exists
if [ ! -d ".vercel" ]; then
    echo -e "${RED}❌ Error: .vercel directory not found. Please run 'vercel link' first.${NC}"
    exit 1
fi

# Read Vercel project details
if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(jq -r '.projectId' .vercel/project.json)
    ORG_ID=$(jq -r '.orgId' .vercel/project.json)
    PROJECT_NAME=$(jq -r '.projectName' .vercel/project.json)
    
    echo -e "${BLUE}📋 Vercel Project: ${PROJECT_NAME}${NC}"
    echo -e "${BLUE}📋 Project ID: ${PROJECT_ID}${NC}"
    echo -e "${BLUE}📋 Org ID: ${ORG_ID}${NC}"
else
    echo -e "${RED}❌ Error: .vercel/project.json not found. Please run 'vercel link' first.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔑 To get your Vercel token:${NC}"
echo "1. Visit: https://vercel.com/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Give it a name like 'GitHub Actions - AI Model Service'"
echo "4. Set expiration as needed (recommend 'No Expiration' for production)"
echo "5. Copy the token"
echo ""

# Prompt for Vercel token
read -p "Enter your Vercel token: " -s VERCEL_TOKEN
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ Error: Vercel token is required.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Setting GitHub repository secrets...${NC}"

# Set Vercel secrets
echo "Setting VERCEL_TOKEN..."
echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN

echo "Setting VERCEL_ORG_ID..."
echo "$ORG_ID" | gh secret set VERCEL_ORG_ID

echo "Setting VERCEL_PROJECT_ID..."
echo "$PROJECT_ID" | gh secret set VERCEL_PROJECT_ID

echo ""
echo -e "${YELLOW}📋 Next, you need to set your application secrets:${NC}"
echo ""

# Prompt for Supabase URL
read -p "Enter your Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
if [ ! -z "$SUPABASE_URL" ]; then
    echo "$SUPABASE_URL" | gh secret set NEXT_PUBLIC_SUPABASE_URL
    echo "✅ Set NEXT_PUBLIC_SUPABASE_URL"
fi

# Prompt for Supabase Anon Key
read -p "Enter your Supabase Anon Key: " -s SUPABASE_ANON_KEY
echo ""
if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    echo "$SUPABASE_ANON_KEY" | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo "✅ Set NEXT_PUBLIC_SUPABASE_ANON_KEY"
fi

# Prompt for Gateway URL
read -p "Enter your Gateway URL (https://xxx.run.app): " GATEWAY_URL
if [ ! -z "$GATEWAY_URL" ]; then
    echo "$GATEWAY_URL" | gh secret set NEXT_PUBLIC_GATEWAY_URL
    echo "✅ Set NEXT_PUBLIC_GATEWAY_URL"
fi

# Prompt for Supabase Service Role Key (optional)
echo ""
read -p "Enter your Supabase Service Role Key (optional, for server-side operations): " -s SUPABASE_SERVICE_KEY
echo ""
if [ ! -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "$SUPABASE_SERVICE_KEY" | gh secret set SUPABASE_SERVICE_ROLE_KEY
    echo "✅ Set SUPABASE_SERVICE_ROLE_KEY"
fi

# Prompt for Gateway Admin API Key (optional)
read -p "Enter your Gateway Admin API Key (optional): " -s GATEWAY_ADMIN_KEY
echo ""
if [ ! -z "$GATEWAY_ADMIN_KEY" ]; then
    echo "$GATEWAY_ADMIN_KEY" | gh secret set GATEWAY_ADMIN_API_KEY
    echo "✅ Set GATEWAY_ADMIN_API_KEY"
fi

# Optional: Release token for creating releases
echo ""
read -p "Do you want to create releases automatically? (y/n): " CREATE_RELEASES
if [[ $CREATE_RELEASES =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}For automatic releases, you need a GitHub token with 'repo' permissions:${NC}"
    echo "1. Visit: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo ""
    read -p "Enter your GitHub token for releases (optional): " -s RELEASE_TOKEN
    echo ""
    if [ ! -z "$RELEASE_TOKEN" ]; then
        echo "$RELEASE_TOKEN" | gh secret set RELEASE_TOKEN
        echo "✅ Set RELEASE_TOKEN"
    fi
fi

echo ""
echo -e "${GREEN}🎉 GitHub secrets setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Secrets configured:${NC}"
echo "✅ VERCEL_TOKEN"
echo "✅ VERCEL_ORG_ID"
echo "✅ VERCEL_PROJECT_ID"

if [ ! -z "$SUPABASE_URL" ]; then echo "✅ NEXT_PUBLIC_SUPABASE_URL"; fi
if [ ! -z "$SUPABASE_ANON_KEY" ]; then echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY"; fi
if [ ! -z "$GATEWAY_URL" ]; then echo "✅ NEXT_PUBLIC_GATEWAY_URL"; fi
if [ ! -z "$SUPABASE_SERVICE_KEY" ]; then echo "✅ SUPABASE_SERVICE_ROLE_KEY"; fi
if [ ! -z "$GATEWAY_ADMIN_KEY" ]; then echo "✅ GATEWAY_ADMIN_API_KEY"; fi
if [ ! -z "$RELEASE_TOKEN" ]; then echo "✅ RELEASE_TOKEN"; fi

echo ""
echo -e "${GREEN}🚀 Your next push to main branch will trigger automatic deployment!${NC}"
echo ""
echo -e "${BLUE}📚 View your secrets at:${NC}"
echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/secrets/actions"
